"""
ATHENA-MOTION: Reusable Computer Vision & Biomechanics ML Pipeline.

Pipeline Flow:
VIDEO -> OpenCV -> MediaPipe Pose (33 Landmarks) -> Biomechanical Calculations ->
Training Dataset -> CPU-Trained ML Model -> ATHENA-MOTION Engine
"""

__version__ = "0.1.0"
__author__ = "Athena Team"

from athena_motion.dataset.schema import (
    PoseLandmarkIndex,
    SKELETON_CONNECTIONS,
    ExerciseType,
    FormQuality,
    RepPhase,
    BIOMECHANICAL_FEATURE_NAMES,
    ALL_FEATURE_NAMES,
    TOTAL_FEATURE_COUNT
)
from athena_motion.vision.pose_detector import PoseDetector
from athena_motion.vision.hand_detector import HandDetector, HandInfo
from athena_motion.vision.visualizer import KinematicVisualizer
from athena_motion.vision.video_processor import VideoProcessor
from athena_motion.biomechanics.kinematics import (
    calculate_angle_2d,
    calculate_angle_3d,
    calculate_trunk_inclination,
    calculate_segment_tilt
)
from athena_motion.biomechanics.metrics import BiomechanicalMetrics, compute_biomechanical_metrics
from athena_motion.biomechanics.temporal import RepetitionCounter, RepetitionStats
from athena_motion.biomechanics.features import BiomechanicalFeatureExtractor
from athena_motion.biomechanics.posture_events import PostureEventDetector, PostureEvent, PostureState
from athena_motion.biomechanics.event_logger import MotionEventLogger, MotionEvent
from athena_motion.dataset.generator import DatasetGenerator
from athena_motion.dataset.storage import save_dataset, load_dataset
from athena_motion.models.classifier import AthenaMotionClassifier, MotionPrediction
from athena_motion.models.trainer import ModelTrainer
from athena_motion.models.exporter import ModelExporter, OnnxMotionRunner
from athena_motion.models.evaluator import ModelEvaluator
from athena_motion.pipeline import AthenaMotionPipeline, FrameAnalysisResult

__all__ = [
    # Top-Level Engine
    "AthenaMotionPipeline",
    "FrameAnalysisResult",
    # Vision
    "PoseDetector",
    "HandDetector",
    "HandInfo",
    "KinematicVisualizer",
    "VideoProcessor",
    # Biomechanics
    "BiomechanicalMetrics",
    "compute_biomechanical_metrics",
    "calculate_angle_2d",
    "calculate_angle_3d",
    "calculate_trunk_inclination",
    "calculate_segment_tilt",
    "RepetitionCounter",
    "RepetitionStats",
    "BiomechanicalFeatureExtractor",
    "PostureEventDetector",
    "PostureEvent",
    "PostureState",
    "MotionEventLogger",
    "MotionEvent",
    # Dataset
    "DatasetGenerator",
    "save_dataset",
    "load_dataset",
    "PoseLandmarkIndex",
    "SKELETON_CONNECTIONS",
    "ExerciseType",
    "FormQuality",
    "RepPhase",
    "BIOMECHANICAL_FEATURE_NAMES",
    "ALL_FEATURE_NAMES",
    "TOTAL_FEATURE_COUNT",
    # Models
    "AthenaMotionClassifier",
    "MotionPrediction",
    "ModelTrainer",
    "ModelExporter",
    "OnnxMotionRunner",
    "ModelEvaluator"
]
