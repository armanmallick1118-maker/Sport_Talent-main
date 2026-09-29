"""
core/constants.py
=================
All fixed constants used across the MediaPipeline system.
Includes all 33 MediaPipe landmark names, body-part groupings,
skeleton connection pairs, and critical landmark sets for quality checking.

Reference: https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
"""

from __future__ import annotations
from enum import IntEnum
from typing import Dict, List, Tuple


# ── MediaPipe 33 Landmark Indices ────────────────────────────────────────────

class LandmarkIndex(IntEnum):
    """Integer indices matching MediaPipe's internal landmark ordering."""
    NOSE                = 0
    LEFT_EYE_INNER      = 1
    LEFT_EYE            = 2
    LEFT_EYE_OUTER      = 3
    RIGHT_EYE_INNER     = 4
    RIGHT_EYE           = 5
    RIGHT_EYE_OUTER     = 6
    LEFT_EAR            = 7
    RIGHT_EAR           = 8
    MOUTH_LEFT          = 9
    MOUTH_RIGHT         = 10
    LEFT_SHOULDER       = 11
    RIGHT_SHOULDER      = 12
    LEFT_ELBOW          = 13
    RIGHT_ELBOW         = 14
    LEFT_WRIST          = 15
    RIGHT_WRIST         = 16
    LEFT_PINKY          = 17
    RIGHT_PINKY         = 18
    LEFT_INDEX          = 19
    RIGHT_INDEX         = 20
    LEFT_THUMB          = 21
    RIGHT_THUMB         = 22
    LEFT_HIP            = 23
    RIGHT_HIP           = 24
    LEFT_KNEE           = 25
    RIGHT_KNEE          = 26
    LEFT_ANKLE          = 27
    RIGHT_ANKLE         = 28
    LEFT_HEEL           = 29
    RIGHT_HEEL          = 30
    LEFT_FOOT_INDEX     = 31
    RIGHT_FOOT_INDEX    = 32


# ── Landmark Name List (index → name) ────────────────────────────────────────
# List position matches MediaPipe landmark index exactly.

LANDMARK_NAMES: List[str] = [
    "nose",             # 0
    "left_eye_inner",   # 1
    "left_eye",         # 2
    "left_eye_outer",   # 3
    "right_eye_inner",  # 4
    "right_eye",        # 5
    "right_eye_outer",  # 6
    "left_ear",         # 7
    "right_ear",        # 8
    "mouth_left",       # 9
    "mouth_right",      # 10
    "left_shoulder",    # 11
    "right_shoulder",   # 12
    "left_elbow",       # 13
    "right_elbow",      # 14
    "left_wrist",       # 15
    "right_wrist",      # 16
    "left_pinky",       # 17
    "right_pinky",      # 18
    "left_index",       # 19
    "right_index",      # 20
    "left_thumb",       # 21
    "right_thumb",      # 22
    "left_hip",         # 23
    "right_hip",        # 24
    "left_knee",        # 25
    "right_knee",       # 26
    "left_ankle",       # 27
    "right_ankle",      # 28
    "left_heel",        # 29
    "right_heel",       # 30
    "left_foot_index",  # 31
    "right_foot_index", # 32
]

# Quick reverse lookup: name → index
LANDMARK_INDEX: Dict[str, int] = {name: i for i, name in enumerate(LANDMARK_NAMES)}

assert len(LANDMARK_NAMES) == 33, "Must have exactly 33 landmark names"


# ── Body Part Groupings ──────────────────────────────────────────────────────

BODY_PARTS: Dict[str, List[str]] = {
    "face": [
        "nose", "left_eye_inner", "left_eye", "left_eye_outer",
        "right_eye_inner", "right_eye", "right_eye_outer",
        "left_ear", "right_ear", "mouth_left", "mouth_right",
    ],
    "torso": [
        "left_shoulder", "right_shoulder",
        "left_hip", "right_hip",
    ],
    "left_arm": [
        "left_shoulder", "left_elbow", "left_wrist",
        "left_pinky", "left_index", "left_thumb",
    ],
    "right_arm": [
        "right_shoulder", "right_elbow", "right_wrist",
        "right_pinky", "right_index", "right_thumb",
    ],
    "left_leg": [
        "left_hip", "left_knee", "left_ankle",
        "left_heel", "left_foot_index",
    ],
    "right_leg": [
        "right_hip", "right_knee", "right_ankle",
        "right_heel", "right_foot_index",
    ],
}

# Landmarks that MUST be visible for a frame to be considered valid
CRITICAL_LANDMARKS: List[str] = [
    "left_shoulder",
    "right_shoulder",
    "left_hip",
    "right_hip",
]

# Landmarks needed for angle calculation (can partially fail)
ANGLE_LANDMARKS: List[str] = [
    "left_shoulder", "right_shoulder",
    "left_elbow", "right_elbow",
    "left_wrist", "right_wrist",
    "left_hip", "right_hip",
    "left_knee", "right_knee",
    "left_ankle", "right_ankle",
]


# ── Skeleton Connection Pairs ─────────────────────────────────────────────────
# Each tuple = (landmark_name_A, landmark_name_B)
# Used by the visualizer to draw bones between joints.

SKELETON_CONNECTIONS: List[Tuple[str, str]] = [
    # ── Face ──────────────────────────────────────
    ("left_ear",        "left_eye_outer"),
    ("left_eye_outer",  "left_eye"),
    ("left_eye",        "left_eye_inner"),
    ("left_eye_inner",  "nose"),
    ("nose",            "right_eye_inner"),
    ("right_eye_inner", "right_eye"),
    ("right_eye",       "right_eye_outer"),
    ("right_eye_outer", "right_ear"),
    ("mouth_left",      "mouth_right"),

    # ── Torso ─────────────────────────────────────
    ("left_shoulder",   "right_shoulder"),
    ("left_shoulder",   "left_hip"),
    ("right_shoulder",  "right_hip"),
    ("left_hip",        "right_hip"),

    # ── Left Arm ──────────────────────────────────
    ("left_shoulder",   "left_elbow"),
    ("left_elbow",      "left_wrist"),
    ("left_wrist",      "left_thumb"),
    ("left_wrist",      "left_index"),
    ("left_wrist",      "left_pinky"),
    ("left_index",      "left_pinky"),

    # ── Right Arm ─────────────────────────────────
    ("right_shoulder",  "right_elbow"),
    ("right_elbow",     "right_wrist"),
    ("right_wrist",     "right_thumb"),
    ("right_wrist",     "right_index"),
    ("right_wrist",     "right_pinky"),
    ("right_index",     "right_pinky"),

    # ── Left Leg ──────────────────────────────────
    ("left_hip",        "left_knee"),
    ("left_knee",       "left_ankle"),
    ("left_ankle",      "left_heel"),
    ("left_ankle",      "left_foot_index"),
    ("left_heel",       "left_foot_index"),

    # ── Right Leg ─────────────────────────────────
    ("right_hip",       "right_knee"),
    ("right_knee",      "right_ankle"),
    ("right_ankle",     "right_heel"),
    ("right_ankle",     "right_foot_index"),
    ("right_heel",      "right_foot_index"),
]


# ── Body-Part Color Map (BGR for OpenCV) ─────────────────────────────────────
# Used by the visualizer to color-code different body regions.

BODY_PART_COLORS_BGR: Dict[str, Tuple[int, int, int]] = {
    "face":      (255, 220, 100),   # warm gold
    "torso":     (100, 200, 255),   # sky blue
    "left_arm":  (80,  200, 80),    # green
    "right_arm": (80,  80,  220),   # blue-purple
    "left_leg":  (220, 120, 50),    # orange
    "right_leg": (200, 60,  180),   # magenta
}

# Landmark → body part lookup (for coloring individual points)
LANDMARK_BODY_PART: Dict[str, str] = {}
for part, names in BODY_PARTS.items():
    for name in names:
        LANDMARK_BODY_PART[name] = part


# ── Joint Angle Definitions ──────────────────────────────────────────────────
# Each entry: angle_name → (point_A, vertex_B, point_C)
# Angle is computed at vertex_B between rays B→A and B→C

JOINT_ANGLE_DEFS: Dict[str, Tuple[str, str, str]] = {
    # Lower body
    "left_knee_angle":      ("left_hip",      "left_knee",      "left_ankle"),
    "right_knee_angle":     ("right_hip",     "right_knee",     "right_ankle"),
    "left_hip_angle":       ("left_shoulder", "left_hip",       "left_knee"),
    "right_hip_angle":      ("right_shoulder","right_hip",      "right_knee"),
    "left_ankle_angle":     ("left_knee",     "left_ankle",     "left_foot_index"),
    "right_ankle_angle":    ("right_knee",    "right_ankle",    "right_foot_index"),

    # Upper body
    "left_elbow_angle":     ("left_shoulder", "left_elbow",     "left_wrist"),
    "right_elbow_angle":    ("right_shoulder","right_elbow",    "right_wrist"),
    "left_shoulder_angle":  ("left_elbow",    "left_shoulder",  "left_hip"),
    "right_shoulder_angle": ("right_elbow",   "right_shoulder", "right_hip"),

    # Trunk
    "trunk_lean":           ("left_shoulder", "left_hip",       "left_knee"),
    "hip_tilt":             ("left_hip",      "right_hip",      "right_knee"),
}

# All joint angle names (useful for CSV header generation)
JOINT_ANGLE_NAMES: List[str] = list(JOINT_ANGLE_DEFS.keys())


# ── Motion JSON Schema Version ────────────────────────────────────────────────
MOTION_JSON_SCHEMA_VERSION = "1.0.0"

# ── Tensor Export Shape ───────────────────────────────────────────────────────
# (num_frames, num_landmarks, num_features)
# Features: [x, y, z, visibility, world_x, world_y, world_z]
TENSOR_NUM_LANDMARKS = 33
TENSOR_NUM_FEATURES  = 7
TENSOR_FEATURE_NAMES = ["x", "y", "z", "visibility", "world_x", "world_y", "world_z"]

# ── API Status Values ─────────────────────────────────────────────────────────
class ProcessingStatus:
    PENDING     = "PENDING"
    EXTRACTING  = "EXTRACTING"
    DETECTING   = "DETECTING"
    ESTIMATING  = "ESTIMATING"
    CLEANING    = "CLEANING"
    EXPORTING   = "EXPORTING"
    VISUALIZING = "VISUALIZING"
    DONE        = "DONE"
    FAILED      = "FAILED"

    ALL = [
        PENDING, EXTRACTING, DETECTING, ESTIMATING,
        CLEANING, EXPORTING, VISUALIZING, DONE, FAILED,
    ]
    TERMINAL = [DONE, FAILED]
