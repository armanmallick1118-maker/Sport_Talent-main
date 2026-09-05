"""
ATHENA-MOTION: Video Ingestion & Stream Processing Engine.
Handles frame capture, video decoding, FPS pacing, and annotated video rendering via OpenCV.
"""

from typing import Generator, Tuple, Optional, Callable
import os
import cv2
import numpy as np

class VideoProcessor:
    """
    Reads video files, webcam streams, or RTSP feeds and handles annotated output serialization.
    """
    def __init__(
        self,
        source: Optional[str | int] = 0,
        target_width: Optional[int] = None,
        target_height: Optional[int] = None,
        frame_stride: int = 1  # 1 = process every frame, 2 = skip every second frame for speed
    ):
        self.source = source
        self.target_width = target_width
        self.target_height = target_height
        self.frame_stride = max(1, frame_stride)

        self.cap: Optional[cv2.VideoCapture] = None
        self.fps: float = 30.0
        self.width: int = 640
        self.height: int = 480
        self.total_frames: int = 0

    def open(self, source: Optional[str | int] = None) -> bool:
        """Opens video capture device or file."""
        if source is not None:
            self.source = source

        self.cap = cv2.VideoCapture(self.source)
        if not self.cap.isOpened():
            return False

        self.fps = self.cap.get(cv2.CAP_PROP_FPS) or 30.0
        self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
        self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480
        self.total_frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0

        if self.target_width and self.target_height:
            self.width = self.target_width
            self.height = self.target_height

        return True

    def frames(self) -> Generator[Tuple[int, float, np.ndarray], None, None]:
        """
        Yields (frame_index, timestamp_sec, frame_bgr) from source.
        """
        if self.cap is None or not self.cap.isOpened():
            if not self.open():
                raise RuntimeError(f"Unable to open video source: {self.source}")

        frame_idx = 0
        while self.cap.isOpened():
            ret, frame = self.cap.read()
            if not ret or frame is None:
                break

            if frame_idx % self.frame_stride == 0:
                if self.target_width and self.target_height:
                    frame = cv2.resize(frame, (self.target_width, self.target_height), interpolation=cv2.INTER_AREA)

                timestamp = frame_idx / max(self.fps, 1.0)
                yield (frame_idx, timestamp, frame)

            frame_idx += 1

    def create_writer(
        self,
        output_path: str,
        fps: Optional[float] = None,
        codec: str = "mp4v"
    ) -> cv2.VideoWriter:
        """Initializes OpenCV VideoWriter for saving annotated video."""
        out_dir = os.path.dirname(os.path.abspath(output_path))
        if out_dir:
            os.makedirs(out_dir, exist_ok=True)

        writer_fps = fps if fps is not None else (self.fps / self.frame_stride)
        fourcc = cv2.VideoWriter_fourcc(*codec)
        writer = cv2.VideoWriter(output_path, fourcc, writer_fps, (self.width, self.height))
        return writer

    def release(self) -> None:
        """Releases video capture handle."""
        if self.cap is not None:
            self.cap.release()
            self.cap = None

    def __enter__(self):
        self.open()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.release()
