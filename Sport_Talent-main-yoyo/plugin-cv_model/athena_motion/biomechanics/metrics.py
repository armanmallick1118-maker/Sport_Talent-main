"""
ATHENA-MOTION: Biomechanical Metrics Calculator.
Extracts clinically grounded kinematic metrics, joint angles,
depth ratios, and alignment indices from 33 body landmarks.
"""

from dataclasses import dataclass, asdict
from typing import Dict, Any, Optional
import numpy as np

from athena_motion.dataset.schema import PoseLandmarkIndex, BIOMECHANICAL_FEATURE_NAMES
from athena_motion.biomechanics.kinematics import (
    calculate_angle_2d,
    calculate_angle_3d,
    calculate_trunk_inclination,
    calculate_segment_tilt,
    calculate_euclidean_distance,
    calculate_midpoint
)

@dataclass
class BiomechanicalMetrics:
    """Standard kinematic and postural metrics extracted per frame."""
    angle_left_knee: float = 180.0
    angle_right_knee: float = 180.0
    angle_left_hip: float = 180.0
    angle_right_hip: float = 180.0
    angle_left_elbow: float = 180.0
    angle_right_elbow: float = 180.0
    angle_left_shoulder: float = 0.0
    angle_right_shoulder: float = 0.0
    angle_left_ankle: float = 90.0
    angle_right_ankle: float = 90.0
    trunk_inclination_angle: float = 0.0
    shoulder_tilt_angle: float = 0.0
    hip_tilt_angle: float = 0.0
    squat_depth_ratio: float = 0.0
    knee_valgus_ratio: float = 1.0
    stance_width_ratio: float = 1.0

    def to_dict(self) -> Dict[str, float]:
        """Convert metrics to dictionary keyed by standard feature names."""
        return asdict(self)

    def to_array(self) -> np.ndarray:
        """Convert metrics to 1D float32 array in exact BIOMECHANICAL_FEATURE_NAMES order."""
        return np.array([
            self.angle_left_knee,
            self.angle_right_knee,
            self.angle_left_hip,
            self.angle_right_hip,
            self.angle_left_elbow,
            self.angle_right_elbow,
            self.angle_left_shoulder,
            self.angle_right_shoulder,
            self.angle_left_ankle,
            self.angle_right_ankle,
            self.trunk_inclination_angle,
            self.shoulder_tilt_angle,
            self.hip_tilt_angle,
            self.squat_depth_ratio,
            self.knee_valgus_ratio,
            self.stance_width_ratio
        ], dtype=np.float32)


def compute_biomechanical_metrics(landmarks: np.ndarray) -> BiomechanicalMetrics:
    """
    Computes biomechanical metrics from a (33, 3) or (33, 4) landmark array.
    landmark coords format: [x, y, z] or [x, y, z, visibility].
    """
    if landmarks is None or len(landmarks) < 33:
        return BiomechanicalMetrics()

    # Landmark shorthands
    lm = landmarks
    idx = PoseLandmarkIndex

    # Key anatomical joints
    l_shoulder = lm[idx.LEFT_SHOULDER][:3]
    r_shoulder = lm[idx.RIGHT_SHOULDER][:3]
    l_elbow = lm[idx.LEFT_ELBOW][:3]
    r_elbow = lm[idx.RIGHT_ELBOW][:3]
    l_wrist = lm[idx.LEFT_WRIST][:3]
    r_wrist = lm[idx.RIGHT_WRIST][:3]

    l_hip = lm[idx.LEFT_HIP][:3]
    r_hip = lm[idx.RIGHT_HIP][:3]
    l_knee = lm[idx.LEFT_KNEE][:3]
    r_knee = lm[idx.RIGHT_KNEE][:3]
    l_ankle = lm[idx.LEFT_ANKLE][:3]
    r_ankle = lm[idx.RIGHT_ANKLE][:3]
    l_foot = lm[idx.LEFT_FOOT_INDEX][:3]
    r_foot = lm[idx.RIGHT_FOOT_INDEX][:3]

    # Midpoints
    shoulder_mid = calculate_midpoint(l_shoulder, r_shoulder)
    hip_mid = calculate_midpoint(l_hip, r_hip)

    # 1. Joint Angles (Knees: Hip -> Knee -> Ankle)
    l_knee_angle = calculate_angle_2d(l_hip, l_knee, l_ankle)
    r_knee_angle = calculate_angle_2d(r_hip, r_knee, r_ankle)

    # 2. Joint Angles (Hips: Shoulder -> Hip -> Knee)
    l_hip_angle = calculate_angle_2d(l_shoulder, l_hip, l_knee)
    r_hip_angle = calculate_angle_2d(r_shoulder, r_hip, r_knee)

    # 3. Joint Angles (Elbows: Shoulder -> Elbow -> Wrist)
    l_elbow_angle = calculate_angle_2d(l_shoulder, l_elbow, l_wrist)
    r_elbow_angle = calculate_angle_2d(r_shoulder, r_elbow, r_wrist)

    # 4. Shoulder Angles (Hip -> Shoulder -> Elbow)
    l_shoulder_angle = calculate_angle_2d(l_hip, l_shoulder, l_elbow)
    r_shoulder_angle = calculate_angle_2d(r_hip, r_shoulder, r_elbow)

    # 5. Ankle Angles (Knee -> Ankle -> Foot Index)
    l_ankle_angle = calculate_angle_2d(l_knee, l_ankle, l_foot)
    r_ankle_angle = calculate_angle_2d(r_knee, r_ankle, r_foot)

    # 6. Postural & Alignment
    trunk_inclination = calculate_trunk_inclination(shoulder_mid, hip_mid)
    shoulder_tilt = calculate_segment_tilt(l_shoulder, r_shoulder)
    hip_tilt = calculate_segment_tilt(l_hip, r_hip)

    # 7. Squat Depth Ratio:
    # Hip Y vs Knee Y. Normalized by femur length (hip-knee distance).
    # In screen coordinates, positive Y is downwards.
    # When standing: hip_y is higher (smaller value) than knee_y -> ratio < 0.
    # When squatting to parallel: hip_y approaches knee_y -> ratio approaches 0 or > 0.
    femur_len = (calculate_euclidean_distance(l_hip, l_knee) + calculate_euclidean_distance(r_hip, r_knee)) / 2.0
    femur_len = max(femur_len, 1e-4)
    avg_hip_y = (l_hip[1] + r_hip[1]) / 2.0
    avg_knee_y = (l_knee[1] + r_knee[1]) / 2.0
    squat_depth_ratio = float((avg_hip_y - avg_knee_y) / femur_len)

    # 8. Knee Valgus Ratio:
    # Ratio of Knee Distance to Ankle Distance.
    # Values significantly < 0.8 indicate inward knee collapse (valgus).
    knee_dist = calculate_euclidean_distance(l_knee[:2], r_knee[:2])
    ankle_dist = calculate_euclidean_distance(l_ankle[:2], r_ankle[:2])
    knee_valgus_ratio = float(knee_dist / max(ankle_dist, 1e-4))

    # 9. Stance Width Ratio:
    # Ankle distance normalized by shoulder width.
    # ~1.0 = shoulder-width stance.
    shoulder_dist = calculate_euclidean_distance(l_shoulder[:2], r_shoulder[:2])
    stance_width_ratio = float(ankle_dist / max(shoulder_dist, 1e-4))

    return BiomechanicalMetrics(
        angle_left_knee=round(l_knee_angle, 2),
        angle_right_knee=round(r_knee_angle, 2),
        angle_left_hip=round(l_hip_angle, 2),
        angle_right_hip=round(r_hip_angle, 2),
        angle_left_elbow=round(l_elbow_angle, 2),
        angle_right_elbow=round(r_elbow_angle, 2),
        angle_left_shoulder=round(l_shoulder_angle, 2),
        angle_right_shoulder=round(r_shoulder_angle, 2),
        angle_left_ankle=round(l_ankle_angle, 2),
        angle_right_ankle=round(r_ankle_angle, 2),
        trunk_inclination_angle=round(trunk_inclination, 2),
        shoulder_tilt_angle=round(shoulder_tilt, 2),
        hip_tilt_angle=round(hip_tilt, 2),
        squat_depth_ratio=round(squat_depth_ratio, 3),
        knee_valgus_ratio=round(knee_valgus_ratio, 3),
        stance_width_ratio=round(stance_width_ratio, 3)
    )
