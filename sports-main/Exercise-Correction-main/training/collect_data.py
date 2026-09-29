"""
training/collect_data.py
========================
Data collection utility for exercise posture analysis.
Extracts MediaPipe Pose landmarks matching the exact feature representation
and column ordering expected by the trained ML models.

Supported exercises:
  - squat (9 landmarks = 36 features)
  - lunge (13 landmarks = 52 features)
  - plank (17 landmarks = 68 features)
  - bicep_curl (9 landmarks = 36 features)

Usage:
  python collect_data.py --exercise squat --label down --source 0 --output squat_down.csv
  python collect_data.py --exercise lunge --label D --source video.mp4 --output lunge_down.csv
"""

import argparse
import csv
import os
import sys
import time
import cv2
import mediapipe as mp
import numpy as np

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

EXERCISE_LANDMARKS = {
    "squat": [
        "NOSE",
        "LEFT_SHOULDER", "RIGHT_SHOULDER",
        "LEFT_HIP", "RIGHT_HIP",
        "LEFT_KNEE", "RIGHT_KNEE",
        "LEFT_ANKLE", "RIGHT_ANKLE",
    ],
    "lunge": [
        "NOSE",
        "LEFT_SHOULDER", "RIGHT_SHOULDER",
        "LEFT_HIP", "RIGHT_HIP",
        "LEFT_KNEE", "RIGHT_KNEE",
        "LEFT_ANKLE", "RIGHT_ANKLE",
        "LEFT_HEEL", "RIGHT_HEEL",
        "LEFT_FOOT_INDEX", "RIGHT_FOOT_INDEX",
    ],
    "plank": [
        "NOSE",
        "LEFT_SHOULDER", "RIGHT_SHOULDER",
        "LEFT_ELBOW", "RIGHT_ELBOW",
        "LEFT_WRIST", "RIGHT_WRIST",
        "LEFT_HIP", "RIGHT_HIP",
        "LEFT_KNEE", "RIGHT_KNEE",
        "LEFT_ANKLE", "RIGHT_ANKLE",
        "LEFT_HEEL", "RIGHT_HEEL",
        "LEFT_FOOT_INDEX", "RIGHT_FOOT_INDEX",
    ],
    "bicep_curl": [
        "NOSE",
        "LEFT_SHOULDER", "RIGHT_SHOULDER",
        "RIGHT_ELBOW", "LEFT_ELBOW",
        "RIGHT_WRIST", "LEFT_WRIST",
        "LEFT_HIP", "RIGHT_HIP",
    ],
}


def get_headers(landmarks: list) -> list:
    """Generate CSV headers: label, lm_x, lm_y, lm_z, lm_v ..."""
    headers = ["label"]
    for lm in landmarks:
        headers.extend([
            f"{lm.lower()}_x",
            f"{lm.lower()}_y",
            f"{lm.lower()}_z",
            f"{lm.lower()}_v",
        ])
    return headers


def extract_features(pose_landmarks, landmarks: list) -> list:
    """Extract flattened x, y, z, visibility in exact landmark order."""
    data = []
    lms = pose_landmarks.landmark
    for lm in landmarks:
        kp = lms[mp_pose.PoseLandmark[lm].value]
        data.extend([kp.x, kp.y, kp.z, kp.visibility])
    return data


def collect(exercise: str, label: str, source: str, output: str, max_samples: int = 1000, delay_sec: int = 3):
    if exercise not in EXERCISE_LANDMARKS:
        print(f"Error: Unsupported exercise '{exercise}'. Choose from: {list(EXERCISE_LANDMARKS.keys())}")
        sys.exit(1)

    landmarks = EXERCISE_LANDMARKS[exercise]
    headers = get_headers(landmarks)

    # Resolve video source (integer index or file path)
    cam_id = int(source) if source.isdigit() else source
    cap = cv2.VideoCapture(cam_id)
    if not cap.isOpened():
        print(f"Error: Unable to open video source: {source}")
        sys.exit(1)

    # Initialize CSV if file doesn't exist
    write_header = not os.path.exists(output)
    csv_file = open(output, mode="a", newline="", encoding="utf-8")
    writer = csv.writer(csv_file)
    if write_header:
        writer.writerow(headers)

    print(f"Starting collection for '{exercise}' with label '{label}' -> {output}")
    print(f"Starting in {delay_sec} seconds... Get into position!")
    time.sleep(delay_sec)

    samples_collected = 0
    paused = False

    with mp_pose.Pose(min_detection_confidence=0.6, min_tracking_confidence=0.6) as pose:
        while cap.isOpened() and samples_collected < max_samples:
            ret, frame = cap.read()
            if not ret:
                break

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            rgb.flags.writeable = False
            results = pose.process(rgb)
            rgb.flags.writeable = True

            # Draw skeleton
            if results.pose_landmarks:
                mp_drawing.draw_landmarks(
                    frame,
                    results.pose_landmarks,
                    mp_pose.POSE_CONNECTIONS,
                    mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2),
                    mp_drawing.DrawingSpec(color=(0, 0, 255), thickness=2, circle_radius=1),
                )

                if not paused:
                    features = extract_features(results.pose_landmarks, landmarks)
                    writer.writerow([label] + features)
                    samples_collected += 1

            # Overlay info
            status_text = "PAUSED (press 'p' to resume)" if paused else f"Collecting: {samples_collected}/{max_samples}"
            color = (0, 0, 255) if paused else (0, 255, 0)
            cv2.putText(frame, f"Exercise: {exercise} | Label: {label}", (15, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.putText(frame, status_text, (15, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
            cv2.putText(frame, "Keys: [p] Pause/Resume, [q] Quit", (15, frame.shape[0] - 20),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

            cv2.imshow(f"Data Collection - {exercise}", frame)
            key = cv2.waitKey(1) & 0xFF
            if key == ord("q"):
                print("User stopped collection.")
                break
            elif key == ord("p"):
                paused = not paused

    cap.release()
    cv2.destroyAllWindows()
    csv_file.close()
    print(f"Collection complete! Saved {samples_collected} rows to '{output}'.")


def main():
    parser = argparse.ArgumentParser(description="Collect MediaPipe landmark dataset for exercise analysis.")
    parser.add_argument("--exercise", required=True, choices=["squat", "lunge", "plank", "bicep_curl"],
                        help="Exercise type")
    parser.add_argument("--label", required=True, help="Target class label (e.g. up, down, I, M, D, C, L, H)")
    parser.add_argument("--source", default="0", help="Webcam index (e.g. 0) or video file path")
    parser.add_argument("--output", default="dataset.csv", help="Output CSV path")
    parser.add_argument("--max_samples", type=int, default=1000, help="Maximum number of samples to capture")
    parser.add_argument("--delay", type=int, default=3, help="Countdown delay before capture in seconds")
    args = parser.parse_args()

    collect(args.exercise, args.label, args.source, args.output, args.max_samples, args.delay)


if __name__ == "__main__":
    main()
