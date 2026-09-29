"""
run_detector.py
===============
Interactive CLI runner for real-time webcam or video exercise analysis.

Usage:
    # Run Squat detection on webcam (default is webcam 0)
    python run_detector.py --exercise squat

    # Run Bicep Curl on webcam
    python run_detector.py --exercise bicep_curl

    # Run Lunge or Plank on webcam
    python run_detector.py --exercise lunge
    python run_detector.py --exercise plank

    # Run on a video file
    python run_detector.py --exercise squat --source path/to/video.mp4
"""

import argparse
import sys
import os
import cv2

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from web.server.detection.main import ExerciseDetector


def main():
    parser = argparse.ArgumentParser(description="Live Exercise Detection & Form Correction")
    parser.add_argument(
        "--exercise",
        type=str,
        default="squat",
        choices=["squat", "lunge", "plank", "bicep_curl"],
        help="Exercise to detect: squat, lunge, plank, bicep_curl",
    )
    parser.add_argument(
        "--side",
        type=str,
        default="both",
        choices=["left", "right", "both"],
        help="Target body side for curl or lunge (left, right, both)",
    )
    parser.add_argument(
        "--source",
        type=str,
        default="0",
        help="Webcam device index (0) or path to a video file",
    )
    args = parser.parse_args()

    source = int(args.source) if args.source.isdigit() else args.source
    cap = cv2.VideoCapture(source)

    if not cap.isOpened():
        print(f"❌ Error: Could not open video source: {args.source}")
        sys.exit(1)

    detector = ExerciseDetector(args.exercise)
    current_side = args.side
    if hasattr(detector.engine, "side_mode"):
        detector.engine.side_mode = current_side

    print("=" * 60)
    print(f"🚀 Running {args.exercise.upper()} detector (Side: {current_side.upper()})!")
    print("👉 Press 'q' to quit.")
    print("👉 Press 'c' or 'r' to reset counters.")
    print("👉 Press 'l' for LEFT, 'r' for RIGHT, 'b' for BOTH.")
    print("=" * 60)

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_idx = 0

    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame_idx += 1
            timestamp = round(frame_idx / fps, 2)

            # Process frame with skeleton & HUD drawn
            result = detector.process_frame(frame, timestamp=timestamp, draw=True, side_mode=current_side)

            # Display window
            title = f"AI Exercise Tracker - {args.exercise.upper()} [{current_side.upper()}] (Press 'q' to quit)"
            cv2.imshow(title, frame)

            key = cv2.waitKey(1) & 0xFF
            if key == ord("q"):
                break
            elif key == ord("r") or key == ord("c"):
                detector.reset()
                print("🔄 Counters reset.")
            elif key == ord("l"):
                current_side = "left"
                if hasattr(detector.engine, "side_mode"):
                    detector.engine.side_mode = "left"
                print("👉 Switched to LEFT side")
            elif key == ord("r"):
                current_side = "right"
                if hasattr(detector.engine, "side_mode"):
                    detector.engine.side_mode = "right"
                print("👉 Switched to RIGHT side")
            elif key == ord("b"):
                current_side = "both"
                if hasattr(detector.engine, "side_mode"):
                    detector.engine.side_mode = "both"
                print("👉 Switched to BOTH sides")

    finally:
        cap.release()
        cv2.destroyAllWindows()
        detector.close()
        print("\n✅ Session ended.")


if __name__ == "__main__":
    main()
