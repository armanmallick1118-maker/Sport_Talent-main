"""
Example 03: Standalone ONNX Model Export & Inference.
Demonstrates training a model, exporting it to ONNX, and running inference
purely via ONNX Runtime with zero scikit-learn dependency for universal portability.
"""

import os
import numpy as np
from athena_motion import ModelTrainer, ModelExporter, OnnxMotionRunner, TOTAL_FEATURE_COUNT

def main():
    print("=== 1. Train CPU Model on Biomechanical Synthetic Dataset ===")
    trainer = ModelTrainer()
    classifier, metrics, _ = trainer.train_from_synthetic(n_samples_per_class=150)

    print(f"Trained model with exercise acc: {metrics['exercise_accuracy']*100:.1f}%")

    print("\n=== 2. Export to Universal ONNX Format ===")
    export_dir = "assets/models/onnx"
    ex_path, form_path, meta_path = ModelExporter.export_onnx(classifier, export_dir)
    print(f"Exercise ONNX model: {ex_path}")
    print(f"Form ONNX model: {form_path}")
    print(f"Metadata Specification: {meta_path}")

    print("\n=== 3. Load & Run Inferences via Standalone ONNX Runtime ===")
    # This runner has NO scikit-learn dependency!
    onnx_runner = OnnxMotionRunner(export_dir)

    # Test sample vector
    sample_feature_vector = np.random.randn(TOTAL_FEATURE_COUNT).astype(np.float32)
    prediction = onnx_runner.predict(sample_feature_vector)

    print("\n=== ONNX Prediction Result ===")
    print(f"Predicted Exercise: {prediction.exercise} (Confidence: {prediction.exercise_confidence})")
    print(f"Predicted Form: {prediction.form_quality} (Confidence: {prediction.form_confidence})")
    print(f"Actionable Coaching Cue: {prediction.feedback_cue}")
    print("\nSuccess! This ONNX model can now be dropped into any Node.js, C++, or mobile app.")

if __name__ == "__main__":
    main()
