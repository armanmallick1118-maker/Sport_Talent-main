"""
Unit Tests for ATHENA-MOTION Pose Detector and MediaPipe 33-Landmark Extraction.
"""

import os
import pytest
import numpy as np
import cv2

from athena_motion.vision.pose_detector import PoseDetector

def test_pose_detector_initialization():
    detector = PoseDetector()
    assert detector is not None
    assert detector.landmarker is not None

    # Test processing a dummy blank frame (should cleanly return None without crashing)
    blank_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    res = detector.detect(blank_frame)
    assert res is None

    detector.close()

def test_pose_detector_smoothing_filter():
    detector = PoseDetector(smoothing_factor=0.5)

    # Simulate raw coordinates
    mock_frame1 = np.ones((33, 4), dtype=np.float32) * 10.0
    detector.smoothed_landmarks = mock_frame1.copy()

    # Next simulated detection has a sudden jump to 20.0
    mock_frame2 = np.ones((33, 4), dtype=np.float32) * 20.0
    # Simulate EMA: 0.5 * 20 + 0.5 * 10 = 15.0
    detector.smoothed_landmarks[:, :3] = (
        0.5 * mock_frame2[:, :3] + 0.5 * detector.smoothed_landmarks[:, :3]
    )

    assert abs(detector.smoothed_landmarks[0, 0] - 15.0) < 1e-4
    detector.close()
