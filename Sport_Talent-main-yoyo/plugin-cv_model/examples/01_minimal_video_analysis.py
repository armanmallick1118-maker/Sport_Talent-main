"""
Example 01: Minimal Video Analysis with ATHENA-MOTION.
Demonstrates analyzing an exercise video and exporting an annotated video with full HUD in ~10 lines.
"""

from athena_motion import AthenaMotionPipeline

def main():
    # 1. Initialize reusable pipeline
    pipeline = AthenaMotionPipeline()

    # 2. Process a video file
    video_input = "sample_squat.mp4"
    video_output = "analyzed_squat.mp4"

    print(f"Analyzing {video_input}...")
    # Note: In your project, replace 'sample_squat.mp4' with any valid video file path
    try:
        summary = pipeline.process_video(
            input_path=video_input,
            output_path=video_output,
            frame_stride=1
        )
        print("Analysis Complete!")
        print(f"Completed Repetitions: {summary['completed_reps']}")
        print(f"Movement Consistency: {summary['consistency_score']}%")
        print(f"Form Faults Encountered: {summary['form_fault_distribution']}")
    except FileNotFoundError:
        print(f"Sample video '{video_input}' not found. You can run this with any MP4 video.")

if __name__ == "__main__":
    main()
