"""
web/server/detection/main.py
============================
Central Exercise AI Processing Engine for AI Sports & Talent Tracker.
Completely independent of Django, Vue, and web frameworks.

Provides a clean Python API:
    detector = ExerciseDetector("squat")
    result = detector.process_frame(frame)
    summary = detector.process_video("path/to/video.mp4")
"""

import os
import cv2
import numpy as np
import mediapipe as mp
from typing import Dict, Any, Optional

from .squat import SquatDetection
from .lunge import LungeDetection
from .plank import PlankDetection
from .bicep_curl import BicepCurlDetection
from .utils import rescale_frame

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils


class ExerciseDetector:
    """
    Unified exercise detection engine for Squat, Lunge, Plank, and Bicep Curl.
    Initializes MediaPipe Pose and the target exercise classifier once for efficient inference.
    """

    SUPPORTED_EXERCISES = {
        "squat": SquatDetection,
        "lunge": LungeDetection,
        "plank": PlankDetection,
        "bicep_curl": BicepCurlDetection,
        "bicep": BicepCurlDetection,
    }

    def __init__(
        self,
        exercise_type: str,
        min_detection_confidence: float = 0.6,
        min_tracking_confidence: float = 0.6,
    ):
        norm_type = exercise_type.lower().strip().replace("-", "_").replace(" ", "_")
        if norm_type not in self.SUPPORTED_EXERCISES:
            raise ValueError(
                f"Unsupported exercise '{exercise_type}'. "
                f"Choose from: {list(self.SUPPORTED_EXERCISES.keys())}"
            )

        self.exercise_type = norm_type
        detector_cls = self.SUPPORTED_EXERCISES[norm_type]
        self.engine = detector_cls()

        # Initialize MediaPipe Pose once
        self.pose = mp_pose.Pose(
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
            model_complexity=1,
        )

    def process_frame(
        self,
        frame: np.ndarray,
        timestamp: Optional[float] = None,
        draw: bool = True,
        side_mode: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Process a single BGR OpenCV frame.
        Returns structured dictionary of exercise metrics, reps, angles, and feedback.
        """
        if frame is None or frame.size == 0:
            return {
                "exercise": self.exercise_type,
                "error": "Empty frame provided",
                "score": 0.0,
            }

        # Apply side_mode if supported
        if side_mode and hasattr(self.engine, "side_mode"):
            self.engine.side_mode = side_mode.lower().strip()

        # Convert to RGB for MediaPipe
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        rgb.flags.writeable = False
        mp_results = self.pose.process(rgb)
        rgb.flags.writeable = True

        # Draw skeleton on image if requested
        if draw and mp_results.pose_landmarks:
            mp_drawing.draw_landmarks(
                frame,
                mp_results.pose_landmarks,
                mp_pose.POSE_CONNECTIONS,
                mp_drawing.DrawingSpec(color=(244, 117, 66), thickness=2, circle_radius=2),
                mp_drawing.DrawingSpec(color=(245, 66, 230), thickness=2, circle_radius=1),
            )

        # Run exercise-specific detection
        result = self.engine.detect(
            mp_results=mp_results,
            image=frame if draw else None,
            timestamp=timestamp,
            side_mode=side_mode,
        )

        # Attach normalized landmarks for client-side rendering
        landmarks_list = []
        if mp_results and mp_results.pose_landmarks:
            for idx, lm in enumerate(mp_results.pose_landmarks.landmark):
                landmarks_list.append({
                    "id": idx,
                    "x": float(round(lm.x, 4)),
                    "y": float(round(lm.y, 4)),
                    "z": float(round(lm.z, 4)),
                    "visibility": float(round(lm.visibility, 3)),
                })
        result["landmarks"] = landmarks_list
        result["connections"] = [
            [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
            [11, 23], [12, 24], [23, 24], [23, 25], [24, 26],
            [25, 27], [26, 28], [27, 29], [28, 30], [29, 31],
            [30, 32], [27, 31], [28, 32]
        ]

        # Standardize primary angle & reps for consistent UI display
        primary_angle = 180.0
        angles = result.get("angles", {})
        active_side = getattr(self.engine, "side_mode", "both")

        if self.exercise_type == "squat":
            primary_angle = angles.get("avg_knee") or angles.get("left_knee") or angles.get("right_knee") or 180.0
        elif self.exercise_type == "lunge":
            if active_side == "right":
                primary_angle = angles.get("right_knee") or angles.get("front_knee") or 180.0
            else:
                primary_angle = angles.get("left_knee") or angles.get("front_knee") or 180.0
        elif self.exercise_type == "plank":
            primary_angle = angles.get("body_alignment") or 180.0
            # Calculate hold seconds (webcam runs ~13-15 FPS, video uses timestamp if available)
            if timestamp is not None and result.get("hold_frames", 0) > 0:
                hold_sec = round(timestamp, 1)
            else:
                hold_sec = round(result.get("hold_frames", 0) / 15.0, 1)
            result["reps"] = int(hold_sec)
            result["hold_seconds"] = hold_sec
        elif "bicep" in self.exercise_type:
            l_curl = angles.get("left_curl")
            r_curl = angles.get("right_curl")
            if active_side == "left":
                primary_angle = l_curl or 180.0
            elif active_side == "right":
                primary_angle = r_curl or 180.0
            else:
                if l_curl is not None and r_curl is not None:
                    primary_angle = min(l_curl, r_curl)
                elif l_curl is not None:
                    primary_angle = l_curl
                elif r_curl is not None:
                    primary_angle = r_curl

            if isinstance(result.get("reps"), dict):
                result["reps_breakdown"] = result["reps"]
                result["reps"] = result["reps"].get("total", 0)

        result["primary_angle"] = float(round(primary_angle, 1))

        return result

    def process_video(
        self,
        video_path: str,
        output_video_path: Optional[str] = None,
        rescale_percent: float = 100.0,
    ) -> Dict[str, Any]:
        """
        Process an entire video file, calculating cumulative metrics, repetitions,
        average form score, error frequency, and coaching feedback.
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise IOError(f"Could not open video file: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) * rescale_percent / 100.0)
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) * rescale_percent / 100.0)

        out_writer = None
        if output_video_path:
            os.makedirs(os.path.dirname(os.path.abspath(output_video_path)), exist_ok=True)
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            out_writer = cv2.VideoWriter(output_video_path, fourcc, int(fps), (width, height))

        self.reset()
        frame_count = 0
        all_scores = []
        all_errors = {}
        all_feedback = set()

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1
            timestamp = round(frame_count / fps, 2)

            if rescale_percent != 100.0:
                frame = rescale_frame(frame, rescale_percent)

            frame_res = self.process_frame(frame, timestamp=timestamp, draw=bool(out_writer))

            score = frame_res.get("score")
            if score is not None and score > 0:
                all_scores.append(score)

            for err in frame_res.get("errors", []):
                msg = err.get("message")
                if msg:
                    all_errors[msg] = all_errors.get(msg, 0) + 1

            for fb in frame_res.get("feedback", []):
                all_feedback.add(fb)

            if out_writer:
                out_writer.write(frame)

        cap.release()
        if out_writer:
            out_writer.release()

        # Compute summary
        avg_score = round(float(np.mean(all_scores)), 1) if all_scores else 0.0
        final_reps = getattr(self.engine, "counter", 0)
        if self.exercise_type == "bicep_curl":
            final_reps = {
                "left": self.engine.left_arm.counter,
                "right": self.engine.right_arm.counter,
                "total": self.engine.left_arm.counter + self.engine.right_arm.counter,
            }

        sorted_errors = sorted(all_errors.items(), key=lambda x: x[1], reverse=True)
        top_errors = [{"message": msg, "count": count} for msg, count in sorted_errors[:5]]

        summary = {
            "status": "success",
            "exercise": self.exercise_type,
            "total_frames_analyzed": frame_count,
            "fps": fps,
            "reps": final_reps,
            "average_form_score": avg_score,
            "common_errors": top_errors,
            "feedback": list(all_feedback)[:5],
            "video_path": video_path,
        }
        if output_video_path:
            summary["output_video_path"] = output_video_path

        return summary

    def reset(self):
        """Reset the internal exercise state."""
        self.engine.reset()

    def close(self):
        """Release MediaPipe resources."""
        if hasattr(self, "pose") and self.pose:
            self.pose.close()


def exercise_detection(
    video_file_path: str,
    exercise_type: str,
    output_video_path: Optional[str] = None,
) -> Dict[str, Any]:
    """Convenience function for direct invocation."""
    detector = ExerciseDetector(exercise_type)
    try:
        return detector.process_video(video_file_path, output_video_path)
    finally:
        detector.close()
