"""
ATHENA-MOTION: Kinematic Mathematics Layer.
Provides high-performance vector math, 2D and 3D joint angle computations,
trunk inclination, and anatomical distance normalizations.
"""

import math
import numpy as np
from typing import Tuple, Union, Optional

def calculate_angle_2d(
    p1: Union[np.ndarray, Tuple[float, float]],
    p2: Union[np.ndarray, Tuple[float, float]],
    p3: Union[np.ndarray, Tuple[float, float]]
) -> float:
    """
    Computes the 2D interior angle (in degrees: 0° - 180°) formed at vertex point p2:
    Vector BA = p1 - p2
    Vector BC = p3 - p2
    """
    p1 = np.asarray(p1)[:2]
    p2 = np.asarray(p2)[:2]
    p3 = np.asarray(p3)[:2]

    ba = p1 - p2
    bc = p3 - p2

    norm_ba = np.linalg.norm(ba)
    norm_bc = np.linalg.norm(bc)

    if norm_ba < 1e-6 or norm_bc < 1e-6:
        return 180.0

    cosine_angle = np.dot(ba, bc) / (norm_ba * norm_bc)
    # Clamp to [-1.0, 1.0] to prevent floating point domain errors in arccos
    cosine_angle = np.clip(cosine_angle, -1.0, 1.0)
    angle_rad = np.arccos(cosine_angle)
    return float(np.degrees(angle_rad))


def calculate_angle_3d(
    p1: Union[np.ndarray, Tuple[float, float, float]],
    p2: Union[np.ndarray, Tuple[float, float, float]],
    p3: Union[np.ndarray, Tuple[float, float, float]]
) -> float:
    """
    Computes the 3D interior angle (in degrees: 0° - 180°) formed at joint vertex p2:
    using 3D vector dot products.
    """
    p1 = np.asarray(p1)[:3]
    p2 = np.asarray(p2)[:3]
    p3 = np.asarray(p3)[:3]

    v1 = p1 - p2
    v2 = p3 - p2

    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)

    if norm_v1 < 1e-6 or norm_v2 < 1e-6:
        return 180.0

    cosine_angle = np.dot(v1, v2) / (norm_v1 * norm_v2)
    cosine_angle = np.clip(cosine_angle, -1.0, 1.0)
    angle_rad = np.arccos(cosine_angle)
    return float(np.degrees(angle_rad))


def calculate_trunk_inclination(
    shoulder_mid: Union[np.ndarray, Tuple[float, float]],
    hip_mid: Union[np.ndarray, Tuple[float, float]]
) -> float:
    """
    Computes trunk inclination (torso angle) relative to true vertical (gravity vector).
    0° = perfectly vertical / upright torso.
    90° = horizontal torso (e.g. parallel to ground, as in deep hip hinge / plank).
    """
    shoulder_mid = np.asarray(shoulder_mid)[:2]
    hip_mid = np.asarray(hip_mid)[:2]

    # Torso vector pointing from hip to shoulder
    torso_vec = shoulder_mid - hip_mid
    # In screen coordinates, Y points downwards.
    # A vertical torso vector going upwards has dx = 0, dy < 0.
    dx = float(torso_vec[0])
    dy = float(-torso_vec[1])  # invert Y so up is positive

    # Angle relative to vertical axis (0, 1)
    angle_rad = math.atan2(abs(dx), max(dy, 1e-6))
    return float(math.degrees(angle_rad))


def calculate_segment_tilt(
    left_pt: Union[np.ndarray, Tuple[float, float]],
    right_pt: Union[np.ndarray, Tuple[float, float]]
) -> float:
    """
    Computes the deviation of a bilateral segment (e.g. left/right shoulders or hips)
    from horizontal (0° = level horizontal line).
    """
    left_pt = np.asarray(left_pt)[:2]
    right_pt = np.asarray(right_pt)[:2]

    dx = right_pt[0] - left_pt[0]
    dy = right_pt[1] - left_pt[1]

    if abs(dx) < 1e-6:
        return 90.0

    tilt_rad = math.atan2(abs(dy), abs(dx))
    return float(math.degrees(tilt_rad))


def calculate_euclidean_distance(
    p1: Union[np.ndarray, Tuple[float, ...]],
    p2: Union[np.ndarray, Tuple[float, ...]]
) -> float:
    """Calculates Euclidean distance between two points."""
    return float(np.linalg.norm(np.asarray(p1) - np.asarray(p2)))


def calculate_midpoint(
    p1: Union[np.ndarray, Tuple[float, ...]],
    p2: Union[np.ndarray, Tuple[float, ...]]
) -> np.ndarray:
    """Calculates anatomical midpoint between two symmetric landmarks."""
    return (np.asarray(p1) + np.asarray(p2)) / 2.0
