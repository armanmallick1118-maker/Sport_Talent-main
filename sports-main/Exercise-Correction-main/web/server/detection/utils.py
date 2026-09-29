"""
web/server/detection/utils.py
=============================
Core geometry, landmark extraction, and visualization utility functions.
Independent of Django and web frameworks.
"""

import os
import math
import cv2
import numpy as np
import mediapipe as mp

mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose


def calculate_angle(point1: list, point2: list, point3: list) -> float:
    """
    Calculate the interior angle (in degrees) between three 2D/3D points (vertex at point2).
    """
    p1 = np.array(point1[:2], dtype=float)
    p2 = np.array(point2[:2], dtype=float)
    p3 = np.array(point3[:2], dtype=float)

    angle_rad = np.arctan2(p3[1] - p2[1], p3[0] - p2[0]) - np.arctan2(p1[1] - p2[1], p1[0] - p2[0])
    angle_deg = np.abs(angle_rad * 180.0 / np.pi)

    if angle_deg > 180.0:
        angle_deg = 360.0 - angle_deg

    return float(angle_deg)


def calculate_distance(point1: list, point2: list) -> float:
    """Calculate Euclidean distance between 2 points."""
    x1, y1 = point1[:2]
    x2, y2 = point2[:2]
    return float(math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2))


def extract_important_keypoints(results, important_landmarks: list) -> list:
    """
    Extracts keypoint coordinates [x, y, z, visibility] for the specified
    MediaPipe PoseLandmark names in the exact list order provided.
    """
    if not results or not results.pose_landmarks:
        return []

    landmarks = results.pose_landmarks.landmark
    data = []
    for lm in important_landmarks:
        idx = mp_pose.PoseLandmark[lm].value
        kp = landmarks[idx]
        data.extend([kp.x, kp.y, kp.z, kp.visibility])

    return data


def get_drawing_color(error: bool) -> tuple:
    """Get landmark and connection colors based on error state (BGR)."""
    LIGHT_BLUE = (244, 117, 66)
    LIGHT_PINK = (245, 66, 230)
    LIGHT_RED = (29, 62, 199)
    LIGHT_YELLOW = (1, 143, 241)

    return (LIGHT_YELLOW, LIGHT_RED) if error else (LIGHT_BLUE, LIGHT_PINK)


def rescale_frame(frame, percent: float = 50):
    """Rescale OpenCV frame by a given percentage."""
    if frame is None:
        return None
    width = int(frame.shape[1] * percent / 100)
    height = int(frame.shape[0] * percent / 100)
    return cv2.resize(frame, (width, height), interpolation=cv2.INTER_AREA)


def resolve_model_path(relative_path: str) -> str:
    """
    Locates a model or scaler file across common root directories:
    1. Relative to this detection directory
    2. Relative to Exercise-Correction-main root
    3. Direct absolute path if already exists
    """
    if os.path.isabs(relative_path) and os.path.exists(relative_path):
        return relative_path

    current_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(current_dir, relative_path),
        os.path.join(current_dir, "..", "..", "..", relative_path),
        os.path.join(current_dir, "..", "..", relative_path),
        os.path.abspath(relative_path),
    ]

    for p in candidates:
        norm = os.path.normpath(p)
        if os.path.exists(norm):
            return norm

    # Fallback to the first candidate path if not yet created
    return os.path.normpath(candidates[1])
