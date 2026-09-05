"""
Unit Tests for ATHENA-MOTION Biomechanics and Kinematics Engine.
"""

import pytest
import numpy as np

from athena_motion.biomechanics.kinematics import (
    calculate_angle_2d,
    calculate_angle_3d,
    calculate_trunk_inclination,
    calculate_segment_tilt,
    calculate_euclidean_distance,
    calculate_midpoint
)
from athena_motion.biomechanics.metrics import compute_biomechanical_metrics, BiomechanicalMetrics
from athena_motion.biomechanics.features import BiomechanicalFeatureExtractor
from athena_motion.biomechanics.temporal import RepetitionCounter
from athena_motion.dataset.schema import TOTAL_FEATURE_COUNT, PoseLandmarkIndex, RepPhase, ExerciseType

def test_calculate_angle_2d():
    # Right angle: (0, 1) -> (0, 0) -> (1, 0)
    p1 = (0.0, 1.0)
    vertex = (0.0, 0.0)
    p3 = (1.0, 0.0)
    angle = calculate_angle_2d(p1, vertex, p3)
    assert abs(angle - 90.0) < 1e-4

    # Straight line: (-1, 0) -> (0, 0) -> (1, 0)
    angle_straight = calculate_angle_2d((-1.0, 0.0), (0.0, 0.0), (1.0, 0.0))
    assert abs(angle_straight - 180.0) < 1e-4

def test_trunk_inclination():
    # Vertical torso: shoulder directly above hip (dy < 0 in screen space)
    hip = (0.5, 0.6)
    shoulder_upright = (0.5, 0.3)
    angle_upright = calculate_trunk_inclination(shoulder_upright, hip)
    assert abs(angle_upright - 0.0) < 1.0

    # Torso leaned forward 45 degrees
    shoulder_leaned = (0.8, 0.3)
    angle_leaned = calculate_trunk_inclination(shoulder_leaned, hip)
    assert angle_leaned > 35.0 and angle_leaned < 55.0

def test_biomechanical_metrics_computation():
    # Mock a 33-landmark standing pose
    mock_lm = np.zeros((33, 4), dtype=np.float32)
    mock_lm[:, 3] = 1.0 # full visibility

    idx = PoseLandmarkIndex
    # Hips, Knees, Ankles in a straight vertical line (180 deg knee angle)
    mock_lm[idx.LEFT_HIP] = [0.4, 0.5, 0.0, 1.0]
    mock_lm[idx.LEFT_KNEE] = [0.4, 0.7, 0.0, 1.0]
    mock_lm[idx.LEFT_ANKLE] = [0.4, 0.9, 0.0, 1.0]
    mock_lm[idx.LEFT_FOOT_INDEX] = [0.4, 0.95, 0.1, 1.0]

    mock_lm[idx.RIGHT_HIP] = [0.6, 0.5, 0.0, 1.0]
    mock_lm[idx.RIGHT_KNEE] = [0.6, 0.7, 0.0, 1.0]
    mock_lm[idx.RIGHT_ANKLE] = [0.6, 0.9, 0.0, 1.0]
    mock_lm[idx.RIGHT_FOOT_INDEX] = [0.6, 0.95, 0.1, 1.0]

    mock_lm[idx.LEFT_SHOULDER] = [0.4, 0.25, 0.0, 1.0]
    mock_lm[idx.RIGHT_SHOULDER] = [0.6, 0.25, 0.0, 1.0]

    metrics = compute_biomechanical_metrics(mock_lm)
    assert abs(metrics.angle_left_knee - 180.0) < 1.0
    assert abs(metrics.angle_right_knee - 180.0) < 1.0
    assert abs(metrics.shoulder_tilt_angle - 0.0) < 1.0
    assert abs(metrics.trunk_inclination_angle - 0.0) < 1.0

def test_feature_extractor_dimensions_and_invariance():
    extractor = BiomechanicalFeatureExtractor(normalize_invariance=True)
    mock_lm = np.random.uniform(0.1, 0.9, size=(33, 4)).astype(np.float32)

    vec, metrics = extractor.extract(mock_lm, return_metrics_obj=True)
    assert len(vec) == TOTAL_FEATURE_COUNT
    assert not np.isnan(vec).any()
    assert isinstance(metrics, BiomechanicalMetrics)

def test_repetition_counter_state_machine():
    counter = RepetitionCounter(exercise_type=ExerciseType.SQUAT)
    assert counter.rep_count == 0
    assert counter.current_phase == RepPhase.IDLE

    # 1. User starts descending (angle drops below 152)
    count, phase, completed = counter.update(current_angle=140.0, timestamp=1.0)
    assert phase == RepPhase.ECCENTRIC
    assert completed is False

    # 2. Reaches bottom inflection (below 95)
    count, phase, completed = counter.update(current_angle=85.0, timestamp=2.0)
    assert phase == RepPhase.INFLECTION
    assert completed is False

    # 3. Begins ascending (angle rises above min + 8)
    count, phase, completed = counter.update(current_angle=105.0, timestamp=2.5)
    assert phase == RepPhase.CONCENTRIC
    assert completed is False

    # 4. Returns to standing lockout (angle >= 152)
    count, phase, completed = counter.update(current_angle=162.0, timestamp=3.2)
    assert count == 1
    assert completed is True
    assert phase == RepPhase.IDLE
    assert len(counter.rep_history) == 1
    assert counter.get_consistency_score() == 100.0
