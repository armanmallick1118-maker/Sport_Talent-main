"""
ATHENA-MOTION: Training Dataset Generator & Video Extractor.
Extracts tabular kinematic vectors from real video files and synthesizes calibrated
biomechanical datasets covering 7 athletic exercises and 6 kinematic form conditions.
"""

from typing import List, Dict, Any, Optional
import math
import numpy as np
import pandas as pd
from tqdm import tqdm

from athena_motion.dataset.schema import (
    PoseLandmarkIndex,
    ExerciseType,
    FormQuality,
    ALL_FEATURE_NAMES,
    TOTAL_FEATURE_COUNT
)
from athena_motion.biomechanics.features import BiomechanicalFeatureExtractor
from athena_motion.vision.pose_detector import PoseDetector
from athena_motion.vision.video_processor import VideoProcessor

class DatasetGenerator:
    """
    Extracts biomechanical training datasets from real video feeds and generates
    physically constrained synthetic motion datasets for fast CPU model training.
    """
    def __init__(self):
        self.feature_extractor = BiomechanicalFeatureExtractor(normalize_invariance=True)

    def extract_from_video(
        self,
        video_path: str,
        exercise_label: ExerciseType | str,
        form_quality_label: FormQuality | str = FormQuality.GOOD_FORM,
        frame_stride: int = 1,
        pose_detector: Optional[PoseDetector] = None
    ) -> pd.DataFrame:
        """
        Processes a video file with OpenCV and MediaPipe, extracting 148 features per frame.
        """
        detector = pose_detector or PoseDetector()
        rows = []

        processor = VideoProcessor(source=video_path, frame_stride=frame_stride)
        with processor:
            for frame_idx, timestamp, frame in processor.frames():
                landmarks = detector.detect(frame)
                if landmarks is not None:
                    vector, _ = self.feature_extractor.extract(landmarks)
                    row_dict = {name: val for name, val in zip(ALL_FEATURE_NAMES, vector)}
                    row_dict["exercise"] = exercise_label.value if hasattr(exercise_label, "value") else str(exercise_label)
                    row_dict["form_quality"] = form_quality_label.value if hasattr(form_quality_label, "value") else str(form_quality_label)
                    row_dict["timestamp"] = timestamp
                    row_dict["frame_idx"] = frame_idx
                    rows.append(row_dict)

        if not pose_detector:
            detector.close()

        return pd.DataFrame(rows)

    def generate_squat_dataset(
        self,
        n_samples_per_fault: int = 400,
        random_state: int = 42
    ) -> pd.DataFrame:
        """
        Generates high-density calibrated biomechanical dataset specifically for SQUATS,
        covering optimal form, knee valgus, forward lean, incomplete depth, and stance asymmetry.
        """
        np.random.seed(random_state)
        data_rows: List[Dict[str, Any]] = []

        squat_form_profiles = [
            FormQuality.GOOD_FORM,
            FormQuality.KNEE_VALGUS,
            FormQuality.EXCESSIVE_FORWARD_LEAN,
            FormQuality.INCOMPLETE_DEPTH,
            FormQuality.ASYMMETRICAL_STANCE
        ]

        print(f"[ATHENA-MOTION] Generating specialized squat dataset ({n_samples_per_fault} samples/form class)...")

        for form in squat_form_profiles:
            for _ in range(n_samples_per_fault):
                landmarks = self._synthesize_pose_skeleton(ExerciseType.SQUAT, form, noise_std=0.025)
                vector, metrics = self.feature_extractor.extract(landmarks, return_metrics_obj=True)

                row = {name: val for name, val in zip(ALL_FEATURE_NAMES, vector)}
                row["exercise"] = "squat"
                row["form_quality"] = form.value
                data_rows.append(row)

        df = pd.DataFrame(data_rows)
        return df.sample(frac=1.0, random_state=random_state).reset_index(drop=True)

    def generate_synthetic_exercise_dataset(
        self,
        n_samples_per_class: int = 300,
        noise_std: float = 0.03,
        random_state: int = 42
    ) -> pd.DataFrame:
        """
        Generates calibrated biomechanical samples across athletic exercises
        and form variations grounded in sports kinesiology.
        """
        np.random.seed(random_state)
        data_rows: List[Dict[str, Any]] = []

        # Configurations for different exercises and form profiles
        exercise_profiles = [
            # SQUAT variations
            (ExerciseType.SQUAT, FormQuality.GOOD_FORM),
            (ExerciseType.SQUAT, FormQuality.KNEE_VALGUS),
            (ExerciseType.SQUAT, FormQuality.EXCESSIVE_FORWARD_LEAN),
            (ExerciseType.SQUAT, FormQuality.INCOMPLETE_DEPTH),
            # DEADLIFT variations
            (ExerciseType.DEADLIFT, FormQuality.GOOD_FORM),
            (ExerciseType.DEADLIFT, FormQuality.ROUNDED_BACK),
            # PUSHUP variations
            (ExerciseType.PUSHUP, FormQuality.GOOD_FORM),
            (ExerciseType.PUSHUP, FormQuality.ELBOW_FLARE),
            # BICEP CURL
            (ExerciseType.BICEP_CURL, FormQuality.GOOD_FORM),
            # OVERHEAD PRESS
            (ExerciseType.OVERHEAD_PRESS, FormQuality.GOOD_FORM),
            # PLANK
            (ExerciseType.PLANK, FormQuality.GOOD_FORM),
            # LUNGE variations
            (ExerciseType.LUNGE, FormQuality.GOOD_FORM),
            (ExerciseType.LUNGE, FormQuality.ASYMMETRICAL_STANCE)
        ]

        for exercise, form in exercise_profiles:
            for _ in range(n_samples_per_class):
                landmarks = self._synthesize_pose_skeleton(exercise, form, noise_std)
                vector, metrics = self.feature_extractor.extract(landmarks, return_metrics_obj=True)

                row = {name: val for name, val in zip(ALL_FEATURE_NAMES, vector)}
                row["exercise"] = exercise.value
                row["form_quality"] = form.value
                data_rows.append(row)

        df = pd.DataFrame(data_rows)
        return df.sample(frac=1.0, random_state=random_state).reset_index(drop=True)

    def _synthesize_pose_skeleton(
        self,
        exercise: ExerciseType,
        form: FormQuality,
        noise_std: float
    ) -> np.ndarray:
        """
        Constructs a geometrically valid 33-landmark skeleton matching kinematic constraints.
        Coordinates are normalized to [0, 1] screen space.
        """
        lm = np.zeros((33, 4), dtype=np.float32)
        lm[:, 3] = 0.95 + 0.05 * np.random.rand(33) # High visibility

        # Phase cycle progression (0.0 standing/top -> 1.0 bottom turnaround)
        t = np.random.uniform(0.0, 1.0)

        # Baseline vertical standing layout
        head_y = 0.15
        shoulder_y = 0.28
        hip_y = 0.55
        knee_y = 0.75
        ankle_y = 0.92

        shoulder_w = 0.18
        hip_w = 0.14
        ankle_w = 0.18

        if exercise == ExerciseType.SQUAT:
            # Active squat descent phase
            if form == FormQuality.INCOMPLETE_DEPTH:
                # User cuts repetition short (quarter or half squat)
                t = np.random.uniform(0.15, 0.42)
                hip_y = 0.55 + t * 0.22
                knee_y = 0.75 + t * 0.04
                trunk_forward = 0.03 + t * 0.06
                knee_lateral = ankle_w
                hip_tilt_delta = 0.0
            elif form == FormQuality.KNEE_VALGUS:
                # Deep squat but knees cave inwards towards centerline
                t = np.random.uniform(0.55, 1.0)
                hip_y = 0.55 + t * 0.22
                knee_y = 0.75 + t * 0.05
                trunk_forward = 0.03 + t * 0.06
                knee_lateral = ankle_w * np.random.uniform(0.45, 0.68)
                hip_tilt_delta = 0.0
            elif form == FormQuality.EXCESSIVE_FORWARD_LEAN:
                # Torso collapses excessively forward (> 45 deg)
                t = np.random.uniform(0.55, 1.0)
                hip_y = 0.55 + t * 0.22
                knee_y = 0.75 + t * 0.05
                trunk_forward = 0.18 + t * 0.10
                knee_lateral = ankle_w
                hip_tilt_delta = 0.0
            elif form == FormQuality.ASYMMETRICAL_STANCE:
                # Uneven hip loading / lateral shift
                t = np.random.uniform(0.55, 1.0)
                hip_y = 0.55 + t * 0.22
                knee_y = 0.75 + t * 0.05
                trunk_forward = 0.03 + t * 0.06
                knee_lateral = ankle_w
                hip_tilt_delta = float(np.random.choice([-0.035, 0.035]))
            else: # GOOD_FORM
                # Full parallel/below parallel depth, upright chest, knees tracking over toes
                t = np.random.uniform(0.72, 1.0)
                hip_y = 0.55 + t * 0.22
                knee_y = 0.75 + t * 0.05
                trunk_forward = 0.03 + t * 0.06
                knee_lateral = ankle_w * np.random.uniform(0.95, 1.08)
                hip_tilt_delta = 0.0

            # Head
            lm[PoseLandmarkIndex.NOSE] = [0.50 + trunk_forward, head_y + (hip_y - 0.55), 0.0, 1.0]
            # Shoulders
            lm[PoseLandmarkIndex.LEFT_SHOULDER] = [0.50 - shoulder_w/2 + trunk_forward, shoulder_y + (hip_y - 0.55), 0.0, 1.0]
            lm[PoseLandmarkIndex.RIGHT_SHOULDER] = [0.50 + shoulder_w/2 + trunk_forward, shoulder_y + (hip_y - 0.55), 0.0, 1.0]
            # Arms extended forward for balance
            lm[PoseLandmarkIndex.LEFT_ELBOW] = [0.40, shoulder_y + (hip_y - 0.55), 0.15, 1.0]
            lm[PoseLandmarkIndex.RIGHT_ELBOW] = [0.60, shoulder_y + (hip_y - 0.55), 0.15, 1.0]
            lm[PoseLandmarkIndex.LEFT_WRIST] = [0.42, shoulder_y + (hip_y - 0.55) - 0.05, 0.25, 1.0]
            lm[PoseLandmarkIndex.RIGHT_WRIST] = [0.58, shoulder_y + (hip_y - 0.55) - 0.05, 0.25, 1.0]
            # Hips (with tilt delta for asymmetry)
            lm[PoseLandmarkIndex.LEFT_HIP] = [0.50 - hip_w/2, hip_y + hip_tilt_delta, 0.0, 1.0]
            lm[PoseLandmarkIndex.RIGHT_HIP] = [0.50 + hip_w/2, hip_y - hip_tilt_delta, 0.0, 1.0]
            # Knees
            lm[PoseLandmarkIndex.LEFT_KNEE] = [0.50 - knee_lateral/2, knee_y, 0.10, 1.0]
            lm[PoseLandmarkIndex.RIGHT_KNEE] = [0.50 + knee_lateral/2, knee_y, 0.10, 1.0]
            # Ankles & Feet
            lm[PoseLandmarkIndex.LEFT_ANKLE] = [0.50 - ankle_w/2, ankle_y, 0.0, 1.0]
            lm[PoseLandmarkIndex.RIGHT_ANKLE] = [0.50 + ankle_w/2, ankle_y, 0.0, 1.0]
            lm[PoseLandmarkIndex.LEFT_FOOT_INDEX] = [0.50 - ankle_w/2, ankle_y + 0.03, 0.08, 1.0]
            lm[PoseLandmarkIndex.RIGHT_FOOT_INDEX] = [0.50 + ankle_w/2, ankle_y + 0.03, 0.08, 1.0]

        elif exercise == ExerciseType.DEADLIFT:
            # Hip hinge pattern
            hip_y = 0.55 + t * 0.15
            trunk_forward = t * 0.18
            if form == FormQuality.ROUNDED_BACK:
                trunk_forward += 0.10

            lm[PoseLandmarkIndex.NOSE] = [0.50 + trunk_forward, head_y + (hip_y - 0.55), 0.0, 1.0]
            lm[PoseLandmarkIndex.LEFT_SHOULDER] = [0.50 - shoulder_w/2 + trunk_forward, shoulder_y + (hip_y - 0.55), 0.0, 1.0]
            lm[PoseLandmarkIndex.RIGHT_SHOULDER] = [0.50 + shoulder_w/2 + trunk_forward, shoulder_y + (hip_y - 0.55), 0.0, 1.0]
            # Hands hanging straight down towards bar
            lm[PoseLandmarkIndex.LEFT_WRIST] = [0.45, hip_y + 0.20, 0.05, 1.0]
            lm[PoseLandmarkIndex.RIGHT_WRIST] = [0.55, hip_y + 0.20, 0.05, 1.0]
            lm[PoseLandmarkIndex.LEFT_ELBOW] = [0.45, (shoulder_y + hip_y + 0.20)/2, 0.02, 1.0]
            lm[PoseLandmarkIndex.RIGHT_ELBOW] = [0.55, (shoulder_y + hip_y + 0.20)/2, 0.02, 1.0]
            lm[PoseLandmarkIndex.LEFT_HIP] = [0.50 - hip_w/2, hip_y, 0.0, 1.0]
            lm[PoseLandmarkIndex.RIGHT_HIP] = [0.50 + hip_w/2, hip_y, 0.0, 1.0]
            lm[PoseLandmarkIndex.LEFT_KNEE] = [0.50 - hip_w/2, knee_y, 0.05, 1.0]
            lm[PoseLandmarkIndex.RIGHT_KNEE] = [0.50 + hip_w/2, knee_y, 0.05, 1.0]
            lm[PoseLandmarkIndex.LEFT_ANKLE] = [0.50 - hip_w/2, ankle_y, 0.0, 1.0]
            lm[PoseLandmarkIndex.RIGHT_ANKLE] = [0.50 + hip_w/2, ankle_y, 0.0, 1.0]
            lm[PoseLandmarkIndex.LEFT_FOOT_INDEX] = [0.50 - hip_w/2, ankle_y + 0.03, 0.08, 1.0]
            lm[PoseLandmarkIndex.RIGHT_FOOT_INDEX] = [0.50 + hip_w/2, ankle_y + 0.03, 0.08, 1.0]

        elif exercise in [ExerciseType.PUSHUP, ExerciseType.PLANK]:
            # Horizontal body plane
            body_y = 0.60
            dip_y = t * 0.18 if exercise == ExerciseType.PUSHUP else 0.0

            lm[PoseLandmarkIndex.NOSE] = [0.25, body_y - 0.05 + dip_y, 0.0, 1.0]
            lm[PoseLandmarkIndex.LEFT_SHOULDER] = [0.35, body_y + dip_y, -shoulder_w/2, 1.0]
            lm[PoseLandmarkIndex.RIGHT_SHOULDER] = [0.35, body_y + dip_y, shoulder_w/2, 1.0]

            elbow_flare = 0.12 if form == FormQuality.ELBOW_FLARE else 0.04
            lm[PoseLandmarkIndex.LEFT_ELBOW] = [0.35 - elbow_flare, body_y + 0.10 + dip_y/2, -shoulder_w/2 - elbow_flare, 1.0]
            lm[PoseLandmarkIndex.RIGHT_ELBOW] = [0.35 - elbow_flare, body_y + 0.10 + dip_y/2, shoulder_w/2 + elbow_flare, 1.0]
            lm[PoseLandmarkIndex.LEFT_WRIST] = [0.35, body_y + 0.22, -shoulder_w/2, 1.0]
            lm[PoseLandmarkIndex.RIGHT_WRIST] = [0.35, body_y + 0.22, shoulder_w/2, 1.0]

            lm[PoseLandmarkIndex.LEFT_HIP] = [0.60, body_y + dip_y * 0.6, -hip_w/2, 1.0]
            lm[PoseLandmarkIndex.RIGHT_HIP] = [0.60, body_y + dip_y * 0.6, hip_w/2, 1.0]
            lm[PoseLandmarkIndex.LEFT_KNEE] = [0.75, body_y + dip_y * 0.3, -hip_w/2, 1.0]
            lm[PoseLandmarkIndex.RIGHT_KNEE] = [0.75, body_y + dip_y * 0.3, hip_w/2, 1.0]
            lm[PoseLandmarkIndex.LEFT_ANKLE] = [0.88, body_y, -ankle_w/2, 1.0]
            lm[PoseLandmarkIndex.RIGHT_ANKLE] = [0.88, body_y, ankle_w/2, 1.0]
            lm[PoseLandmarkIndex.LEFT_FOOT_INDEX] = [0.90, body_y + 0.02, -ankle_w/2, 1.0]
            lm[PoseLandmarkIndex.RIGHT_FOOT_INDEX] = [0.90, body_y + 0.02, ankle_w/2, 1.0]

        elif exercise == ExerciseType.BICEP_CURL:
            # Standing upright, forearm flexion
            curl_y = shoulder_y + 0.05 + (1.0 - t) * 0.20

            lm[PoseLandmarkIndex.NOSE] = [0.50, head_y, 0.0, 1.0]
            lm[PoseLandmarkIndex.LEFT_SHOULDER] = [0.50 - shoulder_w/2, shoulder_y, 0.0, 1.0]
            lm[PoseLandmarkIndex.RIGHT_SHOULDER] = [0.50 + shoulder_w/2, shoulder_y, 0.0, 1.0]
            lm[PoseLandmarkIndex.LEFT_ELBOW] = [0.50 - shoulder_w/2, shoulder_y + 0.16, 0.0, 1.0]
            lm[PoseLandmarkIndex.RIGHT_ELBOW] = [0.50 + shoulder_w/2, shoulder_y + 0.16, 0.0, 1.0]
            lm[PoseLandmarkIndex.LEFT_WRIST] = [0.50 - shoulder_w/2, curl_y, 0.12, 1.0]
            lm[PoseLandmarkIndex.RIGHT_WRIST] = [0.50 + shoulder_w/2, curl_y, 0.12, 1.0]
            lm[PoseLandmarkIndex.LEFT_HIP] = [0.50 - hip_w/2, hip_y, 0.0, 1.0]
            lm[PoseLandmarkIndex.RIGHT_HIP] = [0.50 + hip_w/2, hip_y, 0.0, 1.0]
            lm[PoseLandmarkIndex.LEFT_KNEE] = [0.50 - hip_w/2, knee_y, 0.0, 1.0]
            lm[PoseLandmarkIndex.RIGHT_KNEE] = [0.50 + hip_w/2, knee_y, 0.0, 1.0]
            lm[PoseLandmarkIndex.LEFT_ANKLE] = [0.50 - hip_w/2, ankle_y, 0.0, 1.0]
            lm[PoseLandmarkIndex.RIGHT_ANKLE] = [0.50 + hip_w/2, ankle_y, 0.0, 1.0]
            lm[PoseLandmarkIndex.LEFT_FOOT_INDEX] = [0.50 - hip_w/2, ankle_y + 0.03, 0.05, 1.0]
            lm[PoseLandmarkIndex.RIGHT_FOOT_INDEX] = [0.50 + hip_w/2, ankle_y + 0.03, 0.05, 1.0]

        elif exercise == ExerciseType.OVERHEAD_PRESS:
            # Standing upright, pressing overhead
            press_y = shoulder_y + 0.05 - t * 0.25

            lm[PoseLandmarkIndex.NOSE] = [0.50, head_y, 0.0, 1.0]
            lm[PoseLandmarkIndex.LEFT_SHOULDER] = [0.50 - shoulder_w/2, shoulder_y, 0.0, 1.0]
            lm[PoseLandmarkIndex.RIGHT_SHOULDER] = [0.50 + shoulder_w/2, shoulder_y, 0.0, 1.0]
            lm[PoseLandmarkIndex.LEFT_ELBOW] = [0.50 - shoulder_w/2 - 0.05, (shoulder_y + press_y)/2, 0.05, 1.0]
            lm[PoseLandmarkIndex.RIGHT_ELBOW] = [0.50 + shoulder_w/2 + 0.05, (shoulder_y + press_y)/2, 0.05, 1.0]
            lm[PoseLandmarkIndex.LEFT_WRIST] = [0.50 - shoulder_w/2, press_y, 0.05, 1.0]
            lm[PoseLandmarkIndex.RIGHT_WRIST] = [0.50 + shoulder_w/2, press_y, 0.05, 1.0]
            lm[PoseLandmarkIndex.LEFT_HIP] = [0.50 - hip_w/2, hip_y, 0.0, 1.0]
            lm[PoseLandmarkIndex.RIGHT_HIP] = [0.50 + hip_w/2, hip_y, 0.0, 1.0]
            lm[PoseLandmarkIndex.LEFT_KNEE] = [0.50 - hip_w/2, knee_y, 0.0, 1.0]
            lm[PoseLandmarkIndex.RIGHT_KNEE] = [0.50 + hip_w/2, knee_y, 0.0, 1.0]
            lm[PoseLandmarkIndex.LEFT_ANKLE] = [0.50 - hip_w/2, ankle_y, 0.0, 1.0]
            lm[PoseLandmarkIndex.RIGHT_ANKLE] = [0.50 + hip_w/2, ankle_y, 0.0, 1.0]
            lm[PoseLandmarkIndex.LEFT_FOOT_INDEX] = [0.50 - hip_w/2, ankle_y + 0.03, 0.05, 1.0]
            lm[PoseLandmarkIndex.RIGHT_FOOT_INDEX] = [0.50 + hip_w/2, ankle_y + 0.03, 0.05, 1.0]

        elif exercise == ExerciseType.LUNGE:
            # Asymmetrical forward split
            hip_y = 0.55 + t * 0.16
            lead_knee_y = 0.75 + t * 0.05
            rear_knee_y = 0.75 + t * 0.12

            asym_x = 0.05 if form == FormQuality.ASYMMETRICAL_STANCE else 0.0

            lm[PoseLandmarkIndex.NOSE] = [0.50, head_y + (hip_y - 0.55), 0.0, 1.0]
            lm[PoseLandmarkIndex.LEFT_SHOULDER] = [0.50 - shoulder_w/2, shoulder_y + (hip_y - 0.55), 0.0, 1.0]
            lm[PoseLandmarkIndex.RIGHT_SHOULDER] = [0.50 + shoulder_w/2, shoulder_y + (hip_y - 0.55), 0.0, 1.0]
            lm[PoseLandmarkIndex.LEFT_HIP] = [0.50 - hip_w/2, hip_y, 0.0, 1.0]
            lm[PoseLandmarkIndex.RIGHT_HIP] = [0.50 + hip_w/2, hip_y, 0.0, 1.0]
            # Lead leg (Left) forward
            lm[PoseLandmarkIndex.LEFT_KNEE] = [0.42 + asym_x, lead_knee_y, 0.15, 1.0]
            lm[PoseLandmarkIndex.LEFT_ANKLE] = [0.42, ankle_y, 0.15, 1.0]
            lm[PoseLandmarkIndex.LEFT_FOOT_INDEX] = [0.42, ankle_y + 0.03, 0.20, 1.0]
            # Rear leg (Right) back
            lm[PoseLandmarkIndex.RIGHT_KNEE] = [0.58, rear_knee_y, -0.15, 1.0]
            lm[PoseLandmarkIndex.RIGHT_ANKLE] = [0.58, ankle_y, -0.20, 1.0]
            lm[PoseLandmarkIndex.RIGHT_FOOT_INDEX] = [0.58, ankle_y + 0.03, -0.15, 1.0]

        # Fill in eyes/ears/mouth relative to nose
        nose = lm[PoseLandmarkIndex.NOSE][:3]
        lm[PoseLandmarkIndex.LEFT_EYE] = [nose[0] - 0.02, nose[1] - 0.02, nose[2], 1.0]
        lm[PoseLandmarkIndex.RIGHT_EYE] = [nose[0] + 0.02, nose[1] - 0.02, nose[2], 1.0]
        lm[PoseLandmarkIndex.LEFT_EAR] = [nose[0] - 0.05, nose[1] - 0.01, nose[2], 1.0]
        lm[PoseLandmarkIndex.RIGHT_EAR] = [nose[0] + 0.05, nose[1] - 0.01, nose[2], 1.0]

        # Add realistic Gaussian noise to coordinates
        noise = np.random.normal(0, noise_std, size=lm[:, :3].shape)
        lm[:, :3] += noise

        return lm
