"""
Example 02: Live Real-Time Webcam Exercise Coach.
Streams frames from your computer webcam (index 0), runs MediaPipe pose detection,
computes joint angles in real time, and renders kinematic HUD overlays.
"""

import cv2
from athena_motion import AthenaMotionPipeline

def run_webcam():
    pipeline = AthenaMotionPipeline()
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Error: Could not access webcam. Make sure a camera is connected.")
        return

    print("ATHENA-MOTION Live Coach Active.")
    print("Press 'q' in the video window to stop.")

    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # Process frame through Athena-Motion pipeline
            result = pipeline.analyze_frame(frame, render_overlay=True)

            # Display annotated output with HUD
            if result.annotated_frame is not None:
                cv2.imshow("ATHENA-MOTION: Real-Time Biomechanics HUD", result.annotated_frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
    finally:
        cap.release()
        cv2.destroyAllWindows()
        pipeline.close()

if __name__ == "__main__":
    run_webcam()
