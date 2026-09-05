"""
ATHENA-MOTION: Main Entry Point.
High-Precision Real-Time Hand & Arm Kinematics, Arm Fold Detection, and Event Logging.

Features:
    - High-Precision 33 Pose Landmarks + 21 Hand Landmarks per hand
    - Real-Time Arm Fold & Crossed Arms Detection with exact elbow degree readouts
    - Live On-Screen Event Log & Persistent File Logging (logs/motion_events.log & .jsonl)
    - Full-Body Biomechanics, Rep Counter, & Finger Gesture Recognition

Usage:
    python main.py
    python main.py --camera 0
    python main.py --hands-only
"""

import sys
import time
import argparse
import os
from typing import Optional, List, Dict, Any, Tuple
import cv2
import numpy as np


from athena_motion import (
    HandDetector,
    PoseDetector,
    AthenaMotionPipeline,
    PostureEventDetector,
    PostureEvent,
    PostureState,
    MotionEventLogger,
    ExerciseType
)
from athena_motion.dataset.schema import PoseLandmarkIndex

def main():
    parser = argparse.ArgumentParser(description="ATHENA-MOTION: High-Precision Hand & Arm Fold Detector")
    parser.add_argument("--camera", type=int, default=0, help="Webcam device index (default: 0)")
    parser.add_argument("--width", type=int, default=1120, help="Window display width")
    parser.add_argument("--height", type=int, default=630, help="Window display height")
    parser.add_argument("--hands-only", action="store_true", help="Only detect hands (disable body tracking)")
    args = parser.parse_args()

    print("\n" + "="*65)
    print("      ATHENA-MOTION: High-Precision Motion & Arm Fold Detector")
    print("="*65)
    print(f"[INFO] Initializing webcam device {args.camera}...")

    cap = cv2.VideoCapture(args.camera)
    if not cap.isOpened():
        print(f"\n[ERROR] Unable to access camera device {args.camera}.")
        print("[TIP] Try running with '--camera 1' if using an external or secondary camera.")
        sys.exit(1)

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    print("[INFO] Loading High-Precision Hand Landmarker...")
    hand_detector = HandDetector(max_hands=2)

    pipeline = None
    posture_detector = None
    event_logger = MotionEventLogger(log_dir="logs")

    if not args.hands_only:
        squat_model_path = "assets/models/squat_model.joblib"
        has_squat_model = os.path.isfile(squat_model_path)
        print(f"[INFO] Loading Pose Landmarker with {'Specialized Squat Model' if has_squat_model else 'Default Model'}...")
        pipeline = AthenaMotionPipeline(
            model_path=squat_model_path if has_squat_model else None,
            exercise_type=ExerciseType.SQUAT
        )
        posture_detector = PostureEventDetector(debounce_frames=3)

    print("\n[SUCCESS] System Active & Ready!")
    print(">>> SQUAT in front of camera: Tracks Reps, Depth Ratio, Knee Valgus, and Form Quality.")
    print(">>> FOLD YOUR ARMS: Triggers Arm Fold Detection and logs the event.")
    print(">>> Real-time events are saved to: 'logs/motion_events.log'.")
    print(">>> Press 'q' or 'ESC' in the camera window to exit.\n")

    prev_time = time.time()
    fps = 0.0
    last_rep_count = 0

    window_name = "ATHENA-MOTION: Squat & Motion Intelligence"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(window_name, args.width, args.height)

    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret or frame is None:
                print("[WARN] Failed to grab frame from camera.")
                break

            # Natural horizontal webcam mirror
            frame = cv2.flip(frame, 1)

            # Calculate FPS
            current_time = time.time()
            fps = 0.9 * fps + 0.1 * (1.0 / max(current_time - prev_time, 1e-4))
            prev_time = current_time

            canvas = frame.copy()
            posture_state: PostureState = None

            # 1. Pose Tracking, Squat Analysis & Arm Fold Detection
            if pipeline is not None and posture_detector is not None:
                pose_result = pipeline.analyze_frame(frame, render_overlay=True)
                if pose_result.annotated_frame is not None:
                    canvas = pose_result.annotated_frame

                # Check if a new rep was completed
                if pose_result.rep_count > last_rep_count:
                    last_rep_count = pose_result.rep_count
                    from datetime import datetime
                    from athena_motion.biomechanics.event_logger import MotionEvent
                    event_logger._record_event(MotionEvent(
                        timestamp=datetime.now().isoformat(),
                        elapsed_sec=round(time.time() - event_logger.start_time, 2),
                        event_type="REP_COMPLETED",
                        posture="SQUAT",
                        description=f"SQUAT REP #{pose_result.rep_count} COMPLETED ({pose_result.form_quality.replace('_', ' ').upper()})",
                        duration_held_sec=0.0,
                        details={"rep": pose_result.rep_count, "consistency": pose_result.consistency_score}
                    ))

                # Detect Arm Fold / Crossed Arms & Upper Body Posture
                landmarks = pipeline.pose_detector.smoothed_landmarks
                if landmarks is not None:
                    posture_state = posture_detector.detect(landmarks)
                    event_logger.update(posture_state)
                    draw_arm_joint_diagnostics(canvas, landmarks, posture_state)

            # 2. Hand & Finger Gesture Detection
            hands = hand_detector.detect(frame)
            if hands:
                canvas = hand_detector.draw_hands(canvas, hands)

            # 3. Render Unified Top HUD & Live Event Logger Drawer
            canvas = render_unified_hud(canvas, hands, posture_state, event_logger, fps)

            # Display frame
            cv2.imshow(window_name, canvas)

            # Exit key: 'q' or ESC (27)
            key = cv2.waitKey(1) & 0xFF
            if key in [ord('q'), ord('Q'), 27]:
                print("\n[INFO] Exiting ATHENA-MOTION stream...")
                break

    except KeyboardInterrupt:
        print("\n[INFO] Interrupted by user.")
    finally:
        cap.release()
        cv2.destroyAllWindows()
        hand_detector.close()
        if pipeline is not None:
            pipeline.close()
        print(f"[INFO] Camera closed. Event log saved to: '{os.path.abspath(event_logger.txt_log_path)}'")


def draw_arm_joint_diagnostics(canvas: np.ndarray, landmarks: np.ndarray, state: PostureState):
    """Draws high-visibility degree callouts on left and right elbows."""
    h, w, _ = canvas.shape
    idx = PoseLandmarkIndex

    # Left Elbow
    le = landmarks[idx.LEFT_ELBOW]
    if len(le) > 3 and le[3] > 0.4:
        lx, ly = int(le[0] * w), int(le[1] * h)
        l_color = (40, 220, 60) if state.left_elbow_angle < 75 else (220, 180, 40)
        cv2.circle(canvas, (lx, ly), 7, l_color, -1, cv2.LINE_AA)
        cv2.putText(canvas, f"L Elbow: {int(state.left_elbow_angle)} deg", (lx + 12, ly - 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.48, (255, 255, 255), 2, cv2.LINE_AA)

    # Right Elbow
    re = landmarks[idx.RIGHT_ELBOW]
    if len(re) > 3 and re[3] > 0.4:
        rx, ry = int(re[0] * w), int(re[1] * h)
        r_color = (40, 220, 60) if state.right_elbow_angle < 75 else (220, 180, 40)
        cv2.circle(canvas, (rx, ry), 7, r_color, -1, cv2.LINE_AA)
        cv2.putText(canvas, f"R Elbow: {int(state.right_elbow_angle)} deg", (rx - 130, ry - 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.48, (255, 255, 255), 2, cv2.LINE_AA)


def render_unified_hud(
    canvas: np.ndarray,
    hands: list,
    posture_state: Optional[PostureState],
    event_logger: MotionEventLogger,
    fps: float
) -> np.ndarray:
    """Draws HUD header bar, active posture alert banner, and live on-screen event log terminal."""
    h, w, _ = canvas.shape

    # --- 1. Top Header Bar ---
    bar_h = 60
    overlay = canvas.copy()
    cv2.rectangle(overlay, (0, 0), (w, bar_h), (15, 23, 42), -1)
    cv2.addWeighted(overlay, 0.88, canvas, 0.12, 0, canvas)
    cv2.line(canvas, (0, bar_h), (w, bar_h), (50, 75, 105), 1)

    # Logo & FPS
    cv2.putText(canvas, "ATHENA-MOTION", (15, 26), cv2.FONT_HERSHEY_DUPLEX, 0.65, (0, 255, 120), 1, cv2.LINE_AA)
    cv2.putText(canvas, f"FPS: {int(fps)} | PRECISION: HIGH", (15, 48), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (180, 200, 220), 1, cv2.LINE_AA)

    # Hand Telemetry
    if hands:
        h_str = " | ".join([f"{hnd.handedness}: {hnd.gesture}" for hnd in hands])
        cv2.putText(canvas, f"HANDS: {h_str}", (w // 2 - 130, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (0, 220, 255), 2, cv2.LINE_AA)
    else:
        cv2.putText(canvas, "HANDS: In Frame", (w // 2 - 90, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (140, 160, 180), 1, cv2.LINE_AA)

    # Upper Body Status
    posture_desc = posture_state.description if posture_state else "READY"
    is_notable = posture_state and posture_state.active_posture != PostureEvent.NORMAL
    p_color = (0, 255, 200) if is_notable else (200, 215, 230)
    cv2.putText(canvas, f"POSTURE: {posture_desc}", (w // 2 - 130, 48), cv2.FONT_HERSHEY_SIMPLEX, 0.48, p_color, 1, cv2.LINE_AA)

    cv2.putText(canvas, "Press 'Q' to exit", (w - 145, 36), cv2.FONT_HERSHEY_SIMPLEX, 0.44, (200, 210, 225), 1, cv2.LINE_AA)

    # --- 2. Prominent Alert Banner if Arm Folded ---
    if is_notable:
        alert_h = 38
        y_top = bar_h + 8
        cv2.rectangle(overlay, (w // 4, y_top), (3 * w // 4, y_top + alert_h), (20, 80, 30), -1)
        cv2.addWeighted(overlay, 0.85, canvas, 0.15, 0, canvas)
        cv2.rectangle(canvas, (w // 4, y_top), (3 * w // 4, y_top + alert_h), (50, 220, 80), 2)
        alert_msg = f">> {posture_state.description} <<"
        (tw, _), _ = cv2.getTextSize(alert_msg, cv2.FONT_HERSHEY_DUPLEX, 0.6, 2)
        cv2.putText(canvas, alert_msg, (w // 2 - tw // 2, y_top + 26), cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 255, 255), 2, cv2.LINE_AA)

    # --- 3. Live On-Screen Event Log Drawer (Bottom Right) ---
    log_lines = event_logger.get_hud_log_lines()
    if log_lines:
        box_w = 460
        box_h = 24 + len(log_lines) * 22
        bx1 = w - box_w - 15
        by1 = h - box_h - 15
        bx2 = w - 15
        by2 = h - 15

        # Dark glass container
        cv2.rectangle(overlay, (bx1, by1), (bx2, by2), (10, 15, 26), -1)
        cv2.addWeighted(overlay, 0.85, canvas, 0.15, 0, canvas)
        cv2.rectangle(canvas, (bx1, by1), (bx2, by2), (40, 60, 90), 1)

        # Log Header
        cv2.putText(canvas, "LIVE KINEMATIC EVENT LOG", (bx1 + 10, by1 + 16),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 255, 120), 1, cv2.LINE_AA)

        # Log rows
        for i, line in enumerate(log_lines):
            row_y = by1 + 38 + i * 22
            color = (80, 240, 120) if "TRIGGER" in line else (200, 210, 225)
            cv2.putText(canvas, line[:54], (bx1 + 10, row_y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.38, color, 1, cv2.LINE_AA)

    return canvas


if __name__ == "__main__":
    main()
