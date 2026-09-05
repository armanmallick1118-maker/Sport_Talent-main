"""
ATHENA-MOTION: Dataset Schema and Landmark Definitions.
Contains standard 33-landmark mappings, skeleton connectivity graphs,
and feature definitions for biomechanical analysis and ML models.
"""

from enum import IntEnum, Enum
from typing import List, Tuple, Dict

class PoseLandmarkIndex(IntEnum):
    """33 Standard MediaPipe Pose Landmarks."""
    NOSE = 0
    LEFT_EYE_INNER = 1
    LEFT_EYE = 2
    LEFT_EYE_OUTER = 3
    RIGHT_EYE_INNER = 4
    RIGHT_EYE = 5
    RIGHT_EYE_OUTER = 6
    LEFT_EAR = 7
    RIGHT_EAR = 8
    MOUTH_LEFT = 9
    MOUTH_RIGHT = 10
    LEFT_SHOULDER = 11
    RIGHT_SHOULDER = 12
    LEFT_ELBOW = 13
    RIGHT_ELBOW = 14
    LEFT_WRIST = 15
    RIGHT_WRIST = 16
    LEFT_PINKY = 17
    RIGHT_PINKY = 18
    LEFT_INDEX = 19
    RIGHT_INDEX = 20
    LEFT_THUMB = 21
    RIGHT_THUMB = 22
    LEFT_HIP = 23
    RIGHT_HIP = 24
    LEFT_KNEE = 25
    RIGHT_KNEE = 26
    LEFT_ANKLE = 27
    RIGHT_ANKLE = 28
    LEFT_HEEL = 29
    RIGHT_HEEL = 30
    LEFT_FOOT_INDEX = 31
    RIGHT_FOOT_INDEX = 32


# Standard anatomical skeleton connection pairs (parent, child)
SKELETON_CONNECTIONS: List[Tuple[int, int]] = [
    # Face & Head
    (PoseLandmarkIndex.NOSE, PoseLandmarkIndex.LEFT_EYE),
    (PoseLandmarkIndex.LEFT_EYE, PoseLandmarkIndex.LEFT_EAR),
    (PoseLandmarkIndex.NOSE, PoseLandmarkIndex.RIGHT_EYE),
    (PoseLandmarkIndex.RIGHT_EYE, PoseLandmarkIndex.RIGHT_EAR),
    (PoseLandmarkIndex.MOUTH_LEFT, PoseLandmarkIndex.MOUTH_RIGHT),
    # Torso & Shoulders
    (PoseLandmarkIndex.LEFT_SHOULDER, PoseLandmarkIndex.RIGHT_SHOULDER),
    (PoseLandmarkIndex.LEFT_SHOULDER, PoseLandmarkIndex.LEFT_HIP),
    (PoseLandmarkIndex.RIGHT_SHOULDER, PoseLandmarkIndex.RIGHT_HIP),
    (PoseLandmarkIndex.LEFT_HIP, PoseLandmarkIndex.RIGHT_HIP),
    # Left Arm
    (PoseLandmarkIndex.LEFT_SHOULDER, PoseLandmarkIndex.LEFT_ELBOW),
    (PoseLandmarkIndex.LEFT_ELBOW, PoseLandmarkIndex.LEFT_WRIST),
    (PoseLandmarkIndex.LEFT_WRIST, PoseLandmarkIndex.LEFT_PINKY),
    (PoseLandmarkIndex.LEFT_WRIST, PoseLandmarkIndex.LEFT_INDEX),
    (PoseLandmarkIndex.LEFT_WRIST, PoseLandmarkIndex.LEFT_THUMB),
    # Right Arm
    (PoseLandmarkIndex.RIGHT_SHOULDER, PoseLandmarkIndex.RIGHT_ELBOW),
    (PoseLandmarkIndex.RIGHT_ELBOW, PoseLandmarkIndex.RIGHT_WRIST),
    (PoseLandmarkIndex.RIGHT_WRIST, PoseLandmarkIndex.RIGHT_PINKY),
    (PoseLandmarkIndex.RIGHT_WRIST, PoseLandmarkIndex.RIGHT_INDEX),
    (PoseLandmarkIndex.RIGHT_WRIST, PoseLandmarkIndex.RIGHT_THUMB),
    # Left Leg
    (PoseLandmarkIndex.LEFT_HIP, PoseLandmarkIndex.LEFT_KNEE),
    (PoseLandmarkIndex.LEFT_KNEE, PoseLandmarkIndex.LEFT_ANKLE),
    (PoseLandmarkIndex.LEFT_ANKLE, PoseLandmarkIndex.LEFT_HEEL),
    (PoseLandmarkIndex.LEFT_HEEL, PoseLandmarkIndex.LEFT_FOOT_INDEX),
    (PoseLandmarkIndex.LEFT_ANKLE, PoseLandmarkIndex.LEFT_FOOT_INDEX),
    # Right Leg
    (PoseLandmarkIndex.RIGHT_HIP, PoseLandmarkIndex.RIGHT_KNEE),
    (PoseLandmarkIndex.RIGHT_KNEE, PoseLandmarkIndex.RIGHT_ANKLE),
    (PoseLandmarkIndex.RIGHT_ANKLE, PoseLandmarkIndex.RIGHT_HEEL),
    (PoseLandmarkIndex.RIGHT_HEEL, PoseLandmarkIndex.RIGHT_FOOT_INDEX),
    (PoseLandmarkIndex.RIGHT_ANKLE, PoseLandmarkIndex.RIGHT_FOOT_INDEX),
]

class ExerciseType(str, Enum):
    """Exercise categories recognized by ATHENA-MOTION."""
    SQUAT = "squat"
    DEADLIFT = "deadlift"
    PUSHUP = "pushup"
    BICEP_CURL = "bicep_curl"
    LUNGE = "lunge"
    OVERHEAD_PRESS = "overhead_press"
    PLANK = "plank"
    IDLE = "idle"

class FormQuality(str, Enum):
    """Kinematic form quality states and common biomechanical deviations."""
    GOOD_FORM = "good_form"
    KNEE_VALGUS = "knee_valgus"                   # Knees caving inward
    EXCESSIVE_FORWARD_LEAN = "excessive_forward_lean" # Trunk inclination too forward
    INCOMPLETE_DEPTH = "incomplete_depth"         # Not reaching biomechanical parallel / full ROM
    ELBOW_FLARE = "elbow_flare"                   # Elbows flaring excessively out
    ASYMMETRICAL_STANCE = "asymmetrical_stance"   # Uneven hip/shoulder weight distribution
    ROUNDED_BACK = "rounded_back"                 # Excessive spinal flexion

class RepPhase(str, Enum):
    """Phases of an athletic repetition."""
    IDLE = "idle"
    ECCENTRIC = "eccentric"       # Downward / loading phase
    INFLECTION = "inflection"     # Bottom-most reversal point
    CONCENTRIC = "concentric"     # Upward / exertion phase
    COMPLETED = "completed"       # Rep concluded

# 14 Engineered Biomechanical Features
BIOMECHANICAL_FEATURE_NAMES: List[str] = [
    "angle_left_knee",
    "angle_right_knee",
    "angle_left_hip",
    "angle_right_hip",
    "angle_left_elbow",
    "angle_right_elbow",
    "angle_left_shoulder",
    "angle_right_shoulder",
    "angle_left_ankle",
    "angle_right_ankle",
    "trunk_inclination_angle",
    "shoulder_tilt_angle",
    "hip_tilt_angle",
    "squat_depth_ratio",
    "knee_valgus_ratio",
    "stance_width_ratio"
]

def generate_full_feature_names() -> List[str]:
    """
    Returns full feature names list:
    33 landmarks * 4 coords (x, y, z, visibility) + engineered biomechanical metrics.
    """
    names: List[str] = []
    for lm in PoseLandmarkIndex:
        names.extend([
            f"{lm.name.lower()}_x",
            f"{lm.name.lower()}_y",
            f"{lm.name.lower()}_z",
            f"{lm.name.lower()}_vis"
        ])
    names.extend(BIOMECHANICAL_FEATURE_NAMES)
    return names

ALL_FEATURE_NAMES: List[str] = generate_full_feature_names()
TOTAL_FEATURE_COUNT: int = len(ALL_FEATURE_NAMES)  # 33*4 + 16 = 148 features
