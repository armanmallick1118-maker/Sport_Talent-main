"""
ATHENA-MOTION: Specialized Squat Biomechanics ML Model Trainer.
Trains a high-accuracy, CPU-optimized model specifically for Squat technique evaluation,
fault classification (Knee Valgus, Forward Lean, Incomplete Depth), and exports to Joblib & ONNX.

Usage:
    python train_squats.py
"""

import os
import json
import time
from sklearn.metrics import classification_report, confusion_matrix

from athena_motion import (
    ModelTrainer,
    ModelExporter,
    ModelEvaluator,
    AthenaMotionClassifier
)

def run_squat_training():
    print("="*65)
    print("      ATHENA-MOTION: Training Specialized Squat Form Model")
    print("="*65)

    trainer = ModelTrainer()

    # Train on 400 samples per fault profile = 2,000 total calibrated samples
    t0 = time.time()
    classifier, metrics, dataset = trainer.train_squat_specialist(
        n_samples_per_fault=400,
        random_state=42
    )
    train_time = time.time() - t0

    print(f"\n[INFO] Model training completed in {train_time:.2f} seconds on CPU.")
    print(f"[METRIC] Squat Form Classification Accuracy: {metrics['form_accuracy']*100:.2f}%")
    print(f"[METRIC] Weighted F1-Score: {metrics['form_f1_weighted']:.4f}")

    # Display class breakdown
    print("\n--- Recognized Squat Conditions ---")
    for i, cls_name in enumerate(metrics["form_classes"], 1):
        clean_name = cls_name.replace("_", " ").upper()
        print(f"  {i}. {clean_name}")

    # 1. Export to Joblib
    joblib_path = "assets/models/squat_model.joblib"
    ModelExporter.export_joblib(classifier, joblib_path, metadata=metrics)

    # 2. Export to ONNX for universal portability
    onnx_dir = "assets/models/onnx"
    ex_onnx, form_onnx, meta = ModelExporter.export_onnx(classifier, onnx_dir)

    # 3. Benchmark CPU Latency
    print("\n--- Benchmarking CPU Inference Latency ---")
    latency = ModelEvaluator.benchmark_latency(classifier, iterations=300)
    print(f"Mean CPU Latency: {latency['mean_ms']} ms")
    print(f"Single-Core Throughput: {latency['fps_capacity']} FPS")

    # Save summary report
    report_path = "assets/models/squat_training_report.json"
    with open(report_path, "w") as f:
        json.dump({
            "model_type": "SquatSpecialist_HistGradientBoosting",
            "train_samples": metrics["num_train_samples"],
            "test_samples": metrics["num_test_samples"],
            "accuracy": metrics["form_accuracy"],
            "f1_score": metrics["form_f1_weighted"],
            "latency_ms": latency["mean_ms"],
            "fps_capacity": latency["fps_capacity"],
            "classes": metrics["form_classes"],
            "joblib_artifact": joblib_path,
            "onnx_artifact": form_onnx
        }, f, indent=2)

    print(f"\n[SUCCESS] Squat model trained and saved to:")
    print(f"  -> Joblib: {os.path.abspath(joblib_path)}")
    print(f"  -> ONNX:   {os.path.abspath(form_onnx)}")
    print(f"  -> Report: {os.path.abspath(report_path)}")
    print("="*65 + "\n")

if __name__ == "__main__":
    run_squat_training()
