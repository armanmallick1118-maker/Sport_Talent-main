"""
ATHENA-MOTION: High-Performance Kinematic Visualizer & HUD Renderer.
Renders anatomical skeleton graphs, dynamic joint angle arcs, and an athletic HUD
directly onto OpenCV video frames.
"""

from typing import Optional, Dict, Any, Tuple
import cv2
import numpy as np

from athena_motion.dataset.schema import (
    PoseLandmarkIndex,
    SKELETON_CONNECTIONS,
    RepPhase,
    ExerciseType,
    FormQuality
)
from athena_motion.biomechanics.metrics import BiomechanicalMetrics

# Athena Palette (Clean Scientific Contrast)
COLOR_BONE = (235, 140, 40)        # Deep Slate / Cobalt Blue in BGR
COLOR_JOINT = (50, 205, 50)       # Precision Lime / Emerald in BGR
COLOR_WARNING = (30, 140, 255)     # Amber Alert
COLOR_ALERT = (50, 50, 220)        # Coral Red
COLOR_TEXT = (255, 255, 255)       # Pure White
COLOR_HUD_BG = (15, 23, 42)        # Dark Slate Navy
COLOR_HUD_BORDER = (50, 70, 95)    # Slate Border

class KinematicVisualizer:
    """
    Renders 33-landmark skeleton, joint angle badges, and real-time biomechanical HUD.
    """
    def __init__(
        self,
        draw_skeleton: bool = True,
        draw_angle_badges: bool = True,
        draw_hud: bool = True,
        min_visibility: float = 0.4
    ):
        self.draw_skeleton = draw_skeleton
        self.draw_angle_badges = draw_angle_badges
        self.draw_hud = draw_hud
        self.min_visibility = min_visibility

    def render(
        self,
        frame: np.ndarray,
        landmarks: Optional[np.ndarray],
        metrics: Optional[BiomechanicalMetrics] = None,
        exercise_name: str = "Squat",
        rep_count: int = 0,
        rep_phase: RepPhase = RepPhase.IDLE,
        form_quality: str = "Good Form",
        feedback_cue: Optional[str] = None,
        consistency_score: float = 100.0
    ) -> np.ndarray:
        """
        Renders complete visual feedback directly onto a copy of the input frame.
        """
        if frame is None:
            return frame

        canvas = frame.copy()
        h, w, _ = canvas.shape

        # 1. Render Skeleton and Joint Angle Badges
        if landmarks is not None and len(landmarks) >= 33:
            # Convert normalized coords (0.0 to 1.0) to pixel coordinates
            pixel_pts = {}
            for i in range(33):
                pt = landmarks[i]
                vis = pt[3] if len(pt) > 3 else 1.0
                if vis >= self.min_visibility:
                    px = int(np.clip(pt[0] * w, 0, w - 1))
                    py = int(np.clip(pt[1] * h, 0, h - 1))
                    pixel_pts[i] = (px, py)

            if self.draw_skeleton:
                # Draw bones
                for p1_idx, p2_idx in SKELETON_CONNECTIONS:
                    if p1_idx in pixel_pts and p2_idx in pixel_pts:
                        cv2.line(canvas, pixel_pts[p1_idx], pixel_pts[p2_idx], COLOR_BONE, 2, cv2.LINE_AA)

                # Draw joint circles
                for idx, pt in pixel_pts.items():
                    cv2.circle(canvas, pt, 4, COLOR_JOINT, -1, cv2.LINE_AA)
                    cv2.circle(canvas, pt, 5, (0, 0, 0), 1, cv2.LINE_AA)

            # Draw Joint Angle Badges
            if self.draw_angle_badges and metrics is not None:
                self._draw_angle_callouts(canvas, pixel_pts, metrics)

        # 2. Render Biomechanical HUD
        if self.draw_hud:
            self._draw_hud_panel(
                canvas,
                exercise_name=exercise_name,
                rep_count=rep_count,
                rep_phase=rep_phase,
                form_quality=form_quality,
                feedback_cue=feedback_cue,
                consistency_score=consistency_score,
                metrics=metrics
            )

        return canvas

    def _draw_angle_callouts(
        self,
        canvas: np.ndarray,
        pixel_pts: Dict[int, Tuple[int, int]],
        metrics: BiomechanicalMetrics
    ) -> None:
        """Draws clean angle labels next to key joints."""
        idx = PoseLandmarkIndex

        # Left Knee
        if idx.LEFT_KNEE in pixel_pts:
            px, py = pixel_pts[idx.LEFT_KNEE]
            self._draw_badge(canvas, f"{int(metrics.angle_left_knee)}°", (px + 10, py - 5), COLOR_JOINT)

        # Right Knee
        if idx.RIGHT_KNEE in pixel_pts:
            px, py = pixel_pts[idx.RIGHT_KNEE]
            self._draw_badge(canvas, f"{int(metrics.angle_right_knee)}°", (px - 50, py - 5), COLOR_JOINT)

        # Left Hip
        if idx.LEFT_HIP in pixel_pts:
            px, py = pixel_pts[idx.LEFT_HIP]
            self._draw_badge(canvas, f"{int(metrics.angle_left_hip)}°", (px + 10, py), (200, 180, 50))

        # Trunk Inclination
        if idx.LEFT_SHOULDER in pixel_pts and idx.RIGHT_SHOULDER in pixel_pts:
            sx = (pixel_pts[idx.LEFT_SHOULDER][0] + pixel_pts[idx.RIGHT_SHOULDER][0]) // 2
            sy = (pixel_pts[idx.LEFT_SHOULDER][1] + pixel_pts[idx.RIGHT_SHOULDER][1]) // 2
            self._draw_badge(canvas, f"Trunk: {int(metrics.trunk_inclination_angle)}°", (sx - 35, sy - 20), (220, 120, 30))

    def _draw_badge(
        self,
        canvas: np.ndarray,
        text: str,
        pos: Tuple[int, int],
        border_color: Tuple[int, int, int]
    ) -> None:
        """Draws a compact rounded pill label with high readability."""
        font = cv2.FONT_HERSHEY_SIMPLEX
        scale = 0.42
        thickness = 1
        (tw, th), baseline = cv2.getTextSize(text, font, scale, thickness)
        x, y = pos
        pad = 4

        # Background rectangle
        cv2.rectangle(canvas, (x - pad, y - th - pad), (x + tw + pad, y + baseline + pad), (15, 23, 42), -1)
        cv2.rectangle(canvas, (x - pad, y - th - pad), (x + tw + pad, y + baseline + pad), border_color, 1)
        cv2.putText(canvas, text, (x, y), font, scale, (255, 255, 255), thickness, cv2.LINE_AA)

    def _draw_hud_panel(
        self,
        canvas: np.ndarray,
        exercise_name: str,
        rep_count: int,
        rep_phase: RepPhase,
        form_quality: str,
        feedback_cue: Optional[str],
        consistency_score: float,
        metrics: Optional[BiomechanicalMetrics]
    ) -> None:
        """Draws modern athletic HUD bar across top and bottom."""
        h, w, _ = canvas.shape

        # Top Header Bar (Height 70px)
        top_bar_h = 70
        overlay = canvas.copy()
        cv2.rectangle(overlay, (0, 0), (w, top_bar_h), COLOR_HUD_BG, -1)
        cv2.addWeighted(overlay, 0.85, canvas, 0.15, 0, canvas)
        cv2.line(canvas, (0, top_bar_h), (w, top_bar_h), COLOR_HUD_BORDER, 1)

        # Brand / Title
        cv2.putText(canvas, "ATHENA-MOTION", (15, 25), cv2.FONT_HERSHEY_DUPLEX, 0.65, (50, 205, 50), 1, cv2.LINE_AA)
        cv2.putText(canvas, f"EXERCISE: {exercise_name.upper()}", (15, 52), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 210, 225), 1, cv2.LINE_AA)

        # Rep Counter Pill (Centered)
        rep_text = f"REPS: {rep_count}"
        cv2.putText(canvas, rep_text, (w // 2 - 60, 32), cv2.FONT_HERSHEY_DUPLEX, 0.8, (255, 255, 255), 2, cv2.LINE_AA)

        phase_color = (180, 180, 180)
        if rep_phase == RepPhase.ECCENTRIC:
            phase_color = (255, 180, 40)
        elif rep_phase == RepPhase.INFLECTION:
            phase_color = (40, 220, 255)
        elif rep_phase == RepPhase.CONCENTRIC:
            phase_color = (50, 220, 50)

        phase_str = f"PHASE: {rep_phase.value.upper()}"
        cv2.putText(canvas, phase_str, (w // 2 - 50, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.45, phase_color, 1, cv2.LINE_AA)

        # Metrics on right of top bar
        cv2.putText(canvas, f"CONSISTENCY: {int(consistency_score)}%", (w - 180, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (255, 255, 255), 1, cv2.LINE_AA)
        if metrics:
            depth_str = f"DEPTH RATIO: {metrics.squat_depth_ratio:+.2f}"
            cv2.putText(canvas, depth_str, (w - 180, 52), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (180, 200, 220), 1, cv2.LINE_AA)

        # Bottom Feedback Banner (if alert or cue present)
        is_good = "good" in form_quality.lower()
        banner_bg = (20, 80, 30) if is_good else (25, 30, 120)
        banner_border = (50, 180, 60) if is_good else (50, 70, 230)

        bottom_bar_h = 42
        y1 = h - bottom_bar_h
        cv2.rectangle(canvas, (0, y1), (w, h), banner_bg, -1)
        cv2.line(canvas, (0, y1), (w, y1), banner_border, 1)

        msg = feedback_cue if feedback_cue else f"FORM STATUS: {form_quality.replace('_', ' ').upper()}"
        cv2.putText(canvas, msg, (20, y1 + 27), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1, cv2.LINE_AA)
