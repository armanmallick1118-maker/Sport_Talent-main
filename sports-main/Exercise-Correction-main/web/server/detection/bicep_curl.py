"""
web/server/detection/bicep_curl.py
==================================
Bicep Curl exercise detector:
  - MediaPipe Pose 9-landmark feature extraction (36 values)
  - ML-based lean-back posture error classifier (C = Correct, L = Leaning too far back) + StandardScaler
  - Geometric analysis:
      * Curl angle (shoulder -> elbow -> wrist)
      * Upper arm sway / loose arm angle (elbow -> shoulder -> vertical axis)
      * Peak contraction check
  - Independent arm tracking (left & right arm)
  - Repetition counter with debouncing
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
from .scoring import evaluate_bicep_curl_form

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils


class ArmTracker:
    def __init__(
        self,
        side: str,
        stage_up_threshold: float = 90.0,
        stage_down_threshold: float = 125.0,
        peak_contraction_threshold: float = 70.0,
        loose_upper_arm_threshold: float = 38.0,
        visibility_threshold: float = 0.38,
    ):
        self.side = side.lower()
        self.stage_up_threshold = stage_up_threshold
        self.stage_down_threshold = stage_down_threshold
        self.peak_contraction_threshold = peak_contraction_threshold
        self.loose_upper_arm_threshold = loose_upper_arm_threshold
        self.visibility_threshold = visibility_threshold

        self.reset()

    def reset(self):
        self.counter = 0
        self.stage = "down"
        self.is_visible = False
        self.curl_angle = None
        self.ground_arm_angle = None
        self.min_contraction_in_rep = 1000.0
        self.has_weak_peak = False
        self.has_loose_arm = False

    def update(self, landmarks) -> bool:
        side_prefix = self.side.upper()
        sh_idx = getattr(mp_pose.PoseLandmark, f"{side_prefix}_SHOULDER").value
        el_idx = getattr(mp_pose.PoseLandmark, f"{side_prefix}_ELBOW").value
        wr_idx = getattr(mp_pose.PoseLandmark, f"{side_prefix}_WRIST").value

        visibilities = [landmarks[sh_idx].visibility, landmarks[el_idx].visibility, landmarks[wr_idx].visibility]
        self.is_visible = all(v >= self.visibility_threshold for v in visibilities)
        if not self.is_visible:
            return False

        shoulder = [landmarks[sh_idx].x, landmarks[sh_idx].y]
        elbow = [landmarks[el_idx].x, landmarks[el_idx].y]
        wrist = [landmarks[wr_idx].x, landmarks[wr_idx].y]

        # 1. Curl angle
        self.curl_angle = round(calculate_angle(shoulder, elbow, wrist), 1)

        # 2. Upper arm sway angle against vertical line (shoulder to bottom of frame)
        vertical_projection = [shoulder[0], shoulder[1] + 1.0]
        self.ground_arm_angle = round(calculate_angle(elbow, shoulder, vertical_projection), 1)

        # 3. Detect loose upper arm
        self.has_loose_arm = self.ground_arm_angle > self.loose_upper_arm_threshold

        # 4. State Machine & Repetition Counting
        if self.curl_angle > self.stage_down_threshold:
            if self.stage == "up":
                # Completed rep transition UP -> DOWN
                if self.min_contraction_in_rep > self.peak_contraction_threshold:
                    self.has_weak_peak = True
                else:
                    self.has_weak_peak = False
            self.stage = "down"
            self.min_contraction_in_rep = 1000.0

        elif self.curl_angle < self.stage_up_threshold:
            if self.stage == "down":
                self.counter += 1
            self.stage = "up"
            if self.curl_angle < self.min_contraction_in_rep:
                self.min_contraction_in_rep = self.curl_angle

        return True


class BicepCurlDetection:
    DEFAULT_MODEL_PATH = "core/bicep_model/model/KNN_model.pkl"
    DEFAULT_SCALER_PATH = "core/bicep_model/model/input_scaler.pkl"

    PREDICTION_PROB_THRESHOLD = 0.70

    def __init__(self, model_path: str = None, scaler_path: str = None) -> None:
        self.init_important_landmarks()
        self.model_path = resolve_model_path(model_path or self.DEFAULT_MODEL_PATH)
        self.scaler_path = resolve_model_path(scaler_path or self.DEFAULT_SCALER_PATH)

        self.load_machine_learning_model()
        self.left_arm = ArmTracker(side="left")
        self.right_arm = ArmTracker(side="right")
        self.side_mode = "both"
        self.reset()

    def init_important_landmarks(self) -> None:
        # Exact 9 landmarks matching train.csv
        self.important_landmarks = [
            "NOSE",
            "LEFT_SHOULDER", "RIGHT_SHOULDER",
            "RIGHT_ELBOW", "LEFT_ELBOW",
            "RIGHT_WRIST", "LEFT_WRIST",
            "LEFT_HIP", "RIGHT_HIP",
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
            alt_path = resolve_model_path("core/bicep_model/model/LR_model.pkl")
            if os.path.exists(alt_path):
                self.model_path = alt_path
            else:
                raise FileNotFoundError(f"Bicep model not found at {self.model_path}")

        if not os.path.exists(self.scaler_path):
            raise FileNotFoundError(f"Bicep scaler not found at {self.scaler_path}")

        with open(self.model_path, "rb") as f:
            self.model = pickle.load(f)
        with open(self.scaler_path, "rb") as f2:
            self.input_scaler = pickle.load(f2)

    def reset(self) -> None:
        self.left_arm.reset()
        self.right_arm.reset()
        self.is_lean_back = False
        self.has_error = False
        self.scores_history = []
        self.latest_result = {}

    def detect(self, mp_results, image=None, timestamp: float = None, side_mode: str = None) -> dict:
        """Process a frame and return structured detection information."""
        if side_mode:
            self.side_mode = side_mode.lower().strip()

        if not mp_results or not mp_results.pose_landmarks:
            return {
                "exercise": "bicep_curl",
                "stage": "down",
                "reps": 0,
                "reps_breakdown": {"left": 0, "right": 0, "total": 0},
                "side_mode": self.side_mode,
                "score": 0.0,
                "errors": [{"type": "no_person", "message": "No body detected in frame"}],
                "angles": {},
                "feedback": ["Position your upper body in view of the camera"],
            }

        landmarks = mp_results.pose_landmarks.landmark

        # 1. Posture Classification (Lean Back error detection)
        row = extract_important_keypoints(mp_results, self.important_landmarks)
        X = pd.DataFrame([row], columns=self.headers[1:])
        X_scaled = self.input_scaler.transform(X)

        predicted_class = str(self.model.predict(X_scaled)[0])
        pred_probs = self.model.predict_proba(X_scaled)[0]
        max_prob = round(float(np.max(pred_probs)), 2)

        self.is_lean_back = (predicted_class == "L" and max_prob >= self.PREDICTION_PROB_THRESHOLD)

        # 2. Update Arm Trackers
        left_ok = self.left_arm.update(landmarks)
        right_ok = self.right_arm.update(landmarks)

        # Select primary arm based on side_mode
        if self.side_mode == "left":
            primary_arm = self.left_arm
            reported_reps = self.left_arm.counter
        elif self.side_mode == "right":
            primary_arm = self.right_arm
            reported_reps = self.right_arm.counter
        else:
            # "both": pick active arm and sum reps
            primary_arm = self.left_arm if (left_ok and not right_ok) else self.right_arm
            if left_ok and right_ok:
                l_val = self.left_arm.curl_angle or 180.0
                r_val = self.right_arm.curl_angle or 180.0
                primary_arm = self.left_arm if l_val < r_val else self.right_arm
            reported_reps = self.left_arm.counter + self.right_arm.counter

        current_stage = primary_arm.stage
        total_reps = self.left_arm.counter + self.right_arm.counter

        # 3. Form Scoring
        active_curl_angle = primary_arm.curl_angle if primary_arm.curl_angle is not None else 180.0
        active_ground_angle = primary_arm.ground_arm_angle if primary_arm.ground_arm_angle is not None else 0.0
        form_eval = evaluate_bicep_curl_form(
            curl_angle=active_curl_angle,
            ground_arm_angle=active_ground_angle,
            is_lean_back=self.is_lean_back,
            stage=current_stage,
            min_contraction_angle=primary_arm.min_contraction_in_rep,
        )

        self.scores_history.append(form_eval["score"])
        avg_score = round(float(np.mean(self.scores_history)), 1)
        self.has_error = len(form_eval["errors"]) > 0

        # Optional Drawing
        if image is not None:
            self._visualize(image, primary_arm, form_eval, avg_score)

        result = {
            "exercise": "bicep_curl",
            "stage": current_stage,
            "reps": reported_reps,
            "reps_breakdown": {
                "left": self.left_arm.counter,
                "right": self.right_arm.counter,
                "total": total_reps,
            },
            "side_mode": self.side_mode,
            "active_arm": "left" if primary_arm == self.left_arm else "right",
            "score": avg_score,
            "current_frame_score": form_eval["score"],
            "errors": form_eval["errors"],
            "angles": {
                "left_curl": self.left_arm.curl_angle,
                "right_curl": self.right_arm.curl_angle,
                "curl": primary_arm.curl_angle,
                "left_arm_sway": self.left_arm.ground_arm_angle,
                "right_arm_sway": self.right_arm.ground_arm_angle,
            },
            "feedback": form_eval["feedback"],
        }
        self.latest_result = result
        return result

    def _visualize(self, image, arm, form_eval, avg_score):
        h, w = image.shape[:2]
        cv2.rectangle(image, (10, 10), (370, 95), (20, 20, 20), -1)
        mode_str = f" ({self.side_mode.upper()})"
        cv2.putText(image, f"BICEP REPS{mode_str}: L:{self.left_arm.counter} R:{self.right_arm.counter}", (20, 38),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.70, (0, 255, 0), 2)
        cv2.putText(image, f"STAGE: {arm.stage.upper()} | SCORE: {avg_score}", (20, 68),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1)

        if self.is_lean_back:
            cv2.putText(image, "LEANING BACK!", (20, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

        if form_eval["feedback"]:
            fb = form_eval["feedback"][0]
            color = (0, 0, 255) if form_eval["errors"] else (0, 255, 200)
            cv2.putText(image, fb, (20, h - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

