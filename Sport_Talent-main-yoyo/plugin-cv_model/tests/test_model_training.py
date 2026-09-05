"""
Unit Tests for ATHENA-MOTION CPU Machine Learning Model & Latency.
"""

import pytest
import numpy as np

from athena_motion.models.classifier import AthenaMotionClassifier, MotionPrediction
from athena_motion.models.trainer import ModelTrainer
from athena_motion.models.evaluator import ModelEvaluator
from athena_motion.dataset.schema import TOTAL_FEATURE_COUNT

def test_cpu_model_training_and_accuracy():
    trainer = ModelTrainer()
    # Fast training with 60 samples per class
    classifier, metrics, _ = trainer.train_from_synthetic(n_samples_per_class=60, random_state=42)

    assert classifier.is_fitted
    assert metrics["exercise_accuracy"] > 0.85
    assert metrics["form_accuracy"] > 0.75

    # Single-sample prediction
    test_vec = np.random.randn(TOTAL_FEATURE_COUNT).astype(np.float32)
    pred = classifier.predict_frame(test_vec)
    assert isinstance(pred, MotionPrediction)
    assert pred.exercise in classifier.exercise_classes_
    assert pred.form_quality in classifier.form_classes_
    assert 0.0 <= pred.exercise_confidence <= 1.0

def test_cpu_inference_latency():
    trainer = ModelTrainer()
    classifier, _, _ = trainer.train_from_synthetic(n_samples_per_class=25, random_state=42)

    latency_bench = ModelEvaluator.benchmark_latency(classifier, iterations=100, warmup=10)
    # Validate CPU inference latency is reasonable for Python interpreter (< 30ms for pure Python, < 2ms for ONNX)
    assert latency_bench["mean_ms"] < 30.0
    assert latency_bench["fps_capacity"] > 30.0
