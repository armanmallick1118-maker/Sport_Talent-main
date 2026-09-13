import time
import argparse
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.append(str(Path(__file__).parent.parent))

from core.pipeline import MediaPipeline
from api.models.response_models import ProcessRequest
from core.storage_manager import StorageManager

def run_benchmark(video_path: str):
    """
    Runs a performance benchmark on the core MediaPipeline.
    Measures FPS throughput and total time.
    """
    print(f"--- Running Benchmark on {video_path} ---")
    
    if not Path(video_path).exists():
        print(f"Error: Video file {video_path} not found.")
        sys.exit(1)
        
    session_id = f"benchmark_{int(time.time())}"
    storage = StorageManager()
    storage.create_session(session_id)
    storage.update_status(session_id, "UPLOADED")
    
    # Copy video to uploads dir
    video_dest = storage.get_session_paths(session_id).upload_dir / Path(video_path).name
    import shutil
    shutil.copy(video_path, video_dest)
    
    # Setup Pipeline
    config = ProcessRequest(
        session_id=session_id,
        frame_skip=2,  # Process every 2nd frame
        model_complexity=1, # Medium complexity for benchmark
    )
    
    pipeline = MediaPipeline(config)
    
    print("Starting pipeline execution...")
    start_time = time.perf_counter()
    
    def on_progress(frames_done, total_frames, pct):
        if frames_done % 10 == 0:
            print(f"Progress: {frames_done}/{total_frames} ({pct:.1f}%)")
    
    try:
        pipeline.process_session(session_id, progress_cb=on_progress)
    except Exception as e:
        print(f"Pipeline failed: {e}")
        return
        
    end_time = time.perf_counter()
    total_time = end_time - start_time
    
    # Analyze results
    results_dir = storage.get_session_paths(session_id).results_dir
    import json
    with open(results_dir / "motion_data.json", "r") as f:
        data = json.load(f)
        
    total_frames_processed = data.get("processed_frames", 0)
    fps_throughput = total_frames_processed / total_time if total_time > 0 else 0
    
    print("\n--- Benchmark Results ---")
    print(f"Total Time:       {total_time:.2f} seconds")
    print(f"Frames Processed: {total_frames_processed}")
    print(f"FPS Throughput:   {fps_throughput:.2f} frames/sec")
    print("-------------------------")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MediaPipeline Performance Benchmark")
    parser.add_argument("video", help="Path to input video file")
    args = parser.parse_args()
    
    run_benchmark(args.video)
