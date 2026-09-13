"""
core/pose_estimator.py
======================
MediaPipe Pose wrapper (Steps 10 and 11).

Handles tracking 33 pose landmarks, extracting both normalized image coordinates
and metric world coordinates, and packaging them into clean data structures.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import mediapipe as mp
import numpy as np

from core.constants import LANDMARK_NAMES
from core.logger import get_logger

log = get_logger("pose_estimator")


# ─────────────────────────────────────────────────────────────────────────────
#  Step 11 — Data Structures
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class LandmarkData:
    """
    Combines both normalized image coordinates and metric 3D world coordinates
    for a single MediaPipe landmark.
    """
    name: str
    index: int
    x: float           # normalized (0-1) relative to frame width
    y: float           # normalized (0-1) relative to frame height
    z: float           # depth relative to hip (normalized)
    visibility: float  # 0-1 confidence
    world_x: float     # metric x in meters (world coords)
    world_y: float     # metric y in meters
    world_z: float     # metric z in meters


@dataclass
class PoseResult:
    """
    Complete pose estimation result for a single frame.
    """
    frame_number: int
    timestamp_ms: float
    landmarks: Dict[str, LandmarkData]   # keyed by landmark name
    has_pose: bool
    detection_confidence: float
    segmentation_mask: Optional[np.ndarray]
    raw_result: Any  # original mp result object


# ─────────────────────────────────────────────────────────────────────────────
#  Step 10 — MediaPipe Pose Wrapper
# ─────────────────────────────────────────────────────────────────────────────

class PoseEstimator:
    """
    Wrapper around mp.solutions.pose.Pose.
    Provides methods for single-frame and batch pose estimation.
    """
    
    LANDMARK_NAMES = LANDMARK_NAMES  # Use centralized list from core.constants

    def __init__(
        self,
        model_complexity: int = 2,
        min_detection_confidence: float = 0.7,
        min_tracking_confidence: float = 0.5,
        smooth_landmarks: bool = True,
        enable_segmentation: bool = False,
        session_id: str = "global",
    ) -> None:
        
        self.model_complexity = model_complexity
        self._log = get_logger("pose_estimator", session_id=session_id)
        
        self._log.info(
            "Initializing MediaPipe Pose | complexity={c} | seg={s} | smooth={sm}",
            c=model_complexity, s=enable_segmentation, sm=smooth_landmarks
        )
        
        self._pose = mp.solutions.pose.Pose(
            static_image_mode=False,  # Use video tracking mode
            model_complexity=model_complexity,
            enable_segmentation=enable_segmentation,
            smooth_landmarks=smooth_landmarks,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )

    def estimate(self, frame_rgb: np.ndarray, frame_number: int = 0, timestamp_ms: float = 0.0) -> PoseResult:
        """
        Estimates pose for a single RGB frame.
        """
        # MediaPipe requires RGB
        results = self._pose.process(frame_rgb)
        
        has_pose = results.pose_landmarks is not None
        landmarks_dict: Dict[str, LandmarkData] = {}
        
        if has_pose:
            # We have both normalized and world landmarks
            norm_lms = results.pose_landmarks.landmark
            world_lms = results.pose_world_landmarks.landmark
            
            for idx, name in enumerate(self.LANDMARK_NAMES):
                # Ensure we don't index out of bounds if MP changes somehow
                if idx < len(norm_lms) and idx < len(world_lms):
                    n_lm = norm_lms[idx]
                    w_lm = world_lms[idx]
                    
                    landmarks_dict[name] = LandmarkData(
                        name=name,
                        index=idx,
                        x=n_lm.x,
                        y=n_lm.y,
                        z=n_lm.z,
                        visibility=n_lm.visibility,
                        world_x=w_lm.x,
                        world_y=w_lm.y,
                        world_z=w_lm.z,
                    )
                    
        return PoseResult(
            frame_number=frame_number,
            timestamp_ms=timestamp_ms,
            landmarks=landmarks_dict,
            has_pose=has_pose,
            # We don't have direct access to overall detection confidence from MP in python,
            # so we'll average visibility as a proxy if pose exists.
            detection_confidence=np.mean([lm.visibility for lm in landmarks_dict.values()]) if has_pose else 0.0,
            segmentation_mask=results.segmentation_mask if has_pose and results.segmentation_mask is not None else None,
            raw_result=results,
        )

    def estimate_batch(self, frames: List[np.ndarray], start_frame_num: int = 0) -> List[PoseResult]:
        """
        Helper to estimate pose for a list of frames sequentially.
        """
        results = []
        for i, frame in enumerate(frames):
            results.append(self.estimate(frame, frame_number=start_frame_num + i))
        return results

    def close(self):
        """Releases underlying MediaPipe resources."""
        if self._pose:
            self._pose.close()
            self._log.info("MediaPipe Pose resources released.")


# ─────────────────────────────────────────────────────────────────────────────
#  Step 12 — Biomechanical Angle Calculations
# ─────────────────────────────────────────────────────────────────────────────

def vector_angle(a: np.ndarray, b: np.ndarray, c: np.ndarray) -> float:
    """
    Computes the angle at point `b`, given points `a`-`b`-`c` in 2D or 3D space.
    Returns the angle in degrees (0.0 to 180.0).
    """
    ba = a - b
    bc = c - b
    
    # Calculate dot product and magnitudes
    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6)
    
    # Clip to avoid floating point errors out of arccos domain [-1, 1]
    cosine_angle = np.clip(cosine_angle, -1.0, 1.0)
    angle_rad = np.arccos(cosine_angle)
    
    return float(np.degrees(angle_rad))

def compute_joint_angles(landmarks: Dict[str, LandmarkData]) -> Dict[str, float]:
    """
    Computes key biomechanical angles using 3D world coordinates.
    Returns a dictionary of angle names to degrees.
    """
    angles = {}
    
    # Helper to safely extract a numpy array for a landmark
    def get_pt(name: str) -> Optional[np.ndarray]:
        if name in landmarks and landmarks[name].visibility > 0.1:
            lm = landmarks[name]
            return np.array([lm.world_x, lm.world_y, lm.world_z])
        return None
        
    # Knees
    l_hip, l_knee, l_ankle = get_pt('left_hip'), get_pt('left_knee'), get_pt('left_ankle')
    if l_hip is not None and l_knee is not None and l_ankle is not None:
        angles['left_knee_angle'] = vector_angle(l_hip, l_knee, l_ankle)
        
    r_hip, r_knee, r_ankle = get_pt('right_hip'), get_pt('right_knee'), get_pt('right_ankle')
    if r_hip is not None and r_knee is not None and r_ankle is not None:
        angles['right_knee_angle'] = vector_angle(r_hip, r_knee, r_ankle)
        
    # Elbows
    l_sh, l_elb, l_wr = get_pt('left_shoulder'), get_pt('left_elbow'), get_pt('left_wrist')
    if l_sh is not None and l_elb is not None and l_wr is not None:
        angles['left_elbow_angle'] = vector_angle(l_sh, l_elb, l_wr)
        
    r_sh, r_elb, r_wr = get_pt('right_shoulder'), get_pt('right_elbow'), get_pt('right_wrist')
    if r_sh is not None and r_elb is not None and r_wr is not None:
        angles['right_elbow_angle'] = vector_angle(r_sh, r_elb, r_wr)
        
    # Shoulders
    if l_elb is not None and l_sh is not None and l_hip is not None:
        angles['left_shoulder_angle'] = vector_angle(l_elb, l_sh, l_hip)
        
    if r_elb is not None and r_sh is not None and r_hip is not None:
        angles['right_shoulder_angle'] = vector_angle(r_elb, r_sh, r_hip)
        
    # Hip / Pelvis tilt (lateral angle between left and right hip relative to horizontal)
    if l_hip is not None and r_hip is not None:
        # Calculate angle against the horizontal vector [1, 0, 0]
        hip_vec = r_hip - l_hip
        horiz = np.array([1.0, 0.0, 0.0])
        cos_ang = np.dot(hip_vec, horiz) / (np.linalg.norm(hip_vec) + 1e-6)
        angles['hip_angle'] = float(np.degrees(np.arccos(np.clip(cos_ang, -1.0, 1.0))))
        
    # Trunk lean (forward lean)
    if l_sh is not None and r_sh is not None and l_hip is not None and r_hip is not None:
        sh_mid = (l_sh + r_sh) / 2.0
        hip_mid = (l_hip + r_hip) / 2.0
        
        # Calculate angle of the trunk (hip to shoulder) against the vertical vector [0, -1, 0]
        # In MediaPipe world coords, y is usually down (positive = down) or up.
        # Generally world_y is up (+y is up). Let's use [0, 1, 0] as vertical up.
        trunk_vec = sh_mid - hip_mid
        vertical = np.array([0.0, 1.0, 0.0])
        
        cos_ang = np.dot(trunk_vec, vertical) / (np.linalg.norm(trunk_vec) + 1e-6)
        angles['trunk_lean'] = float(np.degrees(np.arccos(np.clip(cos_ang, -1.0, 1.0))))
        
        # We can treat spine_alignment similarly
        angles['spine_alignment'] = angles['trunk_lean']
        
    return angles
