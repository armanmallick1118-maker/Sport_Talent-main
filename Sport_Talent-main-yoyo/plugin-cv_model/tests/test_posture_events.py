"""
Unit Tests for Arm Fold & Upper-Body Posture Event Detection and Logging.
"""

import os
import pytest
import numpy as np

from athena_motion.biomechanics.posture_events import PostureEventDetector, PostureEvent, PostureState
from athena_motion.biomechanics.event_logger import MotionEventLogger, MotionEvent
from athena_motion.dataset.schema import PoseLandmarkIndex

def test_arm_fold_detection():
    detector = PostureEventDetector(debounce_frames=1)

    # Construct mock skeleton with arms folded across chest
    lm = np.zeros((33, 4), dtype=np.float32)
    lm[:, 3] = 1.0

    idx = PoseLandmarkIndex
    # Shoulders
    lm[idx.LEFT_SHOULDER] = [0.40, 0.30, 0.0, 1.0]
    lm[idx.RIGHT_SHOULDER] = [0.60, 0.30, 0.0, 1.0]
    # Hips
    lm[idx.LEFT_HIP] = [0.42, 0.65, 0.0, 1.0]
    lm[idx.RIGHT_HIP] = [0.58, 0.65, 0.0, 1.0]

    # Left arm: Elbow bent acute, wrist crossed over to right chest
    lm[idx.LEFT_ELBOW] = [0.36, 0.45, 0.0, 1.0]
    lm[idx.LEFT_WRIST] = [0.55, 0.42, 0.05, 1.0]

    # Right arm: Elbow bent acute, wrist crossed over to left chest
    lm[idx.RIGHT_ELBOW] = [0.64, 0.45, 0.0, 1.0]
    lm[idx.RIGHT_WRIST] = [0.45, 0.44, 0.05, 1.0]

    state = detector.detect(lm)
    assert isinstance(state, PostureState)
    assert state.is_arms_crossed is True
    assert state.active_posture == PostureEvent.ARMS_FOLDED_CROSSED
    assert state.left_elbow_angle < 75.0
    assert state.right_elbow_angle < 75.0

def test_motion_event_logger(tmp_path):
    log_dir = str(tmp_path / "test_logs")
    logger = MotionEventLogger(log_dir=log_dir, min_hold_duration_sec=0.0)

    # State 1: Arms folded
    folded_state = PostureState(
        active_posture=PostureEvent.ARMS_FOLDED_CROSSED,
        confidence=0.95,
        description="ARMS FOLDED ACROSS CHEST",
        left_elbow_angle=45.0,
        right_elbow_angle=48.0,
        left_shoulder_angle=70.0,
        right_shoulder_angle=70.0,
        wrist_distance=0.4,
        is_arms_crossed=True
    )

    ev1 = logger.update(folded_state)
    assert ev1 is not None
    assert ev1.event_type == "TRIGGER"
    assert "ARMS FOLDED" in ev1.description

    # Verify log lines in HUD
    hud_lines = logger.get_hud_log_lines()
    assert len(hud_lines) >= 1
    assert "ARMS FOLDED" in hud_lines[0]

    # Verify files created on disk
    assert os.path.isfile(logger.txt_log_path)
    assert os.path.isfile(logger.jsonl_log_path)
