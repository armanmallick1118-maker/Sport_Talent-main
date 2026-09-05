"""
ATHENA-MOTION: MediaPipe 33-Landmark Pose Detection & Smoothing.
Wraps the modern MediaPipe Tasks Vision API with automatic model asset resolution
and an Exponential Moving Average (EMA) filter to eliminate frame-to-frame landmark jitter.
"""

import os
import urllib.request
from pathlib import Path
from typing import Optional, Tuple, List
import numpy as np
import cv2
import mediapipe as mp
from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python.vision import PoseLandmarker, PoseLandmarkerOptions, RunningMode

MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"

class PoseDetector:
    """
    High-performance MediaPipe Pose Landmarker detector extracting 33 3D body landmarks.
    Includes temporal smoothing to produce stable biomechanical kinematic vectors.
    """
    def __init__(
        self,
        model_path: Optional[str] = None,
        running_mode: RunningMode = RunningMode.IMAGE,
        min_pose_detection_confidence: float = 0.5,
        min_pose_presence_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5,
        smoothing_factor: float = 0.65  # EMA weight for new frame (0 = locked, 1 = no smoothing)
    ):
        self.smoothing_factor = smoothing_factor
        self.smoothed_landmarks: Optional[np.ndarray] = None

        # Resolve model asset path
        self.model_path = self._resolve_model_path(model_path)

        # Initialize MediaPipe Task
        options = PoseLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=self.model_path),
            running_mode=running_mode,
            min_pose_detection_confidence=min_pose_detection_confidence,
            min_pose_presence_confidence=min_pose_presence_confidence,
            min_tracking_confidence=min_tracking_confidence,
            output_segmentation_masks=False
        )
        self.landmarker = PoseLandmarker.create_from_options(options)

    def _resolve_model_path(self, custom_path: Optional[str]) -> str:
        """Finds pose_landmarker_full.task for high accuracy, falling back to lite."""
        if custom_path and os.path.isfile(custom_path):
            return custom_path

        # Prioritize high-precision 'full' model, then 'lite'
        candidate_filenames = ["pose_landmarker_full.task", "pose_landmarker_lite.task"]
        base_dirs = [
            os.path.join(os.path.dirname(__file__), "..", "..", "assets", "models"),
            os.path.join(os.path.dirname(__file__), "..", "assets", "models"),
            "assets/models",
            "."
        ]

        for fname in candidate_filenames:
            for bdir in base_dirs:
                abs_p = os.path.abspath(os.path.join(bdir, fname))
                if os.path.isfile(abs_p):
                    return abs_p

        # If not found locally, download to assets/models
        target_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "assets", "models"))
        os.makedirs(target_dir, exist_ok=True)
        download_target = os.path.join(target_dir, "pose_landmarker_full.task")

        print(f"[ATHENA-MOTION] Downloading high-precision pose model to {download_target}...")
        url = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task"
        urllib.request.urlretrieve(url, download_target)
        return download_target

    def detect(self, frame_bgr: np.ndarray) -> Optional[np.ndarray]:
        """
        Processes a BGR OpenCV frame and returns 33 landmarks as a numpy array:
        Shape: (33, 4) with columns [x, y, z, visibility].
        Returns None if no person is detected.
        """
        if frame_bgr is None or frame_bgr.size == 0:
            return None

        # Convert BGR (OpenCV) to RGB for MediaPipe
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)

        # Run inference
        result = self.landmarker.detect(mp_image)

        if not result.pose_landmarks or len(result.pose_landmarks) == 0:
            return None

        # Extract primary person landmarks
        raw_lms = result.pose_landmarks[0]
        coords = np.zeros((33, 4), dtype=np.float32)

        for i, lm in enumerate(raw_lms):
            coords[i, 0] = lm.x
            coords[i, 1] = lm.y
            coords[i, 2] = lm.z
            coords[i, 3] = getattr(lm, "visibility", 1.0)

        # Apply Exponential Moving Average (EMA) smoothing to reduce jitter
        if self.smoothed_landmarks is None:
            self.smoothed_landmarks = coords.copy()
        else:
            alpha = self.smoothing_factor
            # Smooth x, y, z positions; maintain latest visibility
            self.smoothed_landmarks[:, :3] = (
                alpha * coords[:, :3] + (1.0 - alpha) * self.smoothed_landmarks[:, :3]
            )
            self.smoothed_landmarks[:, 3] = coords[:, 3]

        return self.smoothed_landmarks.copy()

    def reset_smoothing(self) -> None:
        """Resets EMA state when switching video streams or clips."""
        self.smoothed_landmarks = None

    def close(self) -> None:
        """Closes the underlying landmarker resources."""
        if hasattr(self, "landmarker") and self.landmarker:
            self.landmarker.close()
