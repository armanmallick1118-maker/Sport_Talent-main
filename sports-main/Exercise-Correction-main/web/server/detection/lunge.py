"""
web/server/detection/lunge.py
=============================
Lunge exercise detector:
  - MediaPipe Pose 13-landmark feature extraction (52 values)
  - ML-based stage classifier (I = Initial, M = Middle, D = Down) + StandardScaler
  - ML-based knee-over-toe error classifier (C = Correct, L = Incorrect)
  - Geometric analysis: front & rear knee angles (configurable 60°–125° thresholds)
  - Lead-leg detection (Left vs. Right front leg)
  - Debounced repetition counter
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
    extract_important_keypoints,
    resolve_model_path,
)
from .scoring import evaluate_lunge_form

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils


class LungeDetection:
    DEFAULT_STAGE_MODEL_PATH = "core/lunge_model/model/sklearn/stage_LR_model.pkl"
    DEFAULT_ERR_MODEL_PATH = "core/lunge_model/model/sklearn/err_LR_model.pkl"
    DEFAULT_SCALER_PATH = "core/lunge_model/model/input_scaler.pkl"

    PREDICTION_PROB_THRESHOLD = 0.75
    LUNGE_KNEE_ANGLE_MIN = 60
    LUNGE_KNEE_ANGLE_MAX = 125
    CONFIRMATION_FRAMES = 3

    def __init__(
        self,
        stage_model_path: str = None,
        err_model_path: str = None,
        scaler_path: str = None,
    ) -> None:
        self.init_important_landmarks()
        self.stage_model_path = resolve_model_path(stage_model_path or self.DEFAULT_STAGE_MODEL_PATH)
        self.err_model_path = resolve_model_path(err_model_path or self.DEFAULT_ERR_MODEL_PATH)
        self.scaler_path = resolve_model_path(scaler_path or self.DEFAULT_SCALER_PATH)

        self.load_machine_learning_models()
        self.side_mode = "left"
        self.reset()

    def init_important_landmarks(self) -> None:
        self.important_landmarks = [
            "NOSE",
            "LEFT_SHOULDER", "RIGHT_SHOULDER",
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

    def load_machine_learning_models(self) -> None:
        if not os.path.exists(self.stage_model_path):
            raise FileNotFoundError(f"Lunge stage model not found at {self.stage_model_path}")
        if not os.path.exists(self.err_model_path):
            raise FileNotFoundError(f"Lunge error model not found at {self.err_model_path}")
        if not os.path.exists(self.scaler_path):
            raise FileNotFoundError(f"Lunge input scaler not found at {self.scaler_path}")

        with open(self.stage_model_path, "rb") as f:
            self.stage_model = pickle.load(f)
        with open(self.err_model_path, "rb") as f:
            self.err_model = pickle.load(f)
        with open(self.scaler_path, "rb") as f:
            self.input_scaler = pickle.load(f)

    def reset(self) -> None:
        self.current_stage = "init"
        self.counter = 0
        self.counter_left = 0
        self.counter_right = 0
        self.stage_left = "init"
        self.stage_right = "init"
        self.down_frames_left = 0
        self.down_frames_right = 0
        self.down_frames = 0
        self.has_error = False
        self.lead_leg = "left" if self.side_mode == "left" else "right"
        self.latest_result = {}

    def detect_lead_leg(self, landmarks) -> str:
        """Determines which leg is leading forward based on foot/ankle placement."""
        l_ankle_y = landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y
        r_ankle_y = landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].y
        l_foot_x = landmarks[mp_pose.PoseLandmark.LEFT_FOOT_INDEX.value].x
        r_foot_x = landmarks[mp_pose.PoseLandmark.RIGHT_FOOT_INDEX.value].x
        nose_x = landmarks[mp_pose.PoseLandmark.NOSE.value].x

        # If facing right, front leg has higher x; if facing left, lower x
        l_dist = abs(l_foot_x - nose_x)
        r_dist = abs(r_foot_x - nose_x)
        return "left" if l_dist > r_dist else "right"

    def detect(self, mp_results, image=None, timestamp: float = None, side_mode: str = None) -> dict:
        """Process a frame and return structured detection information."""
        if side_mode:
            self.side_mode = side_mode.lower().strip()

        if not mp_results or not mp_results.pose_landmarks:
            return {
                "exercise": "lunge",
                "stage": self.current_stage,
                "reps": self.counter,
                "reps_breakdown": {"left": 0, "right": 0, "total": 0},
                "side": self.lead_leg,
                "side_mode": self.side_mode,
                "score": 0.0,
                "errors": [{"type": "no_person", "message": "No body detected in frame"}],
                "angles": {},
                "feedback": ["Position yourself in full view of the camera"],
            }

        landmarks = mp_results.pose_landmarks.landmark

        # 1. Extract 52 features and scale
        row = extract_important_keypoints(mp_results, self.important_landmarks)
        X = pd.DataFrame([row], columns=self.headers[1:])
        X_scaled = self.input_scaler.transform(X)

        # 2. Stage Classification
        stage_pred = str(self.stage_model.predict(X_scaled)[0])
        stage_probs = self.stage_model.predict_proba(X_scaled)[0]
        stage_prob = round(float(np.max(stage_probs)), 2)

        # Map 'I', 'M', 'D' to human readable
        stage_map = {"I": "init", "M": "mid", "D": "down"}
        human_stage = stage_map.get(stage_pred, "init")

        # 3. Knee Angles
        r_hip = [landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].y]
        r_knee = [landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].y]
        r_ankle = [landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].y]
        right_knee_angle = round(calculate_angle(r_hip, r_knee, r_ankle), 1)

        l_hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x, landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
        l_knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x, landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
        l_ankle = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x, landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]
        left_knee_angle = round(calculate_angle(l_hip, l_knee, l_ankle), 1)

        # Detect front and rear angle based on side_mode
        if self.side_mode == "left":
            self.lead_leg = "left"
            front_angle = left_knee_angle
            rear_angle = right_knee_angle
        elif self.side_mode == "right":
            self.lead_leg = "right"
            front_angle = right_knee_angle
            rear_angle = left_knee_angle
        else:
            if abs(left_knee_angle - right_knee_angle) > 15:
                self.lead_leg = "left" if left_knee_angle < right_knee_angle else "right"
            else:
                self.lead_leg = self.detect_lead_leg(landmarks)
            front_angle = left_knee_angle if self.lead_leg == "left" else right_knee_angle
            rear_angle = right_knee_angle if self.lead_leg == "left" else left_knee_angle

        # 4. Error Model (Knee Over Toe)
        knee_over_toe = False
        if human_stage == "down" or front_angle <= 110.0:
            err_pred = str(self.err_model.predict(X_scaled)[0])
            err_probs = self.err_model.predict_proba(X_scaled)[0]
            err_prob = round(float(np.max(err_probs)), 2)
            if err_pred == "L" and err_prob >= 0.65:
                knee_over_toe = True

        # Check angle thresholds
        knee_angle_err = not (self.LUNGE_KNEE_ANGLE_MIN <= front_angle <= self.LUNGE_KNEE_ANGLE_MAX)

        # 5. Hybrid Repetition Counter (Per-Leg Tracking)
        # Left leg tracking
        is_down_l = left_knee_angle <= 105.0
        is_up_l = left_knee_angle >= 145.0
        if is_down_l:
            self.stage_left = "down"
            self.down_frames_left += 1
        elif self.stage_left == "down" and is_up_l:
            if self.down_frames_left >= 2:
                self.counter_left += 1
            self.stage_left = "init"
            self.down_frames_left = 0

        # Right leg tracking
        is_down_r = right_knee_angle <= 105.0
        is_up_r = right_knee_angle >= 145.0
        if is_down_r:
            self.stage_right = "down"
            self.down_frames_right += 1
        elif self.stage_right == "down" and is_up_r:
            if self.down_frames_right >= 2:
                self.counter_right += 1
            self.stage_right = "init"
            self.down_frames_right = 0

        # Assign counter and stage according to selected side
        if self.side_mode == "left":
            self.counter = self.counter_left
            self.current_stage = self.stage_left
        elif self.side_mode == "right":
            self.counter = self.counter_right
            self.current_stage = self.stage_right
        else:
            self.counter = self.counter_left + self.counter_right
            self.current_stage = self.stage_left if self.lead_leg == "left" else self.stage_right

        # 6. Form Scoring
        form_eval = evaluate_lunge_form(
            front_knee_angle=front_angle,
            rear_knee_angle=rear_angle,
            knee_over_toe=knee_over_toe,
            stage=self.current_stage,
            knee_angle_error=knee_angle_err,
        )

        self.has_error = len(form_eval["errors"]) > 0

        # Optional Drawing
        if image is not None:
            self._visualize(image, front_angle, rear_angle, knee_over_toe, form_eval)

        result = {
            "exercise": "lunge",
            "stage": self.current_stage,
            "reps": self.counter,
            "reps_breakdown": {
                "left": self.counter_left,
                "right": self.counter_right,
                "total": self.counter_left + self.counter_right,
            },
            "side": self.lead_leg,
            "side_mode": self.side_mode,
            "score": form_eval["score"],
            "errors": form_eval["errors"],
            "angles": {
                "front_knee": front_angle,
                "rear_knee": rear_angle,
                "left_knee": left_knee_angle,
                "right_knee": right_knee_angle,
                "knee": front_angle,
            },
            "feedback": form_eval["feedback"],
        }
        self.latest_result = result
        return result

    def _visualize(self, image, front_angle, rear_angle, kot, form_eval):
        h, w = image.shape[:2]
        cv2.rectangle(image, (10, 10), (370, 90), (20, 20, 20), -1)
        mode_str = f" ({self.side_mode.upper()})"
        cv2.putText(image, f"LUNGE REPS{mode_str}: {self.counter} (L:{self.counter_left} R:{self.counter_right})", (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.70, (0, 255, 0), 2)
        cv2.putText(image, f"STAGE: {self.current_stage.upper()} | SCORE: {form_eval['score']}", (20, 70),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1)

        if kot:
            cv2.putText(image, "KNEE OVER TOE!", (20, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

        if form_eval["feedback"]:
            fb = form_eval["feedback"][0]
            color = (0, 0, 255) if form_eval["errors"] else (0, 255, 200)
            cv2.putText(image, fb, (20, h - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

