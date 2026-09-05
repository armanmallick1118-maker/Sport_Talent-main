"""
ATHENA-MOTION: Unified Biomechanical Machine Learning Pipeline.
Connects Video Capture -> MediaPipe 33 Landmarks -> Biomechanical Engine ->
CPU ML Classifier -> Repetition State Machine -> Visualizer & Telemetry.
"""

from typing import Optional, Dict, Any, Tuple, Generator
from dataclasses import dataclass, asdict
import os
import cv2
import numpy as np

from athena_motion.vision.pose_detector import PoseDetector
from athena_motion.vision.visualizer import KinematicVisualizer
from athena_motion.vision.video_processor import VideoProcessor
from athena_motion.biomechanics.metrics import BiomechanicalMetrics, compute_biomechanical_metrics
from athena_motion.biomechanics.features import BiomechanicalFeatureExtractor
from athena_motion.biomechanics.temporal import RepetitionCounter
from athena_motion.models.classifier import AthenaMotionClassifier, MotionPrediction
from athena_motion.models.exporter import ModelExporter, OnnxMotionRunner
from athena_motion.models.trainer import ModelTrainer
from athena_motion.dataset.schema import ExerciseType, FormQuality, RepPhase

@dataclass
class FrameAnalysisResult:
    """Complete analysis telemetry for a single video frame."""
    frame_index: int
    timestamp_sec: float
    person_detected: bool
    exercise: str
    exercise_confidence: float
    form_quality: str
    form_confidence: float
    feedback_cue: str
    rep_count: int
    rep_phase: str
    consistency_score: float
    metrics: Dict[str, float]
    annotated_frame: Optional[np.ndarray] = None

    def to_dict(self, include_frame: bool = False) -> Dict[str, Any]:
        d = {
            "frame_index": self.frame_index,
            "timestamp_sec": round(self.timestamp_sec, 3),
            "person_detected": self.person_detected,
            "exercise": self.exercise,
            "exercise_confidence": round(self.exercise_confidence, 3),
            "form_quality": self.form_quality,
            "form_confidence": round(self.form_confidence, 3),
            "feedback_cue": self.feedback_cue,
            "rep_count": self.rep_count,
            "rep_phase": self.rep_phase,
            "consistency_score": round(self.consistency_score, 1),
            "metrics": self.metrics
        }
        if include_frame and self.annotated_frame is not None:
            d["annotated_frame"] = self.annotated_frame
        return d


class AthenaMotionPipeline:
    """
    Main reusable pipeline interface for ATHENA-MOTION.
    Can be imported into any project or backend service.
    """
    def __init__(
        self,
        model_path: Optional[str] = None,
        onnx_model_dir: Optional[str] = None,
        pose_model_path: Optional[str] = None,
        exercise_type: ExerciseType = ExerciseType.SQUAT,
        smoothing_factor: float = 0.65,
        auto_train_if_missing: bool = True
    ):
        # 1. Vision & Landmark Detection
        self.pose_detector = PoseDetector(
            model_path=pose_model_path,
            smoothing_factor=smoothing_factor
        )
        self.feature_extractor = BiomechanicalFeatureExtractor(normalize_invariance=True)
        self.visualizer = KinematicVisualizer()
        self.rep_counter = RepetitionCounter(exercise_type=exercise_type)

        # 2. ML Inference Engine (Joblib, ONNX, or auto-trained)
        self.classifier: Optional[AthenaMotionClassifier] = None
        self.onnx_runner: Optional[OnnxMotionRunner] = None

        if onnx_model_dir and os.path.isdir(onnx_model_dir):
            self.onnx_runner = OnnxMotionRunner(onnx_model_dir)
        elif model_path and os.path.isfile(model_path):
            try:
                self.classifier = ModelExporter.load_joblib(model_path)
            except Exception as e:
                print(f"[ATHENA-MOTION] Notice: Model version mismatch ({e}). Initializing built-in calibrated model...")
                if auto_train_if_missing:
                    trainer = ModelTrainer()
                    self.classifier, _, _ = trainer.train_from_synthetic(n_samples_per_class=100)
        elif auto_train_if_missing:
            print("[ATHENA-MOTION] Initializing built-in CPU model with calibrated synthetic biomechanics...")
            trainer = ModelTrainer()
            self.classifier, _, _ = trainer.train_from_synthetic(n_samples_per_class=100)

        self._frame_count = 0


    def analyze_frame(
        self,
        frame_bgr: np.ndarray,
        timestamp_sec: Optional[float] = None,
        render_overlay: bool = True
    ) -> FrameAnalysisResult:
        """
        Processes a single OpenCV BGR frame through the full pipeline.
        """
        self._frame_count += 1
        t_sec = timestamp_sec if timestamp_sec is not None else (self._frame_count / 30.0)

        # 1. MediaPipe Pose Landmark Detection
        landmarks = self.pose_detector.detect(frame_bgr)

        if landmarks is None:
            annotated = frame_bgr.copy() if render_overlay else None
            return FrameAnalysisResult(
                frame_index=self._frame_count,
                timestamp_sec=t_sec,
                person_detected=False,
                exercise="None",
                exercise_confidence=0.0,
                form_quality="No Person Detected",
                form_confidence=0.0,
                feedback_cue="STEP INTO FRAME",
                rep_count=self.rep_counter.rep_count,
                rep_phase=self.rep_counter.current_phase.value,
                consistency_score=self.rep_counter.get_consistency_score(),
                metrics={},
                annotated_frame=annotated
            )

        # 2. Biomechanical Feature Extraction & Metrics
        feat_vector, metrics = self.feature_extractor.extract(landmarks, return_metrics_obj=True)

        # 3. CPU ML Prediction
        if self.onnx_runner is not None:
            pred = self.onnx_runner.predict(feat_vector)
        elif self.classifier is not None:
            pred = self.classifier.predict_frame(feat_vector)
        else:
            pred = MotionPrediction("Squat", 1.0, "Good Form", 1.0, "FORM GOOD", True)

        # 4. Update Repetition State Machine
        # Primary angle used for rep tracking depends on exercise
        primary_angle = metrics.angle_left_knee
        if "pushup" in pred.exercise.lower() or "curl" in pred.exercise.lower():
            primary_angle = metrics.angle_left_elbow
        elif "deadlift" in pred.exercise.lower():
            primary_angle = metrics.angle_left_hip

        self.rep_counter.update(
            current_angle=primary_angle,
            timestamp=t_sec,
            form_fault=None if pred.is_good_form else pred.form_quality
        )

        # 5. Visualizer HUD Overlay Rendering
        annotated = None
        if render_overlay:
            annotated = self.visualizer.render(
                frame=frame_bgr,
                landmarks=landmarks,
                metrics=metrics,
                exercise_name=pred.exercise,
                rep_count=self.rep_counter.rep_count,
                rep_phase=self.rep_counter.current_phase,
                form_quality=pred.form_quality,
                feedback_cue=pred.feedback_cue,
                consistency_score=self.rep_counter.get_consistency_score()
            )

        return FrameAnalysisResult(
            frame_index=self._frame_count,
            timestamp_sec=t_sec,
            person_detected=True,
            exercise=pred.exercise,
            exercise_confidence=pred.exercise_confidence,
            form_quality=pred.form_quality,
            form_confidence=pred.form_confidence,
            feedback_cue=pred.feedback_cue,
            rep_count=self.rep_counter.rep_count,
            rep_phase=self.rep_counter.current_phase.value,
            consistency_score=self.rep_counter.get_consistency_score(),
            metrics=metrics.to_dict() if metrics else {},
            annotated_frame=annotated
        )

    def process_video(
        self,
        input_path: str,
        output_path: Optional[str] = None,
        frame_stride: int = 1
    ) -> Dict[str, Any]:
        """
        Processes an entire video file from start to finish, optionally writing
        an annotated MP4 video with full HUD and kinematic skeleton.
        """
        processor = VideoProcessor(source=input_path, frame_stride=frame_stride)
        if not processor.open():
            raise FileNotFoundError(f"Could not open input video: {input_path}")

        writer = None
        if output_path:
            writer = processor.create_writer(output_path)

        frame_results = []
        form_fault_counts = {}

        try:
            for frame_idx, timestamp, frame in processor.frames():
                result = self.analyze_frame(frame, timestamp_sec=timestamp, render_overlay=(writer is not None))
                frame_results.append(result)

                if result.person_detected and not "good" in result.form_quality.lower():
                    form_fault_counts[result.form_quality] = form_fault_counts.get(result.form_quality, 0) + 1

                if writer and result.annotated_frame is not None:
                    writer.write(result.annotated_frame)
        finally:
            if writer:
                writer.release()
            processor.release()

        summary = {
            "total_frames_processed": len(frame_results),
            "completed_reps": self.rep_counter.rep_count,
            "consistency_score": round(self.rep_counter.get_consistency_score(), 1),
            "rep_details": [asdict(r) for r in self.rep_counter.rep_history],
            "form_fault_distribution": form_fault_counts,
            "output_video": output_path
        }
        return summary

    def reset(self) -> None:
        """Resets rep tracking and temporal smoothers."""
        self._frame_count = 0
        self.pose_detector.reset_smoothing()
        self.rep_counter.reset()

    def close(self) -> None:
        """Releases all resources."""
        self.pose_detector.close()
