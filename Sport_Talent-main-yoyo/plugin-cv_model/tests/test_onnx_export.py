"""
Unit Tests for ATHENA-MOTION Joblib and ONNX Model Portability.
"""

import os
import pytest
import numpy as np

from athena_motion.models.trainer import ModelTrainer
from athena_motion.models.exporter import ModelExporter, OnnxMotionRunner
from athena_motion.dataset.schema import TOTAL_FEATURE_COUNT

def test_joblib_and_onnx_export_and_inference(tmp_path):
    trainer = ModelTrainer()
    classifier, _, _ = trainer.train_from_synthetic(n_samples_per_class=20, random_state=42)

    # 1. Test Joblib Export & Reload
    joblib_path = str(tmp_path / "test_model.joblib")
    ModelExporter.export_joblib(classifier, joblib_path)
    assert os.path.isfile(joblib_path)

    reloaded = ModelExporter.load_joblib(joblib_path)
    assert reloaded.is_fitted

    test_vec = np.random.randn(TOTAL_FEATURE_COUNT).astype(np.float32)
    pred_orig = classifier.predict_frame(test_vec)
    pred_reloaded = reloaded.predict_frame(test_vec)
    assert pred_orig.exercise == pred_reloaded.exercise

    # 2. Test ONNX Export & ONNX Runtime Inference
    onnx_dir = str(tmp_path / "onnx_export")
    ex_onnx, form_onnx, meta = ModelExporter.export_onnx(classifier, onnx_dir)

    assert os.path.isfile(ex_onnx)
    assert os.path.isfile(form_onnx)
    assert os.path.isfile(meta)

    # Run purely via ONNX Runtime
    runner = OnnxMotionRunner(onnx_dir)
    onnx_pred = runner.predict(test_vec)
    assert onnx_pred.exercise in classifier.exercise_classes_
    assert onnx_pred.form_quality in classifier.form_classes_
