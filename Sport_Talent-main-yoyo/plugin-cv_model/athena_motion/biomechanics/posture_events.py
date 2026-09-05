"""
ATHENA-MOTION: High-Precision Upper-Body Posture & Arm Fold Detector.
Detects discrete postural states including single arm fold, arms crossed over chest,
hands on hips, arms raised, and hands joined.
"""

from enum import Enum
from dataclasses import dataclass
from typing import Optional, Dict, Any, Tuple
import numpy as np

from athena_motion.dataset.schema import PoseLandmarkIndex
from athena_motion.biomechanics.kinematics import (
    calculate_angle_2d,
    calculate_euclidean_distance,
    calculate_midpoint
)

class PostureEvent(str, Enum):
    """Recognized upper-body kinematic postures."""
    NORMAL = "normal_stance"
    ARMS_FOLDED_CROSSED = "arms_folded_crossed"
    LEFT_ARM_FOLDED = "left_arm_folded"
    RIGHT_ARM_FOLDED = "right_arm_folded"
    HANDS_ON_HIPS = "hands_on_hips"
    HANDS_BEHIND_HEAD = "hands_behind_head"
    ARMS_RAISED_OVERHEAD = "arms_raised_overhead"
    HANDS_JOINED_CHEST = "hands_joined_chest"


@dataclass
class PostureState:
    """Detailed kinematic diagnostics for the current posture."""
    active_posture: PostureEvent
    confidence: float
    description: str
    left_elbow_angle: float
    right_elbow_angle: float
    left_shoulder_angle: float
    right_shoulder_angle: float
    wrist_distance: float
    is_arms_crossed: bool


class PostureEventDetector:
    """
    Evaluates 33 body landmarks to detect upper-body posture events and arm folds
    with high precision and temporal debounce.
    """
    def __init__(self, debounce_frames: int = 4):
        self.debounce_frames = debounce_frames
        self._current_posture = PostureEvent.NORMAL
        self._candidate_posture = PostureEvent.NORMAL
        self._candidate_count = 0

    def detect(self, landmarks: np.ndarray) -> PostureState:
        """
        Evaluates current 33-landmark skeleton and returns verified PostureState.
        """
        if landmarks is None or len(landmarks) < 33:
            return PostureState(
                active_posture=PostureEvent.NORMAL,
                confidence=0.0,
                description="No body landmarks detected",
                left_elbow_angle=180.0,
                right_elbow_angle=180.0,
                left_shoulder_angle=0.0,
                right_shoulder_angle=0.0,
                wrist_distance=1.0,
                is_arms_crossed=False
            )

        idx = PoseLandmarkIndex
        lm = landmarks

        # Key upper-body joints (normalized coordinates)
        l_shoulder = lm[idx.LEFT_SHOULDER][:3]
        r_shoulder = lm[idx.RIGHT_SHOULDER][:3]
        l_elbow = lm[idx.LEFT_ELBOW][:3]
        r_elbow = lm[idx.RIGHT_ELBOW][:3]
        l_wrist = lm[idx.LEFT_WRIST][:3]
        r_wrist = lm[idx.RIGHT_WRIST][:3]
        l_hip = lm[idx.LEFT_HIP][:3]
        r_hip = lm[idx.RIGHT_HIP][:3]

        shoulder_w = max(calculate_euclidean_distance(l_shoulder[:2], r_shoulder[:2]), 1e-4)

        # 1. Elbow flexion angles (Shoulder -> Elbow -> Wrist)
        l_elbow_angle = calculate_angle_2d(l_shoulder, l_elbow, l_wrist)
        r_elbow_angle = calculate_angle_2d(r_shoulder, r_elbow, r_wrist)

        # 2. Shoulder elevation angles (Hip -> Shoulder -> Elbow)
        l_shoulder_angle = calculate_angle_2d(l_hip, l_shoulder, l_elbow)
        r_shoulder_angle = calculate_angle_2d(r_hip, r_shoulder, r_elbow)

        # 3. Spatial distances normalized by shoulder width
        wrist_dist = calculate_euclidean_distance(l_wrist[:2], r_wrist[:2]) / shoulder_w
        chest_mid_y = (l_shoulder[1] + r_shoulder[1] + l_hip[1] + r_hip[1]) / 4.0

        # Torso boundaries
        min_shoulder_y = min(l_shoulder[1], r_shoulder[1])
        max_hip_y = max(l_hip[1], r_hip[1])

        # Check if wrists are within vertical chest zone
        l_wrist_in_chest = (l_wrist[1] > (min_shoulder_y - 0.05)) and (l_wrist[1] < max_hip_y)
        r_wrist_in_chest = (r_wrist[1] > (min_shoulder_y - 0.05)) and (r_wrist[1] < max_hip_y)

        # Left arm folded check (acute elbow flexion)
        l_arm_flexed = (l_elbow_angle < 75.0) and l_wrist_in_chest
        # Right arm folded check
        r_arm_flexed = (r_elbow_angle < 75.0) and r_wrist_in_chest

        # Cross-body wrist placement (forearms crossed over chest)
        # Left wrist situated towards or past right shoulder/bicep
        # Right wrist situated towards or past left shoulder/bicep
        chest_min_x = min(l_shoulder[0], r_shoulder[0]) - 0.05
        chest_max_x = max(l_shoulder[0], r_shoulder[0]) + 0.05

        wrists_crossed = (
            l_arm_flexed and r_arm_flexed and
            (wrist_dist < 0.65 or (l_wrist[0] > (r_shoulder[0] - 0.15) and r_wrist[0] < (l_shoulder[0] + 0.15))) and
            l_wrist_in_chest and r_wrist_in_chest
        )

        detected_posture = PostureEvent.NORMAL
        confidence = 0.85
        desc = "Normal Upper Body Stance"

        if wrists_crossed:
            detected_posture = PostureEvent.ARMS_FOLDED_CROSSED
            confidence = 0.96
            desc = "ARMS FOLDED ACROSS CHEST"
        elif l_arm_flexed and not r_arm_flexed:
            detected_posture = PostureEvent.LEFT_ARM_FOLDED
            confidence = 0.92
            desc = "LEFT ARM FOLDED / FLEXED"
        elif r_arm_flexed and not l_arm_flexed:
            detected_posture = PostureEvent.RIGHT_ARM_FOLDED
            confidence = 0.92
            desc = "RIGHT ARM FOLDED / FLEXED"
        elif l_shoulder_angle > 140.0 and r_shoulder_angle > 140.0 and l_wrist[1] < min_shoulder_y:
            detected_posture = PostureEvent.ARMS_RAISED_OVERHEAD
            confidence = 0.94
            desc = "ARMS RAISED OVERHEAD"
        elif wrist_dist < 0.25 and l_wrist_in_chest and r_wrist_in_chest and (l_elbow_angle < 85.0 and r_elbow_angle < 85.0):
            detected_posture = PostureEvent.HANDS_JOINED_CHEST
            confidence = 0.90
            desc = "HANDS JOINED AT CHEST"
        elif (calculate_euclidean_distance(l_wrist[:2], l_hip[:2]) / shoulder_w < 0.35 and
              calculate_euclidean_distance(r_wrist[:2], r_hip[:2]) / shoulder_w < 0.35 and
              l_elbow_angle < 125.0 and r_elbow_angle < 125.0):
            detected_posture = PostureEvent.HANDS_ON_HIPS
            confidence = 0.88
            desc = "HANDS ON HIPS"

        # Apply temporal debounce to eliminate single-frame flickering
        if detected_posture == self._candidate_posture:
            self._candidate_count += 1
        else:
            self._candidate_posture = detected_posture
            self._candidate_count = 1

        if self._candidate_count >= self.debounce_frames:
            self._current_posture = detected_posture

        return PostureState(
            active_posture=self._current_posture,
            confidence=confidence,
            description=desc if self._current_posture == detected_posture else self._current_posture.value.replace("_", " ").upper(),
            left_elbow_angle=round(l_elbow_angle, 1),
            right_elbow_angle=round(r_elbow_angle, 1),
            left_shoulder_angle=round(l_shoulder_angle, 1),
            right_shoulder_angle=round(r_shoulder_angle, 1),
            wrist_distance=round(wrist_dist, 2),
            is_arms_crossed=(self._current_posture == PostureEvent.ARMS_FOLDED_CROSSED)
        )
