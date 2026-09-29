"""
api/routes/upload.py
====================
Video upload endpoints — Step 6 full implementation.

Routes:
  POST   /api/v1/upload                       → upload video, get session_id
  GET    /api/v1/upload/{session_id}/info     → metadata for a session
  DELETE /api/v1/upload/{session_id}          → delete session + all its data
  GET    /api/v1/upload/sessions              → list all sessions
  GET    /api/v1/upload/sessions/count        → total session count

Upload flow:
  1. Validate Content-Type is multipart/form-data
  2. Validate file extension (.mp4 / .mov / .avi / .mkv / .webm)
  3. Stream file to disk (no full load into RAM) with concurrent size check
  4. Generate UUID session_id
  5. Create session via StorageManager
  6. Extract video metadata with OpenCV (VideoIngestion.extract_metadata)
  7. Write metadata into session_meta.json
  8. Return UploadResponse
"""

from __future__ import annotations

import shutil
import uuid
from pathlib import Path
from typing import List, Optional

import aiofiles
from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status
from fastapi.responses import JSONResponse

from api.models.response_models import (
    ProcessStatusResponse,
    UploadResponse,
    VideoMetadata,
)
from core.config import settings
from core.logger import get_logger
from core.storage_manager import SessionInfo, storage_manager
from core.video_ingestion import VideoIngestion

log = get_logger("upload_route")

router = APIRouter()

# ── Chunk size for streaming file writes (4 MB) ───────────────────────────────
_CHUNK_SIZE = 4 * 1024 * 1024


# ─────────────────────────────────────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _validate_extension(filename: str) -> str:
    """
    Checks the file extension is in the supported list.
    Returns the lowercased extension or raises HTTPException 415.
    """
    suffix = Path(filename).suffix.lower()
    if suffix not in settings.supported_formats_list:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail={
                "error":   "unsupported_format",
                "message": (
                    f"File '{filename}' has unsupported extension '{suffix}'. "
                    f"Accepted: {settings.supported_formats_list}"
                ),
            },
        )
    return suffix


def _safe_filename(original: str) -> str:
    """
    Sanitises the original filename:
    - Strips directory components
    - Replaces spaces with underscores
    - Keeps only alphanumeric, hyphens, underscores, and the dot
    """
    name = Path(original).name             # strip any directory parts
    name = name.replace(" ", "_")
    allowed = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
                  "0123456789-_.")
    safe = "".join(c if c in allowed else "_" for c in name)
    return safe or "uploaded_video.mp4"


async def _stream_to_disk(
    upload_file: UploadFile,
    dest_path: Path,
    max_bytes: int,
) -> int:
    """
    Streams an UploadFile to dest_path in _CHUNK_SIZE chunks.
    Raises HTTP 413 if total bytes exceed max_bytes.

    Returns:
        Total bytes written.
    """
    total_written = 0
    async with aiofiles.open(dest_path, "wb") as f:
        while True:
            chunk = await upload_file.read(_CHUNK_SIZE)
            if not chunk:
                break
            total_written += len(chunk)
            if total_written > max_bytes:
                # Clean up partial file
                await f.flush()
                dest_path.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail={
                        "error":   "file_too_large",
                        "message": (
                            f"File exceeds maximum allowed size of "
                            f"{settings.MAX_VIDEO_SIZE_MB} MB. "
                            f"Received at least "
                            f"{total_written // (1024*1024)} MB."
                        ),
                        "max_size_mb": settings.MAX_VIDEO_SIZE_MB,
                    },
                )
            await f.write(chunk)
    return total_written


def _build_video_metadata_model(
    meta_result, filename: str
) -> VideoMetadata:
    """Converts a VideoMetadataResult into the Pydantic VideoMetadata model."""
    return VideoMetadata(
        filename=filename,
        file_size_bytes=meta_result.file_size_bytes,
        fps=meta_result.fps,
        total_frames=meta_result.total_frames,
        duration_seconds=meta_result.duration_seconds,
        width=meta_result.width,
        height=meta_result.height,
        codec=meta_result.codec,
    )


# ─────────────────────────────────────────────────────────────────────────────
#  POST /api/v1/upload
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/upload",
    summary="Upload athlete video",
    description=(
        "Upload a video file for athlete motion tracking.\n\n"
        "**Accepted formats**: `.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`\n\n"
        "**Max size**: 500 MB (configurable via `MAX_VIDEO_SIZE_MB` in `.env`)\n\n"
        "Returns a `session_id` UUID to use for all subsequent pipeline calls:\n"
        "`/process`, `/results/{session_id}`, `/visualize/{session_id}`"
    ),
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {"description": "Video uploaded successfully."},
        413: {"description": "File exceeds MAX_VIDEO_SIZE_MB limit."},
        415: {"description": "Unsupported file format."},
        422: {"description": "No file provided."},
        500: {"description": "Internal error during upload or metadata extraction."},
    },
)
async def upload_video(
    file: UploadFile = File(
        ...,
        description="Video file (.mp4 / .mov / .avi / .mkv / .webm)",
    ),
    athlete_id: Optional[str] = Query(
        default=None,
        description="Optional athlete identifier to embed in motion JSON.",
        max_length=128,
    ),
) -> UploadResponse:
    """
    Full upload flow:
      1. Validate extension
      2. Generate session_id + create storage session
      3. Stream file to disk (max MAX_VIDEO_SIZE_MB)
      4. Extract video metadata with OpenCV
      5. Persist metadata in session_meta.json
      6. Return UploadResponse
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": "no_file", "message": "No file was provided."},
        )

    original_name = file.filename
    log.info("Upload received | filename={fn} | athlete_id={aid}",
             fn=original_name, aid=athlete_id)

    # ── 1. Validate extension ─────────────────────────────────────────────────
    _validate_extension(original_name)
    safe_name = _safe_filename(original_name)

    # ── 2. Generate session + create storage dirs ─────────────────────────────
    session_id = str(uuid.uuid4())
    paths = storage_manager.create_session(
        session_id,
        original_filename=safe_name,
        athlete_id=athlete_id,
    )
    log.info("Session created | session_id={sid}", sid=session_id)

    dest_path = paths.upload_video_path(safe_name)

    # ── 3. Stream file to disk ────────────────────────────────────────────────
    try:
        total_bytes = await _stream_to_disk(
            upload_file=file,
            dest_path=dest_path,
            max_bytes=settings.max_video_size_bytes,
        )
    except HTTPException:
        # Clean up session if size-limit hit mid-stream
        storage_manager.cleanup_session(session_id)
        raise
    except Exception as exc:
        storage_manager.cleanup_session(session_id)
        log.error("File stream failed | session_id={sid} | error={e}",
                  sid=session_id, e=str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error":   "upload_failed",
                "message": f"Failed to save video file: {exc}",
            },
        )

    log.info("File saved | session_id={sid} | bytes={b} | path={p}",
             sid=session_id, b=total_bytes, p=str(dest_path))

    # ── 4. Extract video metadata with OpenCV ─────────────────────────────────
    try:
        meta_result = VideoIngestion.extract_metadata(dest_path)
    except Exception as exc:
        log.error("Metadata extraction failed | session_id={sid} | error={e}",
                  sid=session_id, e=str(exc))
        # Non-fatal — continue with zeroed metadata
        from core.video_ingestion import VideoMetadataResult
        meta_result = VideoMetadataResult(
            filename=safe_name, file_size_bytes=total_bytes,
            fps=0.0, total_frames=0, duration_seconds=0.0,
            width=0, height=0, codec="UNKNOWN", is_readable=False,
        )

    if not meta_result.is_readable:
        # File was saved but OpenCV can't read it — still valid upload
        # (codec may be unsupported by OpenCV but playable by ffmpeg)
        log.warning(
            "OpenCV could not read video | session_id={sid} | "
            "file is saved but metadata is incomplete",
            sid=session_id,
        )

    # ── 5. Persist metadata ───────────────────────────────────────────────────
    storage_manager.write_session_meta(session_id, {
        "status":            "UPLOADED",
        "original_filename": safe_name,
        "file_size_bytes":   total_bytes,
        "fps":               meta_result.fps,
        "total_frames":      meta_result.total_frames,
        "duration_seconds":  meta_result.duration_seconds,
        "width":             meta_result.width,
        "height":            meta_result.height,
        "codec":             meta_result.codec,
        "athlete_id":        athlete_id,
    })

    log.info(
        "Upload complete | session_id={sid} | {w}x{h} | "
        "{fps}fps | {frames}f | {dur:.1f}s | codec={codec}",
        sid=session_id,
        w=meta_result.width, h=meta_result.height,
        fps=round(meta_result.fps, 2),
        frames=meta_result.total_frames,
        dur=meta_result.duration_seconds,
        codec=meta_result.codec,
    )

    # ── 6. Build response ─────────────────────────────────────────────────────
    video_meta_model = _build_video_metadata_model(meta_result, safe_name)

    return UploadResponse(
        session_id=session_id,
        filename=safe_name,
        upload_path=str(dest_path),
        video_metadata=video_meta_model,
        message=(
            f"Upload successful. "
            f"Call POST /api/v1/process with session_id='{session_id}' "
            "to start the pipeline."
        ),
    )


# ─────────────────────────────────────────────────────────────────────────────
#  GET /api/v1/upload/sessions  (MUST be before /{session_id} routes)
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/upload/sessions",
    summary="List all sessions",
    description="Returns a list of all sessions with status and disk usage.",
)
async def list_sessions(
    status_filter: Optional[str] = Query(
        default=None,
        description="Filter by status (PENDING, UPLOADED, EXTRACTING, DONE, etc.)",
    ),
    limit: Optional[int] = Query(
        default=50,
        ge=1,
        le=500,
        description="Maximum sessions to return (newest first).",
    ),
) -> JSONResponse:
    """Returns paginated list of sessions sorted newest-first."""
    sessions: List[SessionInfo] = storage_manager.list_sessions(
        status_filter=status_filter,
        limit=limit,
    )
    return JSONResponse(content={
        "total":    storage_manager.get_session_count(),
        "returned": len(sessions),
        "sessions": [
            {
                "session_id":        s.session_id,
                "status":            s.status,
                "created_at":        s.created_at,
                "original_filename": s.original_filename,
                "duration_seconds":  s.duration_seconds,
                "processed_frames":  s.processed_frames,
                "disk_usage_mb":     round(s.disk_usage.total_mb, 2),
                "has_results":       s.has_results,
                "has_visualization": s.has_visualization,
            }
            for s in sessions
        ],
    })


# ─────────────────────────────────────────────────────────────────────────────
#  GET /api/v1/upload/sessions/count  (MUST be before /{session_id} routes)
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/upload/sessions/count",
    summary="Total session count",
)
async def session_count() -> JSONResponse:
    """Returns the total number of sessions in storage."""
    return JSONResponse(content={
        "count":         storage_manager.get_session_count(),
        "storage_usage": storage_manager.storage_summary(),
    })


# ─────────────────────────────────────────────────────────────────────────────
#  GET /api/v1/upload/{session_id}/info
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/upload/{session_id}/info",
    summary="Get video metadata for a session",
    description="Returns the stored video metadata for an uploaded session.",
    responses={
        200: {"description": "Session info returned."},
        404: {"description": "Session not found."},
    },
)
async def get_upload_info(session_id: str) -> JSONResponse:
    """
    Reads session_meta.json and returns video metadata + session status.
    """
    _require_session(session_id)
    meta = storage_manager.read_session_meta(session_id)
    paths = storage_manager.get_session_paths(session_id)
    video_file = storage_manager.find_uploaded_video(session_id)

    return JSONResponse(content={
        "session_id":      meta.session_id,
        "status":          meta.status,
        "created_at":      meta.created_at,
        "athlete_id":      meta.athlete_id,
        "video": {
            "filename":         meta.original_filename,
            "file_size_bytes":  meta.file_size_bytes,
            "fps":              meta.fps,
            "total_frames":     meta.total_frames,
            "duration_seconds": meta.duration_seconds,
            "width":            meta.width,
            "height":           meta.height,
            "codec":            meta.codec,
            "file_exists":      video_file is not None,
        },
        "storage": {
            "upload_dir":       str(paths.upload_dir),
            "results_exist":    storage_manager.results_exist(session_id),
            "frame_count":      storage_manager.frame_count(session_id),
        },
    })


# ─────────────────────────────────────────────────────────────────────────────
#  DELETE /api/v1/upload/{session_id}
# ─────────────────────────────────────────────────────────────────────────────

@router.delete(
    "/upload/{session_id}",
    summary="Delete a session and all its data",
    description=(
        "Permanently deletes the session's upload, frames, results, "
        "and visualizations. This action is irreversible."
    ),
    status_code=status.HTTP_200_OK,
    responses={
        200: {"description": "Session deleted."},
        404: {"description": "Session not found."},
    },
)
async def delete_session(
    session_id: str,
    keep_results: bool = Query(
        default=False,
        description="If true, keeps motion_data.json and CSV but deletes everything else.",
    ),
) -> JSONResponse:
    """
    Deletes all storage for a session. With keep_results=true,
    preserves motion JSON/CSV for downstream ML use.
    """
    _require_session(session_id)

    disk = storage_manager.get_disk_usage(session_id)
    ok   = storage_manager.cleanup_session(session_id, keep_results=keep_results)

    if not ok:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "delete_failed",
                    "message": "Cleanup operation failed. Check server logs."},
        )

    log.info("Session deleted | session_id={sid} | keep_results={kr} | "
             "freed={mb:.2f}MB", sid=session_id, kr=keep_results,
             mb=disk.total_mb)

    return JSONResponse(content={
        "session_id":      session_id,
        "deleted":         True,
        "keep_results":    keep_results,
        "freed_bytes":     disk.total_bytes,
        "freed_mb":        round(disk.total_mb, 2),
        "message":         (
            "Session deleted. Results preserved."
            if keep_results
            else "Session and all data deleted."
        ),
    })


# (list_sessions and session_count moved above /{session_id} routes — see above)


# ─────────────────────────────────────────────────────────────────────────────
#  Helper: require session exists or raise 404
# ─────────────────────────────────────────────────────────────────────────────

def _require_session(session_id: str) -> None:
    """Raises HTTP 404 if the session does not exist."""
    if not storage_manager.session_exists(session_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error":      "session_not_found",
                "message":    f"Session '{session_id}' not found.",
                "session_id": session_id,
            },
        )
