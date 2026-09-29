"""
core/video_ingestion.py
========================
OpenCV-based video ingestion — frame extraction and metadata extraction.

Step 6 implements: VideoMetadataExtractor (used by the upload endpoint)
Step 7 implements: VideoIngestion.extract_frames() (full generator-based extractor)

Classes:
  VideoMetadataResult   — dataclass returned by metadata extraction
  VideoIngestion        — main class:  metadata + frame extraction generator
  FrameData             — single extracted frame with image + timestamps

Usage (Step 6 — metadata only):
    from core.video_ingestion import VideoIngestion

    info = VideoIngestion.extract_metadata("/path/to/video.mp4")
    print(info.fps, info.total_frames, info.duration_seconds)

Usage (Step 7 — full extraction):
    extractor = VideoIngestion(video_path, frame_skip=2, output_dir=frames_dir)
    for frame_data in extractor.extract_frames():
        # frame_data.image_rgb  → np.ndarray (H, W, 3) RGB
        # frame_data.frame_number → int
        # frame_data.timestamp_ms → float
        pass
"""

from __future__ import annotations

import os
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Generator, Iterator, Optional, Tuple

import cv2
import numpy as np

from core.config import settings
from core.logger import get_logger

log = get_logger("video_ingestion")


# ─────────────────────────────────────────────────────────────────────────────
#  VideoMetadataResult — returned by extract_metadata()
# ─────────────────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class VideoMetadataResult:
    """
    Video properties extracted by OpenCV at upload time.
    All fields are read-only after construction.
    """

    filename:         str
    file_size_bytes:  int
    fps:              float
    total_frames:     int
    duration_seconds: float
    width:            int
    height:           int
    codec:            str    # 4-character codec code, e.g. 'H264', 'MJPG'
    is_readable:      bool   # False if OpenCV couldn't open the file

    # ── Computed helpers ──────────────────────────────────────
    @property
    def resolution(self) -> Tuple[int, int]:
        return (self.width, self.height)

    @property
    def aspect_ratio(self) -> float:
        return round(self.width / self.height, 4) if self.height > 0 else 0.0

    @property
    def file_size_mb(self) -> float:
        return round(self.file_size_bytes / (1024 * 1024), 2)

    @property
    def estimated_frames_after_skip(self) -> int:
        """Estimated frame count after applying frame_skip from settings."""
        skip = max(1, settings.FRAME_SKIP)
        return max(1, self.total_frames // skip)

    def to_dict(self) -> dict:
        return {
            "filename":          self.filename,
            "file_size_bytes":   self.file_size_bytes,
            "file_size_mb":      self.file_size_mb,
            "fps":               self.fps,
            "total_frames":      self.total_frames,
            "duration_seconds":  self.duration_seconds,
            "width":             self.width,
            "height":            self.height,
            "resolution":        list(self.resolution),
            "aspect_ratio":      self.aspect_ratio,
            "codec":             self.codec,
            "is_readable":       self.is_readable,
        }


# ─────────────────────────────────────────────────────────────────────────────
#  FrameData — single extracted frame (used in Step 7)
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class FrameData:
    """
    Data for a single extracted video frame.
    Both BGR (OpenCV native) and RGB (MediaPipe input) are provided.
    """

    frame_number:  int          # 0-based index in the original video
    timestamp_ms:  float        # frame timestamp in milliseconds
    image_bgr:     np.ndarray   # OpenCV native (H, W, 3) BGR
    image_rgb:     np.ndarray   # MediaPipe input  (H, W, 3) RGB
    original_width:  int        # before any resize
    original_height: int
    was_resized:   bool = False # True if frame was resized from original

    @property
    def shape(self) -> Tuple[int, int, int]:
        return self.image_rgb.shape  # (H, W, 3)

    @property
    def height(self) -> int:
        return self.image_rgb.shape[0]

    @property
    def width(self) -> int:
        return self.image_rgb.shape[1]


# ─────────────────────────────────────────────────────────────────────────────
#  VideoIngestion — main class
# ─────────────────────────────────────────────────────────────────────────────

class VideoIngestion:
    """
    Handles all video file I/O using OpenCV.

    Two modes of use:
      1. Static:  VideoIngestion.extract_metadata(path) — no instance needed
      2. Instance: VideoIngestion(path, ...).extract_frames() — generator

    Thread safety: each instance wraps its own cv2.VideoCapture.
    Do NOT share instances across threads.
    """

    # Supported codec codes OpenCV reports → human-readable name
    _CODEC_MAP = {
        "avc1": "H264", "h264": "H264", "x264": "H264",
        "hevc": "H265", "hvc1": "H265",
        "vp80": "VP8",  "vp90": "VP9",
        "mjpg": "MJPG", "mp4v": "MP4V",
        "xvid": "XVID", "divx": "DIVX",
        "theo": "Theora",
    }

    def __init__(
        self,
        video_path: str | Path,
        frame_skip: int = 2,
        output_dir: Optional[Path] = None,
        target_resolution: Optional[Tuple[int, int]] = None,
        session_id: str = "global",
    ) -> None:
        """
        Args:
            video_path:         Path to the video file.
            frame_skip:         Extract every Nth frame (1 = every frame).
            output_dir:         If given, save each frame as JPEG here.
            target_resolution:  (W, H) to resize to, or None for original.
            session_id:         For per-session log context.
        """
        self.video_path       = Path(video_path)
        self.frame_skip       = max(1, frame_skip)
        self.output_dir       = output_dir
        self.target_resolution = target_resolution
        self._log             = get_logger("video_ingestion", session_id=session_id)
        self._session_id      = session_id
        self._cap: Optional[cv2.VideoCapture] = None

        if not self.video_path.exists():
            raise FileNotFoundError(
                f"Video file not found: {self.video_path}"
            )

    # ── Static metadata extraction (Step 6) ──────────────────────────────────

    @staticmethod
    def extract_metadata(video_path: str | Path) -> VideoMetadataResult:
        """
        Extracts video properties using OpenCV without loading any frames.
        Fast — runs in < 100ms for any video length.

        Args:
            video_path: Path to the video file (must exist).

        Returns:
            VideoMetadataResult with all properties filled.
            If OpenCV can't open the file, is_readable=False and numeric
            fields default to 0.
        """
        path = Path(video_path)

        if not path.exists():
            log.warning("Metadata: file not found: {p}", p=path)
            return VideoMetadataResult(
                filename=path.name, file_size_bytes=0,
                fps=0.0, total_frames=0, duration_seconds=0.0,
                width=0, height=0, codec="UNKNOWN", is_readable=False,
            )

        file_size = path.stat().st_size

        cap = cv2.VideoCapture(str(path))
        if not cap.isOpened():
            log.error("OpenCV could not open video: {p}", p=path)
            return VideoMetadataResult(
                filename=path.name, file_size_bytes=file_size,
                fps=0.0, total_frames=0, duration_seconds=0.0,
                width=0, height=0, codec="UNKNOWN", is_readable=False,
            )

        try:
            fps          = cap.get(cv2.CAP_PROP_FPS) or 0.0
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
            width        = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height       = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

            # Duration: prefer frame-count / fps; fall back to OpenCV duration
            if fps > 0 and total_frames > 0:
                duration = round(total_frames / fps, 4)
            else:
                duration = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000.0

            # Codec: OpenCV returns a float-encoded 4-byte code
            fourcc_int = int(cap.get(cv2.CAP_PROP_FOURCC))
            raw_codec  = "".join([
                chr((fourcc_int >> (8 * i)) & 0xFF) for i in range(4)
            ]).strip().lower()
            codec = VideoIngestion._CODEC_MAP.get(raw_codec, raw_codec.upper() or "UNKNOWN")

            log.info(
                "Metadata extracted | {fn} | {w}x{h} | {fps}fps | "
                "{frames}f | {dur}s | codec={codec}",
                fn=path.name, w=width, h=height,
                fps=round(fps, 2), frames=total_frames,
                dur=round(duration, 2), codec=codec,
            )

            return VideoMetadataResult(
                filename=path.name,
                file_size_bytes=file_size,
                fps=round(fps, 4),
                total_frames=total_frames,
                duration_seconds=round(duration, 4),
                width=width, height=height,
                codec=codec, is_readable=True,
            )
        finally:
            cap.release()

    # ── Instance: frame extraction generator (Step 7) ────────────────────────

    def extract_frames(
        self,
        progress_callback=None,
    ) -> Generator[FrameData, None, None]:
        """
        Generator that yields one FrameData per extracted frame.
        Applies frame_skip, optional resize, BGR→RGB conversion,
        and optionally saves JPEG files.

        Args:
            progress_callback: Optional callable(frames_done, total_frames).
                               Called after each frame yield.

        Yields:
            FrameData for each extracted frame (in order).

        Note:
            Closes the VideoCapture automatically when exhausted or on error.
        """
        self._log.info(
            "Starting frame extraction | video={v} | skip={s} | "
            "resize={r} | save_to_disk={d}",
            v=self.video_path.name,
            s=self.frame_skip,
            r=self.target_resolution,
            d=self.output_dir is not None,
        )

        if self.output_dir:
            self.output_dir.mkdir(parents=True, exist_ok=True)

        cap = cv2.VideoCapture(str(self.video_path))
        if not cap.isOpened():
            raise RuntimeError(
                f"OpenCV could not open video: {self.video_path}"
            )

        try:
            total_frames  = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps           = cap.get(cv2.CAP_PROP_FPS) or 30.0
            orig_w        = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            orig_h        = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

            # Auto-resize to max 1280x720 for performance if larger (Step 7 requirement)
            if not self.target_resolution and (orig_w > 1280 or orig_h > 720):
                scale = min(1280 / orig_w, 720 / orig_h)
                self.target_resolution = (int(orig_w * scale), int(orig_h * scale))
                self._log.info(
                    "Auto-resizing frames from {ow}x{oh} to {nw}x{nh} for performance",
                    ow=orig_w, oh=orig_h, nw=self.target_resolution[0], nh=self.target_resolution[1]
                )

            raw_frame_num = -1     # index into ALL video frames
            yielded_count =  0     # index of extracted (non-skipped) frames

            t_start = time.perf_counter()

            while True:
                ret, frame_bgr = cap.read()
                if not ret:
                    break

                raw_frame_num += 1

                # ── Apply frame_skip ─────────────────────────
                if raw_frame_num % self.frame_skip != 0:
                    continue

                # ── Timestamp ────────────────────────────────
                timestamp_ms = cap.get(cv2.CAP_PROP_POS_MSEC)
                if timestamp_ms == 0 and raw_frame_num > 0:
                    # Fall back to calculated timestamp
                    timestamp_ms = (raw_frame_num / fps) * 1000.0

                # ── Resize if needed ─────────────────────────
                was_resized = False
                if self.target_resolution and (
                    orig_w != self.target_resolution[0] or
                    orig_h != self.target_resolution[1]
                ):
                    frame_bgr = cv2.resize(
                        frame_bgr, self.target_resolution,
                        interpolation=cv2.INTER_AREA,
                    )
                    was_resized = True

                # ── BGR → RGB ─────────────────────────────────
                frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)

                # ── Save to disk ──────────────────────────────
                if self.output_dir:
                    out_path = self.output_dir / f"frame_{raw_frame_num:06d}.jpg"
                    cv2.imwrite(
                        str(out_path), frame_bgr,
                        [cv2.IMWRITE_JPEG_QUALITY, 90],
                    )

                frame_data = FrameData(
                    frame_number   = raw_frame_num,
                    timestamp_ms   = round(timestamp_ms, 2),
                    image_bgr      = frame_bgr,
                    image_rgb      = frame_rgb,
                    original_width = orig_w,
                    original_height= orig_h,
                    was_resized    = was_resized,
                )
                yielded_count += 1
                yield frame_data

                if progress_callback:
                    progress_callback(yielded_count, total_frames // self.frame_skip)

            elapsed = time.perf_counter() - t_start
            throughput = yielded_count / elapsed if elapsed > 0 else 0

            self._log.info(
                "Frame extraction complete | extracted={n} | "
                "elapsed={t:.1f}s | throughput={tp:.1f}fps",
                n=yielded_count, t=elapsed, tp=throughput,
            )

        finally:
            cap.release()
            self._log.info("VideoCapture released | {v}", v=self.video_path.name)

    def extract_roi(
        self,
        frame_bgr: np.ndarray,
        bbox: Tuple[float, float, float, float],
        padding_pct: float = 0.15,
    ) -> np.ndarray:
        """
        Crops a frame to a bounding box with percentage padding.

        Args:
            frame_bgr:   Full frame in BGR.
            bbox:        (x1, y1, x2, y2) in pixel coords.
            padding_pct: Fractional padding added around the bbox.

        Returns:
            Cropped BGR image (at least 1x1 pixel).
        """
        h, w = frame_bgr.shape[:2]
        x1, y1, x2, y2 = [float(v) for v in bbox]

        pw = (x2 - x1) * padding_pct
        ph = (y2 - y1) * padding_pct

        x1 = max(0, int(x1 - pw))
        y1 = max(0, int(y1 - ph))
        x2 = min(w, int(x2 + pw))
        y2 = min(h, int(y2 + ph))

        if x2 <= x1 or y2 <= y1:
            return frame_bgr   # fallback: return full frame

        return frame_bgr[y1:y2, x1:x2]

    def get_metadata(self) -> VideoMetadataResult:
        """Instance method wrapper around the static extract_metadata."""
        return VideoIngestion.extract_metadata(self.video_path)

    def __repr__(self) -> str:
        return (
            f"VideoIngestion(video={self.video_path.name!r}, "
            f"skip={self.frame_skip}, resize={self.target_resolution})"
        )
