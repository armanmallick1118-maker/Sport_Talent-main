"""
web/server/detection/plank.py
============================
Plank exercise detector:
  - MediaPipe Pose 17-landmark feature extraction (68 values)
  - ML-based posture classification (C = Correct, L = Low back, H = High back) + StandardScaler
  - Geometric spinal / body line alignment angle calculation
  - Temporal smoothing to prevent frame-by-frame flicker
  - Cumulative hold timer and biomechanical form scoring
"""

import os
import pickle
import cv2
import numpy as np
import pandas as pd
import mediapipe as mp

from .utils import (
    calculate_angle,
    extract_important_keypoints,
    resolve_model_path,
)
from .scoring import evaluate_plank_form

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils


class PlankDetection:
    DEFAULT_MODEL_PATH = "core/plank_model/model/LR_model.pkl"
    DEFAULT_SCALER_PATH = "core/plank_model/model/input_scaler.pkl"

    PREDICTION_PROB_THRESHOLD = 0.60
    SMOOTHING_WINDOW_SIZE = 5

    def __init__(self, model_path: str = None, scaler_path: str = None) -> None:
        self.init_important_landmarks()
        self.model_path = resolve_model_path(model_path or self.DEFAULT_MODEL_PATH)
        self.scaler_path = resolve_model_path(scaler_path or self.DEFAULT_SCALER_PATH)

        self.load_machine_learning_model()
        self.reset()

    def init_important_landmarks(self) -> None:
        self.important_landmarks = [
            "NOSE",
            "LEFT_SHOULDER", "RIGHT_SHOULDER",
            "LEFT_ELBOW", "RIGHT_ELBOW",
            "LEFT_WRIST", "RIGHT_WRIST",
            "LEFT_HIP", "RIGHT_HIP",
            "LEFT_KNEE", "RIGHT_KNEE",
            "LEFT_ANKLE", "RIGHT_ANKLE",
            "LEFT_HEEL", "RIGHT_HEEL",
            "LEFT_FOOT_INDEX", "RIGHT_FOOT_INDEX",
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
            raise FileNotFoundError(f"Plank model not found at {self.model_path}")
        if not os.path.exists(self.scaler_path):
            raise FileNotFoundError(f"Plank input scaler not found at {self.scaler_path}")

        with open(self.model_path, "rb") as f:
            self.model = pickle.load(f)
        with open(self.scaler_path, "rb") as f2:
            self.input_scaler = pickle.load(f2)

    def reset(self) -> None:
        self.current_stage = "unknown"
        self.hold_frames = 0
        self.has_error = False
        self.posture_history = []
        self.scores_history = []
        self.latest_result = {}

    def calculate_body_alignment(self, landmarks) -> float:
        """Calculate shoulder-hip-ankle line angle for the side with better visibility."""
        l_vis = (landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].visibility +
                 landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].visibility +
                 landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].visibility)
        r_vis = (landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].visibility +
                 landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].visibility +
                 landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].visibility)

        side = "left" if l_vis >= r_vis else "right"
        sh_idx = getattr(mp_pose.PoseLandmark, f"{side.upper()}_SHOULDER").value
        hp_idx = getattr(mp_pose.PoseLandmark, f"{side.upper()}_HIP").value
        ak_idx = getattr(mp_pose.PoseLandmark, f"{side.upper()}_ANKLE").value

        shoulder = [landmarks[sh_idx].x, landmarks[sh_idx].y]
        hip = [landmarks[hp_idx].x, landmarks[hp_idx].y]
        ankle = [landmarks[ak_idx].x, landmarks[ak_idx].y]

        return round(calculate_angle(shoulder, hip, ankle), 1)

    def detect(self, mp_results, image=None, timestamp: float = None) -> dict:
        """Process a frame and return structured detection information."""
        if not mp_results or not mp_results.pose_landmarks:
            return {
                "exercise": "plank",
                "stage": "unknown",
                "score": 0.0,
                "errors": [{"type": "no_person", "message": "No body detected in frame"}],
                "angles": {},
                "feedback": ["Position yourself horizontally in view of the camera"],
            }

        landmarks = mp_results.pose_landmarks.landmark

        # 1. Extract 68 features and scale
        row = extract_important_keypoints(mp_results, self.important_landmarks)
        X = pd.DataFrame([row], columns=self.headers[1:])
        X_scaled = self.input_scaler.transform(X)

        # 2. Posture Prediction (ML + Kinematics)
        body_angle = self.calculate_body_alignment(landmarks)

        predicted_class = str(self.model.predict(X_scaled)[0])
        pred_probs = self.model.predict_proba(X_scaled)[0]
        max_prob = round(float(np.max(pred_probs)), 2)

        raw_posture = "unknown"
        if max_prob >= self.PREDICTION_PROB_THRESHOLD:
            if predicted_class in ["C", "0", 0]:
                raw_posture = "correct"
            elif predicted_class in ["L", "2", 2]:
                raw_posture = "low back"
            elif predicted_class in ["H", "1", 1]:
                raw_posture = "high back"

        # Kinematic posture confirmation/fallback if body is horizontal
        if raw_posture == "unknown":
            if 168.0 <= body_angle <= 180.0:
                raw_posture = "correct"
            elif body_angle < 165.0:
                # Determine sag vs pike from hip position
                l_vis = landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].visibility
                r_vis = landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].visibility
                side = "LEFT" if l_vis >= r_vis else "RIGHT"
                sh_y = landmarks[getattr(mp_pose.PoseLandmark, f"{side}_SHOULDER").value].y
                hp_y = landmarks[getattr(mp_pose.PoseLandmark, f"{side}_HIP").value].y
                ak_y = landmarks[getattr(mp_pose.PoseLandmark, f"{side}_ANKLE").value].y
                mid_y = (sh_y + ak_y) / 2.0
                raw_posture = "low back" if hp_y > mid_y else "high back"

        # 3. Temporal Smoothing (majority vote over recent frames)
        self.posture_history.append(raw_posture)
        if len(self.posture_history) > self.SMOOTHING_WINDOW_SIZE:
            self.posture_history.pop(0)

        # Majority vote
        counts = {p: self.posture_history.count(p) for p in set(self.posture_history)}
        smoothed_posture = max(counts, key=counts.get)
        self.current_stage = smoothed_posture

        if self.current_stage in ["correct", "low back", "high back"]:
            self.hold_frames += 1

        # 4. Geometric Spinal Angle
        body_angle = self.calculate_body_alignment(landmarks)

        # 5. Form Scoring
        form_eval = evaluate_plank_form(
            posture_class=self.current_stage,
            body_alignment_angle=body_angle,
        )
        self.scores_history.append(form_eval["score"])
        avg_score = round(float(np.mean(self.scores_history)), 1)
        self.has_error = len(form_eval["errors"]) > 0

        # Optional Drawing
        if image is not None:
            self._visualize(image, body_angle, form_eval, avg_score)

        result = {
            "exercise": "plank",
            "stage": self.current_stage,
            "score": avg_score,
            "current_frame_score": form_eval["score"],
            "errors": form_eval["errors"],
            "angles": {"body_alignment": body_angle},
            "hold_frames": self.hold_frames,
            "feedback": form_eval["feedback"],
        }
        self.latest_result = result
        return result

    def _visualize(self, image, body_angle, form_eval, avg_score):
        h, w = image.shape[:2]
        cv2.rectangle(image, (10, 10), (320, 90), (20, 20, 20), -1)
        cv2.putText(image, f"PLANK: {self.current_stage.upper()}", (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0, 255, 0), 2)
        cv2.putText(image, f"BODY ANGLE: {body_angle} | SCORE: {avg_score}", (20, 70),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1)

        if form_eval["feedback"]:
            fb = form_eval["feedback"][0]
            color = (0, 0, 255) if form_eval["errors"] else (0, 255, 200)
            cv2.putText(image, fb, (20, h - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
