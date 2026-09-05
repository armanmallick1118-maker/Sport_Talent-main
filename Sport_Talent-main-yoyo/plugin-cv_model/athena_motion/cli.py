"""
ATHENA-MOTION: Command-Line Interface.
Supports video analysis, real-time webcam coaching, CPU model training, and ONNX export.
"""

import argparse
import sys
import os
import json
import cv2

from athena_motion import (
    AthenaMotionPipeline,
    DatasetGenerator,
    ModelTrainer,
    ModelExporter,
    ModelEvaluator,
    ExerciseType
)

def main():
    parser = argparse.ArgumentParser(
        prog="athena-motion",
        description="ATHENA-MOTION: Biomechanical Computer Vision & CPU-Trained ML Pipeline"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Command: train
    train_parser = subparsers.add_parser("train", help="Train the CPU ML model")
    train_parser.add_argument("--samples-per-class", type=int, default=250, help="Synthetic samples per exercise/form class")
    train_parser.add_argument("--output-joblib", type=str, default="assets/models/athena_motion_model.joblib", help="Joblib output path")
    train_parser.add_argument("--export-onnx", type=str, default="assets/models/onnx", help="Directory to export ONNX models")

    # Command: analyze
    analyze_parser = subparsers.add_parser("analyze", help="Analyze a video file")
    analyze_parser.add_argument("--video", type=str, required=True, help="Input video file path")
    analyze_parser.add_argument("--output", type=str, default=None, help="Path to save annotated video output (.mp4)")
    analyze_parser.add_argument("--exercise", type=str, default="squat", help="Target exercise type")
    analyze_parser.add_argument("--stride", type=int, default=1, help="Process every Nth frame")

    # Command: live
    live_parser = subparsers.add_parser("live", help="Launch live webcam motion analyzer")
    live_parser.add_argument("--camera", type=int, default=0, help="Webcam device index (default: 0)")
    live_parser.add_argument("--exercise", type=str, default="squat", help="Target exercise type")

    # Command: benchmark
    bench_parser = subparsers.add_parser("benchmark", help="Benchmark CPU inference latency")
    bench_parser.add_argument("--iterations", type=int, default=500, help="Number of benchmark iterations")

    args = parser.parse_args()

    if args.command == "train":
        print("=== ATHENA-MOTION: Training CPU Machine Learning Model ===")
        trainer = ModelTrainer()
        classifier, metrics, dataset = trainer.train_from_synthetic(n_samples_per_class=args.samples_per_class)

        # Save to Joblib
        ModelExporter.export_joblib(classifier, args.output_joblib, metadata=metrics)

        # Export to ONNX
        if args.export_onnx:
            ModelExporter.export_onnx(classifier, args.export_onnx)

        # Print summary
        print("\n--- Training Results ---")
        print(f"Exercise Classification Accuracy: {metrics['exercise_accuracy']*100:.2f}%")
        print(f"Form Quality Classification Accuracy: {metrics['form_accuracy']*100:.2f}%")
        print(f"Joblib artifact saved to: {args.output_joblib}")
        if args.export_onnx:
            print(f"ONNX artifacts saved to: {args.export_onnx}")

    elif args.command == "analyze":
        print(f"=== ATHENA-MOTION: Analyzing Video {args.video} ===")
        pipeline = AthenaMotionPipeline()
        summary = pipeline.process_video(args.video, output_path=args.output, frame_stride=args.stride)
        print("\n--- Video Analysis Summary ---")
        print(json.dumps(summary, indent=2))

    elif args.command == "live":
        print(f"=== ATHENA-MOTION: Starting Live Webcam Stream (Camera {args.camera}) ===")
        print("Press 'q' to exit the stream window.")
        pipeline = AthenaMotionPipeline()
        cap = cv2.VideoCapture(args.camera)

        if not cap.isOpened():
            print(f"Error: Unable to open webcam index {args.camera}")
            sys.exit(1)

        try:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break

                result = pipeline.analyze_frame(frame, render_overlay=True)
                if result.annotated_frame is not None:
                    cv2.imshow("ATHENA-MOTION Live Telemetry", result.annotated_frame)

                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
        finally:
            cap.release()
            cv2.destroyAllWindows()
            pipeline.close()

    elif args.command == "benchmark":
        print("=== ATHENA-MOTION: Benchmarking CPU Latency ===")
        trainer = ModelTrainer()
        classifier, _, _ = trainer.train_from_synthetic(n_samples_per_class=100)
        results = ModelEvaluator.benchmark_latency(classifier, iterations=args.iterations)
        print("\n--- CPU Latency Results ---")
        print(f"Mean Latency: {results['mean_ms']} ms")
        print(f"Median Latency: {results['median_ms']} ms")
        print(f"P95 Latency: {results['p95_ms']} ms")
        print(f"Estimated Single-Core Capacity: {results['fps_capacity']} FPS")

    else:
        parser.print_help()

if __name__ == "__main__":
    main()
