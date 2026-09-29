"""
core/storage_manager.py
========================
Centralized storage manager for the MediaPipeline system.

Manages the full lifecycle of per-session storage:
  - Session creation (directory tree + metadata JSON)
  - Path resolution (type-safe, always absolute)
  - Session metadata read/write
  - File inventory (frames, results, visualizations)
  - Disk usage calculation
  - Cleanup operations (frames-only or full session)
  - Session listing with status + size info
  - Basic file locking to prevent concurrent access corruption

Directory layout per session:
  storage/
  ├── uploads/{session_id}/
  │   └── {original_filename}          ← raw uploaded video
  ├── frames/{session_id}/
  │   ├── frame_000000.jpg             ← extracted frames
  │   └── frame_000001.jpg
  ├── results/{session_id}/
  │   ├── motion_data.json             ← main output
  │   ├── motion_data.csv              ← ML-ready flat CSV
  │   └── session_meta.json            ← session metadata
  ├── visualizations/{session_id}/
  │   ├── skeleton_video.mp4
  │   ├── preview.gif
  │   └── 3d_frame_{n}.png
  └── logs/{session_id}.log            ← per-session log

Usage:
    from core.storage_manager import storage_manager

    paths = storage_manager.create_session("abc-123")
    storage_manager.write_session_meta("abc-123", {"status": "DONE"})
    storage_manager.cleanup_frames("abc-123")
"""

from __future__ import annotations

import json
import os
import shutil
import threading
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterator, List, Optional

from core.config import settings
from core.logger import get_logger

log = get_logger("storage_manager")


# ─────────────────────────────────────────────────────────────────────────────
#  SessionPaths — type-safe path bundle for one session
# ─────────────────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class SessionPaths:
    """
    Immutable bundle of all absolute paths for a single processing session.
    All paths are guaranteed to be under the configured storage root.
    """
    session_id: str

    # ── Directories ──────────────────────────────────────────────────────────
    upload_dir:  Path   # storage/uploads/{session_id}/
    frames_dir:  Path   # storage/frames/{session_id}/
    results_dir: Path   # storage/results/{session_id}/
    viz_dir:     Path   # storage/visualizations/{session_id}/

    # ── Key files ────────────────────────────────────────────────────────────
    meta_file:         Path   # results/{session_id}/session_meta.json
    motion_json:       Path   # results/{session_id}/motion_data.json
    motion_csv:        Path   # results/{session_id}/motion_data.csv
    skeleton_video:    Path   # visualizations/{session_id}/skeleton_video.mp4
    skeleton_video_bk: Path   # visualizations/{session_id}/skeleton_video_black.mp4
    preview_gif:       Path   # visualizations/{session_id}/preview.gif
    session_log:       Path   # logs/{session_id}.log

    # ── Conveniences ─────────────────────────────────────────────────────────

    @property
    def all_dirs(self) -> List[Path]:
        return [self.upload_dir, self.frames_dir, self.results_dir, self.viz_dir]

    def frame_path(self, frame_number: int, ext: str = "jpg") -> Path:
        """Returns the expected path for a specific frame file."""
        return self.frames_dir / f"frame_{frame_number:06d}.{ext}"

    def viz_3d_path(self, frame_number: int) -> Path:
        """Returns the path for a 3D skeleton plot PNG."""
        return self.viz_dir / f"3d_frame_{frame_number:06d}.png"

    def viz_frame_path(self, frame_number: int) -> Path:
        """Returns the path for a skeleton overlay frame PNG."""
        return self.viz_dir / f"skeleton_frame_{frame_number:06d}.png"

    def upload_video_path(self, filename: str) -> Path:
        """Returns the full path where an uploaded video should be saved."""
        return self.upload_dir / filename

    def exists(self) -> bool:
        """True if the session upload directory exists."""
        return self.upload_dir.exists()

    def to_dict(self) -> Dict[str, str]:
        """Serialisable dict of all paths."""
        return {
            "session_id":      self.session_id,
            "upload_dir":      str(self.upload_dir),
            "frames_dir":      str(self.frames_dir),
            "results_dir":     str(self.results_dir),
            "viz_dir":         str(self.viz_dir),
            "meta_file":       str(self.meta_file),
            "motion_json":     str(self.motion_json),
            "motion_csv":      str(self.motion_csv),
            "skeleton_video":  str(self.skeleton_video),
            "preview_gif":     str(self.preview_gif),
            "session_log":     str(self.session_log),
        }


# ─────────────────────────────────────────────────────────────────────────────
#  SessionMeta — structured metadata stored per session
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class SessionMeta:
    """
    Metadata stored in session_meta.json for each session.
    Written at upload time, updated throughout the pipeline.
    """
    session_id:       str
    created_at:       str    = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at:       str    = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    status:           str    = "PENDING"
    athlete_id:       Optional[str] = None

    # ── Video info (populated at upload) ─────────────────────
    original_filename: Optional[str]   = None
    file_size_bytes:   Optional[int]   = None
    fps:               Optional[float] = None
    total_frames:      Optional[int]   = None
    duration_seconds:  Optional[float] = None
    width:             Optional[int]   = None
    height:            Optional[int]   = None
    codec:             Optional[str]   = None

    # ── Processing info (populated during/after processing) ──
    processed_frames:  Optional[int]   = None
    valid_frames:      Optional[int]   = None
    dropped_frames:    int             = 0
    avg_quality_score: Optional[float] = None
    processing_time_s: Optional[float] = None

    # ── Output paths (relative) ───────────────────────────────
    motion_json_exists:    bool = False
    motion_csv_exists:     bool = False
    skeleton_video_exists: bool = False
    preview_gif_exists:    bool = False

    # ── Error info ────────────────────────────────────────────
    error_message: Optional[str] = None

    def touch(self) -> None:
        """Update the updated_at timestamp."""
        self.updated_at = datetime.now(timezone.utc).isoformat()

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "SessionMeta":
        # Filter only known fields (forward-compatible)
        known = {f.name for f in cls.__dataclass_fields__.values()}  # type: ignore
        filtered = {k: v for k, v in data.items() if k in known}
        return cls(**filtered)


# ─────────────────────────────────────────────────────────────────────────────
#  DiskUsage — disk space info
# ─────────────────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class DiskUsage:
    """Disk usage breakdown for a session or the whole storage root."""
    upload_bytes:        int = 0
    frames_bytes:        int = 0
    results_bytes:       int = 0
    visualizations_bytes: int = 0
    total_bytes:         int = 0

    @property
    def total_mb(self) -> float:
        return self.total_bytes / (1024 * 1024)

    @property
    def total_gb(self) -> float:
        return self.total_bytes / (1024 ** 3)

    def summary(self) -> str:
        return (
            f"total={self.total_mb:.1f}MB  "
            f"uploads={self.upload_bytes/1024:.0f}KB  "
            f"frames={self.frames_bytes/(1024*1024):.1f}MB  "
            f"results={self.results_bytes/1024:.0f}KB  "
            f"viz={self.visualizations_bytes/(1024*1024):.1f}MB"
        )


# ─────────────────────────────────────────────────────────────────────────────
#  SessionInfo — lightweight summary used by list_sessions()
# ─────────────────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class SessionInfo:
    """Lightweight summary of a session — returned by list_sessions()."""
    session_id:      str
    status:          str
    created_at:      str
    updated_at:      str
    original_filename: Optional[str]
    duration_seconds:  Optional[float]
    processed_frames:  Optional[int]
    disk_usage:      DiskUsage
    has_results:     bool
    has_visualization: bool


# ─────────────────────────────────────────────────────────────────────────────
#  StorageManager
# ─────────────────────────────────────────────────────────────────────────────

class StorageManager:
    """
    Centralized manager for all MediaPipeline file I/O.

    Thread-safe via per-session locks.
    All paths returned are absolute and guaranteed to be within
    the configured storage root (prevents path traversal).

    Singleton: use the module-level `storage_manager` instance.
    """

    def __init__(self) -> None:
        self._locks: Dict[str, threading.Lock] = {}
        self._locks_lock = threading.Lock()
        log.info("StorageManager initialised | root={r}", r=str(settings.upload_dir_abs.parent))

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _session_lock(self, session_id: str) -> threading.Lock:
        """Returns the per-session threading lock (creates if needed)."""
        with self._locks_lock:
            if session_id not in self._locks:
                self._locks[session_id] = threading.Lock()
            return self._locks[session_id]

    def _safe_session_id(self, session_id: str) -> str:
        """
        Sanitises session_id to prevent path traversal.
        Raises ValueError if the ID contains directory separators.
        """
        if not session_id:
            raise ValueError("session_id must not be empty.")
        bad_chars = set("/\\..~")
        if any(c in session_id for c in bad_chars):
            raise ValueError(
                f"session_id '{session_id}' contains invalid characters. "
                "Use UUID format (alphanumeric + hyphens only)."
            )
        return session_id

    @staticmethod
    def _dir_size(path: Path) -> int:
        """Returns total byte size of all files in a directory (recursive)."""
        if not path.exists():
            return 0
        total = 0
        for entry in path.rglob("*"):
            if entry.is_file():
                try:
                    total += entry.stat().st_size
                except OSError:
                    pass
        return total

    @staticmethod
    def _write_json(path: Path, data: Dict[str, Any]) -> None:
        """Atomically writes a JSON file (write to tmp then rename)."""
        tmp = path.with_suffix(".tmp")
        tmp.write_text(json.dumps(data, indent=2, default=str), encoding="utf-8")
        tmp.replace(path)

    @staticmethod
    def _read_json(path: Path) -> Dict[str, Any]:
        """Reads and parses a JSON file. Returns {} if missing or corrupt."""
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (FileNotFoundError, json.JSONDecodeError):
            return {}

    # ── Path resolution ───────────────────────────────────────────────────────

    def get_session_paths(self, session_id: str) -> SessionPaths:
        """
        Returns the full SessionPaths bundle for a session.
        Does NOT create directories — call create_session() for that.

        Args:
            session_id: UUID of the session.

        Returns:
            SessionPaths with all absolute paths resolved.
        """
        sid = self._safe_session_id(session_id)

        upload_dir  = settings.upload_dir_abs  / sid
        frames_dir  = settings.frames_dir_abs  / sid
        results_dir = settings.results_dir_abs / sid
        viz_dir     = settings.viz_dir_abs     / sid

        return SessionPaths(
            session_id      = sid,
            upload_dir      = upload_dir,
            frames_dir      = frames_dir,
            results_dir     = results_dir,
            viz_dir         = viz_dir,
            meta_file       = results_dir / "session_meta.json",
            motion_json     = results_dir / "motion_data.json",
            motion_csv      = results_dir / "motion_data.csv",
            skeleton_video  = viz_dir / "skeleton_video.mp4",
            skeleton_video_bk = viz_dir / "skeleton_video_black.mp4",
            preview_gif     = viz_dir / "preview.gif",
            session_log     = settings.logs_dir_abs / f"{sid}.log",
        )

    # ── Session creation ──────────────────────────────────────────────────────

    def create_session(
        self,
        session_id: str,
        original_filename: Optional[str] = None,
        athlete_id: Optional[str] = None,
    ) -> SessionPaths:
        """
        Creates all storage directories for a new session and writes
        the initial session_meta.json.

        Args:
            session_id:        UUID for the new session.
            original_filename: The uploaded video filename (optional at creation).
            athlete_id:        Optional athlete identifier.

        Returns:
            SessionPaths with all directories already created.
        """
        sid   = self._safe_session_id(session_id)
        paths = self.get_session_paths(sid)

        with self._session_lock(sid):
            # Create all 4 session directories
            for d in paths.all_dirs:
                d.mkdir(parents=True, exist_ok=True)

            # Write initial metadata
            meta = SessionMeta(
                session_id=sid,
                status="PENDING",
                athlete_id=athlete_id,
                original_filename=original_filename,
            )
            self._write_json(paths.meta_file, meta.to_dict())

        log.info(
            "Session created | session_id={sid} | filename={fn}",
            sid=sid,
            fn=original_filename or "—",
        )
        return paths

    def session_exists(self, session_id: str) -> bool:
        """
        Returns True if ANY of the session's storage directories exist.
        Checks upload, frames, results, and viz dirs so that sessions
        partially cleaned up with keep_results=True are still detected.
        """
        try:
            paths = self.get_session_paths(session_id)
            return any(d.exists() for d in paths.all_dirs)
        except ValueError:
            return False

    # ── Metadata read/write ───────────────────────────────────────────────────

    def read_session_meta(self, session_id: str) -> SessionMeta:
        """
        Reads and returns the SessionMeta for a session.
        Returns a default PENDING meta if the file doesn't exist.

        Args:
            session_id: Session UUID.

        Returns:
            SessionMeta dataclass populated from session_meta.json.
        """
        paths = self.get_session_paths(session_id)
        with self._session_lock(session_id):
            data = self._read_json(paths.meta_file)
            if not data:
                return SessionMeta(session_id=session_id)
            return SessionMeta.from_dict(data)

    def write_session_meta(
        self, session_id: str, updates: Dict[str, Any]
    ) -> SessionMeta:
        """
        Merges `updates` into the existing session metadata and writes it back.
        Thread-safe — uses per-session lock.

        Args:
            session_id: Session UUID.
            updates:    Dict of fields to update (partial update — not full replace).

        Returns:
            Updated SessionMeta.
        """
        paths = self.get_session_paths(session_id)
        with self._session_lock(session_id):
            existing = self._read_json(paths.meta_file)
            existing.update(updates)
            existing["updated_at"] = datetime.now(timezone.utc).isoformat()
            self._write_json(paths.meta_file, existing)
            return SessionMeta.from_dict(existing)

    def update_status(
        self, session_id: str, status: str,
        error_message: Optional[str] = None
    ) -> None:
        """
        Shortcut to update only the pipeline status in session metadata.

        Args:
            session_id:    Session UUID.
            status:        One of ProcessingStatus values.
            error_message: Optional error detail for FAILED status.
        """
        updates: Dict[str, Any] = {"status": status}
        if error_message is not None:
            updates["error_message"] = error_message
        self.write_session_meta(session_id, updates)
        log.info(
            "Status updated | session_id={sid} | status={st}",
            sid=session_id, st=status,
        )

    # ── Frame management ──────────────────────────────────────────────────────

    def list_frames(self, session_id: str) -> List[Path]:
        """
        Returns sorted list of extracted frame paths for a session.

        Args:
            session_id: Session UUID.

        Returns:
            Sorted list of .jpg frame Paths (empty if none extracted yet).
        """
        frames_dir = self.get_session_paths(session_id).frames_dir
        if not frames_dir.exists():
            return []
        return sorted(frames_dir.glob("frame_*.jpg"))

    def frame_count(self, session_id: str) -> int:
        """Returns number of extracted frame files."""
        return len(self.list_frames(session_id))

    def iter_frames(self, session_id: str) -> Iterator[tuple[int, Path]]:
        """
        Yields (frame_index, frame_path) tuples in order.
        Memory-efficient — doesn't load all paths at once.
        """
        for i, path in enumerate(self.list_frames(session_id)):
            yield i, path

    def frame_exists(self, session_id: str, frame_number: int) -> bool:
        """Returns True if a specific frame file exists."""
        return self.get_session_paths(session_id).frame_path(frame_number).exists()

    # ── Results management ────────────────────────────────────────────────────

    def results_exist(self, session_id: str) -> bool:
        """Returns True if motion_data.json exists for a session."""
        return self.get_session_paths(session_id).motion_json.exists()

    def read_motion_json(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Reads and returns the motion_data.json as a dict.
        Returns None if the file doesn't exist.
        """
        paths = self.get_session_paths(session_id)
        if not paths.motion_json.exists():
            return None
        return self._read_json(paths.motion_json)

    def write_motion_json(
        self, session_id: str, data: Dict[str, Any]
    ) -> Path:
        """
        Atomically writes motion_data.json to the results directory.

        Args:
            session_id: Session UUID.
            data:       Motion data dict (serialisable to JSON).

        Returns:
            Path to the written file.
        """
        paths = self.get_session_paths(session_id)
        paths.results_dir.mkdir(parents=True, exist_ok=True)
        with self._session_lock(session_id):
            self._write_json(paths.motion_json, data)
        self.write_session_meta(session_id, {"motion_json_exists": True})
        log.info("motion_data.json written | session_id={sid}", sid=session_id)
        return paths.motion_json

    # ── Cleanup ───────────────────────────────────────────────────────────────

    def cleanup_frames(self, session_id: str) -> int:
        """
        Deletes all extracted frame files for a session to reclaim disk space.
        Called automatically after processing if AUTO_CLEANUP_FRAMES=true.

        Args:
            session_id: Session UUID.

        Returns:
            Number of frame files deleted.
        """
        paths = self.get_session_paths(session_id)
        frames_dir = paths.frames_dir

        if not frames_dir.exists():
            log.info("cleanup_frames: no frames dir | session_id={sid}", sid=session_id)
            return 0

        count = 0
        with self._session_lock(session_id):
            for f in frames_dir.glob("frame_*.jpg"):
                try:
                    f.unlink()
                    count += 1
                except OSError as e:
                    log.warning("Could not delete frame {f}: {e}", f=f.name, e=e)

        log.info(
            "Frames cleaned up | session_id={sid} | deleted={n} files",
            sid=session_id, n=count,
        )
        return count

    def cleanup_session(self, session_id: str, keep_results: bool = False) -> bool:
        """
        Deletes ALL data for a session (upload, frames, results, visualizations).

        Args:
            session_id:   Session UUID.
            keep_results: If True, preserves results/ (motion JSON + CSV) and
                          deletes everything else.

        Returns:
            True if cleanup succeeded, False if session didn't exist.
        """
        if not self.session_exists(session_id):
            log.warning(
                "cleanup_session: session not found | session_id={sid}", sid=session_id
            )
            return False

        paths = self.get_session_paths(session_id)
        with self._session_lock(session_id):
            dirs_to_remove = [paths.upload_dir, paths.frames_dir, paths.viz_dir]
            if not keep_results:
                dirs_to_remove.append(paths.results_dir)

            for d in dirs_to_remove:
                if d.exists():
                    shutil.rmtree(d, ignore_errors=True)
                    log.info("Removed dir | {d}", d=d)

            # Remove per-session log
            if paths.session_log.exists():
                paths.session_log.unlink(missing_ok=True)

        # Release the session lock
        with self._locks_lock:
            self._locks.pop(session_id, None)

        log.info(
            "Session cleaned up | session_id={sid} | keep_results={kr}",
            sid=session_id, kr=keep_results,
        )
        return True

    # ── Session listing ───────────────────────────────────────────────────────

    def list_sessions(
        self,
        status_filter: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> List[SessionInfo]:
        """
        Lists all sessions with lightweight summary info.
        Sorted by creation time (newest first).

        Args:
            status_filter: If given, only return sessions with this status.
            limit:         Max number of sessions to return.

        Returns:
            List of SessionInfo objects.
        """
        sessions: List[SessionInfo] = []

        uploads_root = settings.upload_dir_abs
        if not uploads_root.exists():
            return sessions

        for session_dir in sorted(
            uploads_root.iterdir(),
            key=lambda d: d.stat().st_mtime if d.is_dir() else 0,
            reverse=True,  # newest first
        ):
            if not session_dir.is_dir():
                continue

            sid   = session_dir.name
            paths = self.get_session_paths(sid)
            meta  = self.read_session_meta(sid)

            if status_filter and meta.status != status_filter:
                continue

            usage = self.get_disk_usage(sid)

            sessions.append(SessionInfo(
                session_id=sid,
                status=meta.status,
                created_at=meta.created_at,
                updated_at=meta.updated_at,
                original_filename=meta.original_filename,
                duration_seconds=meta.duration_seconds,
                processed_frames=meta.processed_frames,
                disk_usage=usage,
                has_results=paths.motion_json.exists(),
                has_visualization=paths.skeleton_video.exists(),
            ))

            if limit and len(sessions) >= limit:
                break

        return sessions

    def get_session_count(self) -> int:
        """Returns total number of sessions in storage."""
        uploads_root = settings.upload_dir_abs
        if not uploads_root.exists():
            return 0
        return sum(1 for d in uploads_root.iterdir() if d.is_dir())

    # ── Disk usage ────────────────────────────────────────────────────────────

    def get_disk_usage(self, session_id: str) -> DiskUsage:
        """
        Calculates disk usage breakdown for a single session.

        Args:
            session_id: Session UUID.

        Returns:
            DiskUsage with per-category byte counts.
        """
        paths = self.get_session_paths(session_id)
        upload_bytes = self._dir_size(paths.upload_dir)
        frames_bytes = self._dir_size(paths.frames_dir)
        results_bytes = self._dir_size(paths.results_dir)
        viz_bytes = self._dir_size(paths.viz_dir)

        return DiskUsage(
            upload_bytes=upload_bytes,
            frames_bytes=frames_bytes,
            results_bytes=results_bytes,
            visualizations_bytes=viz_bytes,
            total_bytes=upload_bytes + frames_bytes + results_bytes + viz_bytes,
        )

    def get_total_disk_usage(self) -> DiskUsage:
        """
        Calculates total disk usage across ALL sessions.

        Returns:
            DiskUsage with summed byte counts.
        """
        upload_bytes  = self._dir_size(settings.upload_dir_abs)
        frames_bytes  = self._dir_size(settings.frames_dir_abs)
        results_bytes = self._dir_size(settings.results_dir_abs)
        viz_bytes     = self._dir_size(settings.viz_dir_abs)

        return DiskUsage(
            upload_bytes=upload_bytes,
            frames_bytes=frames_bytes,
            results_bytes=results_bytes,
            visualizations_bytes=viz_bytes,
            total_bytes=upload_bytes + frames_bytes + results_bytes + viz_bytes,
        )

    def get_free_disk_space(self) -> int:
        """Returns free disk space in bytes on the storage volume."""
        stat = shutil.disk_usage(str(settings.upload_dir_abs))
        return stat.free

    def check_disk_space(self, required_bytes: int) -> bool:
        """
        Checks whether enough free disk space is available.

        Args:
            required_bytes: Estimated bytes needed.

        Returns:
            True if sufficient space is available (with 10% safety margin).
        """
        free = self.get_free_disk_space()
        needed = int(required_bytes * 1.1)   # 10% safety margin
        if free < needed:
            log.warning(
                "Low disk space: free={free}MB needed={needed}MB",
                free=free // (1024*1024),
                needed=needed // (1024*1024),
            )
        return free >= needed

    # ── Utility ───────────────────────────────────────────────────────────────

    def find_uploaded_video(self, session_id: str) -> Optional[Path]:
        """
        Finds the uploaded video file in a session's upload directory.
        Returns the first video file found, or None.
        """
        upload_dir = self.get_session_paths(session_id).upload_dir
        if not upload_dir.exists():
            return None
        VIDEO_EXTS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
        for f in upload_dir.iterdir():
            if f.is_file() and f.suffix.lower() in VIDEO_EXTS:
                return f
        return None

    def storage_summary(self) -> Dict[str, Any]:
        """
        Returns a summary dict suitable for the /health endpoint.
        """
        usage = self.get_total_disk_usage()
        free  = self.get_free_disk_space()
        return {
            "total_sessions":   self.get_session_count(),
            "disk_usage_mb":    round(usage.total_mb, 2),
            "free_disk_gb":     round(free / (1024**3), 2),
            "upload_dir":       str(settings.upload_dir_abs),
            "frames_dir":       str(settings.frames_dir_abs),
            "results_dir":      str(settings.results_dir_abs),
            "viz_dir":          str(settings.viz_dir_abs),
        }


# ── Singleton ─────────────────────────────────────────────────────────────────
# Import this in every module:
#   from core.storage_manager import storage_manager
storage_manager = StorageManager()
