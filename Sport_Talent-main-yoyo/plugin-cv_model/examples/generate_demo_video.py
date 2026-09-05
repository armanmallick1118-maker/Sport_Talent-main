"""
Utility: Generates a realistic synthetic test video of a person performing squats,
runs it through the ATHENA-MOTION pipeline, and outputs an annotated MP4 with full HUD!
"""

import math
import cv2
import numpy as np
from athena_motion import AthenaMotionPipeline

def create_synthetic_squat_video(filename: str = "demo_squat.mp4", num_frames: int = 120, fps: int = 30):
    width, height = 640, 480
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(filename, fourcc, fps, (width, height))

    print(f"Synthesizing {num_frames} frames of squat motion into {filename}...")

    # Human dimensions
    base_head_y = 90
    base_shoulder_y = 150
    base_hip_y = 270
    knee_y = 360
    ankle_y = 440

    for i in range(num_frames):
        frame = np.ones((height, width, 3), dtype=np.uint8) * 230 # Light grey background

        # Squat motion cycle (descends to parallel then ascends)
        cycle = math.sin(i * (2 * math.pi / 60)) # 2 full reps in 120 frames
        depth_offset = int(max(0, cycle) * 75)

        head_y = base_head_y + depth_offset
        shoulder_y = base_shoulder_y + depth_offset
        hip_y = base_hip_y + depth_offset

        # Head
        cv2.circle(frame, (320, head_y), 30, (80, 80, 80), -1)
        # Torso
        cv2.line(frame, (320, shoulder_y), (320, hip_y), (60, 60, 60), 12)
        # Shoulders
        cv2.line(frame, (270, shoulder_y), (370, shoulder_y), (60, 60, 60), 8)
        # Arms
        cv2.line(frame, (270, shoulder_y), (250, shoulder_y + 60), (60, 60, 60), 6)
        cv2.line(frame, (370, shoulder_y), (390, shoulder_y + 60), (60, 60, 60), 6)
        # Left Leg (Hip -> Knee -> Ankle)
        l_knee_x = 260 if depth_offset > 20 else 290
        cv2.line(frame, (300, hip_y), (l_knee_x, knee_y), (60, 60, 60), 10)
        cv2.line(frame, (l_knee_x, knee_y), (270, ankle_y), (60, 60, 60), 10)
        # Right Leg (Hip -> Knee -> Ankle)
        r_knee_x = 380 if depth_offset > 20 else 350
        cv2.line(frame, (340, hip_y), (r_knee_x, knee_y), (60, 60, 60), 10)
        cv2.line(frame, (r_knee_x, knee_y), (370, ankle_y), (60, 60, 60), 10)

        writer.write(frame)

    writer.release()
    print(f"Saved {filename}")

def analyze_demo():
    input_file = "demo_squat.mp4"
    output_file = "analyzed_demo_squat.mp4"
    create_synthetic_squat_video(input_file)

    print("Running ATHENA-MOTION Pipeline on generated video...")
    pipeline = AthenaMotionPipeline()
    summary = pipeline.process_video(input_file, output_path=output_file)
    print("\n--- Pipeline Execution Summary ---")
    print(f"Total Frames: {summary['total_frames_processed']}")
    print(f"Completed Repetitions: {summary['completed_reps']}")
    print(f"Movement Consistency: {summary['consistency_score']}%")
    print(f"Annotated Video Output: {summary['output_video']}")

if __name__ == "__main__":
    analyze_demo()
