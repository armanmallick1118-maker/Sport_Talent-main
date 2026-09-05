"""
core/quality_checker.py
=======================
Quality Checker module (Step 13).

Analyzes MediaPipe pose results per-frame to determine tracking quality,
flags occlusions, checks for critical landmarks, and generates a QualityReport.
"""

from __future__ import annotations

from enum import Enum
from typing import List, Optional

from api.models.response_models import QualityReport
from core.pose_estimator import PoseResult
from core.logger import get_logger

log = get_logger("quality_checker")


class QualityIssue(str, Enum):
    LOW_OVERALL_VISIBILITY = "low_overall_visibility"
    MISSING_CRITICAL_LANDMARK = "missing_critical"
    POSE_NOT_DETECTED = "no_pose"
    EXTREME_OCCLUSION = "occlusion"
    MOTION_BLUR = "motion_blur"
    INCOHERENT_POSITION = "incoherent_position"


class QualityChecker:
    def __init__(
        self,
        min_visibility: float = 0.6,
        critical_landmarks: Optional[List[str]] = None,
        session_id: str = "global",
    ) -> None:
        self.min_visibility = min_visibility
        self._log = get_logger("quality_checker", session_id=session_id)
        
        # Default critical landmarks if none provided
        if critical_landmarks is None:
            self.critical_landmarks = [
                'left_shoulder', 'right_shoulder',
                'left_hip', 'right_hip'
            ]
        else:
            self.critical_landmarks = critical_landmarks
            
    def check_frame(self, pose_result: PoseResult) -> QualityReport:
        """
        Analyzes a single frame's pose result and returns a QualityReport.
        """
        issues: List[str] = []
        
        if not pose_result.has_pose or not pose_result.landmarks:
            issues.append(QualityIssue.POSE_NOT_DETECTED)
            return QualityReport(
                overall_score=0.0,
                is_valid=False,
                avg_visibility=0.0,
                low_visibility_landmarks=[],
                missing_critical_landmarks=self.critical_landmarks,
                issues=issues,
            )
            
        landmarks = pose_result.landmarks
        
        # Calculate visibility
        vis_scores = [lm.visibility for lm in landmarks.values()]
        avg_vis = sum(vis_scores) / len(vis_scores) if vis_scores else 0.0
        
        # Find low visibility landmarks
        low_vis_lms = [
            name for name, lm in landmarks.items()
            if lm.visibility < self.min_visibility
        ]
        
        if avg_vis < self.min_visibility:
            issues.append(QualityIssue.LOW_OVERALL_VISIBILITY)
            
        # Check critical landmarks
        missing_critical = []
        for crit in self.critical_landmarks:
            if crit not in landmarks or landmarks[crit].visibility < self.min_visibility:
                missing_critical.append(crit)
                
        # Special check: At least one leg must be visible
        l_knee_vis = landmarks.get('left_knee')
        r_knee_vis = landmarks.get('right_knee')
        
        l_knee_ok = l_knee_vis is not None and l_knee_vis.visibility >= self.min_visibility
        r_knee_ok = r_knee_vis is not None and r_knee_vis.visibility >= self.min_visibility
        
        if not (l_knee_ok or r_knee_ok):
            missing_critical.append('any_knee')
            
        if missing_critical:
            issues.append(QualityIssue.MISSING_CRITICAL_LANDMARK)
            
        # Check for extreme occlusion
        if len(low_vis_lms) > len(landmarks) * 0.5:
            issues.append(QualityIssue.EXTREME_OCCLUSION)
            
        # Coherence check (e.g., knee above hip in world coords is usually an error in running,
        # but let's just do a basic sanity check: left shoulder should be left of right shoulder 
        # in camera space? Not necessarily if they turn around. We'll skip complex coherence for now.)
        
        # Calculate overall score based on avg visibility, penalize for missing critical
        overall_score = avg_vis
        if missing_critical:
            overall_score *= 0.5
            
        # Valid if score is above a basic threshold (e.g. 0.4) AND no critical missing
        is_valid = bool(overall_score >= 0.4 and not missing_critical)
        
        return QualityReport(
            overall_score=round(overall_score, 3),
            is_valid=is_valid,
            avg_visibility=round(avg_vis, 3),
            low_visibility_landmarks=low_vis_lms,
            missing_critical_landmarks=missing_critical,
            issues=issues,
        )
