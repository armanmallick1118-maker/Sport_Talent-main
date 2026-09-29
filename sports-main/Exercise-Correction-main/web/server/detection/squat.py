"""
web/server/detection/squat.py
=============================
Squat exercise detector:
  - MediaPipe Pose 9-landmark feature extraction (36 values)
  - ML-based stage classification (UP vs. DOWN)
  - Geometric form analysis (knee angles, foot width / shoulder ratio, knee width / foot ratio)
  - Temporal state machine with debouncing for repetition counting
  - Explainable biomechanical form scoring
"""

import os
import pickle
import cv2
import numpy as np
import pandas as pd
import mediapipe as mp

from .utils import (
    calculate_angle,
    calculate_distance,
    extract_important_keypoints,
    get_drawing_color,
    resolve_model_path,
)
from .scoring import evaluate_squat_form

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils


class SquatDetection:
    DEFAULT_MODEL_REL_PATH = "core/squat_model/model/squat_model.pkl"

    PREDICTION_PROB_THRESHOLD = 0.70
    VISIBILITY_THRESHOLD = 0.60
    FOOT_SHOULDER_RATIO_THRESHOLDS = [1.2, 2.8]
    KNEE_FOOT_RATIO_THRESHOLDS = {
        "up": [0.5, 1.0],
        "middle": [0.7, 1.0],
        "down": [0.7, 1.1],
    }

    # Minimum consecutive frames in DOWN stage before counting completion
    CONFIRMATION_FRAMES = 3

    def __init__(self, model_path: str = None) -> None:
        self.init_important_landmarks()
        self.model_path = resolve_model_path(model_path or self.DEFAULT_MODEL_REL_PATH)
        self.load_machine_learning_model()
        self.reset()

    def init_important_landmarks(self) -> None:
        self.important_landmarks = [
            "NOSE",
            "LEFT_SHOULDER", "RIGHT_SHOULDER",
            "LEFT_HIP", "RIGHT_HIP",
            "LEFT_KNEE", "RIGHT_KNEE",
            "LEFT_ANKLE", "RIGHT_ANKLE",
        ]
        self.headers = ["label"]
        for lm in self.important_landmarks:
            self.headers.extend([
                f"{lm.lower()}_x",
                f"{lm.lower()}_y",
                f"{lm.lower()}_z",
                f"{lm.lower()}_v",
            ])

    def load_machine_learning_model(self) -> None:
        if not os.path.exists(self.model_path):
            # Attempt to find alternative location
            alt_path = resolve_model_path("core/squat_model/model/LR_model.pkl")
            if os.path.exists(alt_path):
                self.model_path = alt_path
            else:
                raise FileNotFoundError(f"Squat model not found at {self.model_path}")

        with open(self.model_path, "rb") as f:
            self.model = pickle.load(f)

    def reset(self) -> None:
        self.current_stage = "up"
        self.counter = 0
        self.down_frame_count = 0
        self.has_error = False
        self.latest_result = {}
        self.rep_scores = []

    def analyze_foot_knee_placement(self, landmarks, stage: str) -> dict:
        analyzed_results = {"foot_placement": "unknown", "knee_placement": "unknown", "ratios": {}}

        l_foot_vis = landmarks[mp_pose.PoseLandmark.LEFT_FOOT_INDEX.value].visibility
        r_foot_vis = landmarks[mp_pose.PoseLandmark.RIGHT_FOOT_INDEX.value].visibility
        l_knee_vis = landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].visibility
        r_knee_vis = landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].visibility

        if min(l_foot_vis, r_foot_vis, l_knee_vis, r_knee_vis) < self.VISIBILITY_THRESHOLD:
            return analyzed_results

        l_shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x,
                      landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
        r_shoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x,
                      landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
        shoulder_width = max(calculate_distance(l_shoulder, r_shoulder), 1e-5)

        l_foot = [landmarks[mp_pose.PoseLandmark.LEFT_FOOT_INDEX.value].x,
                  landmarks[mp_pose.PoseLandmark.LEFT_FOOT_INDEX.value].y]
        r_foot = [landmarks[mp_pose.PoseLandmark.RIGHT_FOOT_INDEX.value].x,
                  landmarks[mp_pose.PoseLandmark.RIGHT_FOOT_INDEX.value].y]
        foot_width = max(calculate_distance(l_foot, r_foot), 1e-5)

        foot_shoulder_ratio = round(foot_width / shoulder_width, 2)
        analyzed_results["ratios"]["foot_shoulder"] = foot_shoulder_ratio

        min_fs, max_fs = self.FOOT_SHOULDER_RATIO_THRESHOLDS
        if min_fs <= foot_shoulder_ratio <= max_fs:
            analyzed_results["foot_placement"] = "correct"
        elif foot_shoulder_ratio < min_fs:
            analyzed_results["foot_placement"] = "too tight"
        else:
            analyzed_results["foot_placement"] = "too wide"

        l_knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x,
                  landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
        r_knee = [landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].x,
                  landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].y]
        knee_width = calculate_distance(l_knee, r_knee)

        knee_foot_ratio = round(knee_width / foot_width, 2)
        analyzed_results["ratios"]["knee_foot"] = knee_foot_ratio

        ratio_limits = self.KNEE_FOOT_RATIO_THRESHOLDS.get(stage, [0.6, 1.1])
        if ratio_limits[0] <= knee_foot_ratio <= ratio_limits[1]:
            analyzed_results["knee_placement"] = "correct"
        elif knee_foot_ratio < ratio_limits[0]:
            analyzed_results["knee_placement"] = "too tight"
        else:
            analyzed_results["knee_placement"] = "too wide"

        return analyzed_results

    def detect(self, mp_results, image=None, timestamp: float = None) -> dict:
        """Process a frame and return structured detection information."""
        if not mp_results or not mp_results.pose_landmarks:
            return {
                "exercise": "squat",
                "stage": self.current_stage,
                "reps": self.counter,
                "score": 0.0,
                "errors": [{"type": "no_person", "message": "No body detected in frame"}],
                "angles": {},
                "feedback": ["Position yourself in full view of the camera"],
            }

        landmarks = mp_results.pose_landmarks.landmark

        # 1. Extract 36 features for ML Stage classification
        row = extract_important_keypoints(mp_results, self.important_landmarks)
        X = pd.DataFrame([row], columns=self.headers[1:])

        # Model prediction
        predicted_class = str(self.model.predict(X)[0])
        pred_probs = self.model.predict_proba(X)[0]
        max_prob = round(float(np.max(pred_probs)), 2)

        # 2. Geometric Knee Angles (with visibility weighting)
        l_vis = min(
            landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].visibility,
            landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].visibility,
            landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].visibility,
        )
        r_vis = min(
            landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].visibility,
            landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].visibility,
            landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].visibility,
        )

        l_hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x, landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
        l_knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x, landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
        l_ankle = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x, landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]
        left_knee_angle = round(calculate_angle(l_hip, l_knee, l_ankle), 1)

        r_hip = [landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].y]
        r_knee = [landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].y]
        r_ankle = [landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].y]
        right_knee_angle = round(calculate_angle(r_hip, r_knee, r_ankle), 1)

        if l_vis >= 0.4 and r_vis >= 0.4:
            avg_knee_angle = round((left_knee_angle + right_knee_angle) / 2.0, 1)
        elif l_vis >= 0.4:
            avg_knee_angle = left_knee_angle
        elif r_vis >= 0.4:
            avg_knee_angle = right_knee_angle
        else:
            avg_knee_angle = round((left_knee_angle + right_knee_angle) / 2.0, 1)

        # 3. Hybrid State Machine & Repetition Counting (Kinematics + ML)
        is_down = (predicted_class == "down" and max_prob >= 0.65) or (avg_knee_angle <= 115.0)
        is_up = (predicted_class == "up" and max_prob >= 0.65) or (avg_knee_angle >= 145.0)

        if is_down:
            self.current_stage = "down"
            self.down_frame_count += 1
        elif self.current_stage == "down" and is_up:
            if self.down_frame_count >= 2:
                self.counter += 1
            self.current_stage = "up"
            self.down_frame_count = 0

        # 4. Biomechanical Ratio Analysis
        placement = self.analyze_foot_knee_placement(landmarks, self.current_stage)

        # 5. Form Scoring
        form_eval = evaluate_squat_form(
            knee_angle=avg_knee_angle,
            foot_shoulder_ratio=placement["ratios"].get("foot_shoulder", 1.8),
            knee_foot_ratio=placement["ratios"].get("knee_foot", 0.9),
            stage=self.current_stage,
            foot_placement_status=placement["foot_placement"],
            knee_placement_status=placement["knee_placement"],
        )

        self.has_error = len(form_eval["errors"]) > 0

        # Optional Drawing
        if image is not None:
            self._visualize(image, left_knee_angle, right_knee_angle, form_eval)

        result = {
            "exercise": "squat",
            "stage": self.current_stage,
            "reps": self.counter,
            "score": form_eval["score"],
            "errors": form_eval["errors"],
            "angles": {
                "left_knee": left_knee_angle,
                "right_knee": right_knee_angle,
                "avg_knee": avg_knee_angle,
            },
            "feedback": form_eval["feedback"],
            "placement": placement,
        }
        self.latest_result = result
        return result

    def _visualize(self, image, l_angle, r_angle, form_eval):
        h, w = image.shape[:2]
        # Overlay rep and stage counter box
        cv2.rectangle(image, (10, 10), (280, 85), (20, 20, 20), -1)
        cv2.putText(image, f"SQUAT REPS: {self.counter}", (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        cv2.putText(image, f"STAGE: {self.current_stage.upper()} | SCORE: {form_eval['score']}", (20, 70),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1)

        # Overlay feedback
        if form_eval["feedback"]:
            fb = form_eval["feedback"][0]
            color = (0, 0, 255) if form_eval["errors"] else (0, 255, 200)
            cv2.putText(image, fb, (20, h - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
