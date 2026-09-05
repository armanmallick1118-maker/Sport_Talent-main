import os
import cv2
import numpy as np
import json
from fastapi.testclient import TestClient

from api.main import app
from core.storage_manager import StorageManager
from core.visualizer import Visualizer
from api.models.response_models import MotionData

G = "\033[92m"
R = "\033[91m"
B = "\033[94m"
M = "\033[95m"
C = "\033[0m"

def print_pass(msg):
    print(f"  {G}✅ PASS{C}  {msg}")

def print_fail(msg):
    print(f"  {R}❌ FAIL{C}  {msg}")

def create_dummy_video(path: str, num_frames: int = 10, fps: int = 30):
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(path, fourcc, fps, (640, 480))
    for i in range(num_frames):
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        # Put some text to make it obvious
        cv2.putText(frame, f"Frame {i}", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        out.write(frame)
    out.release()

def create_mock_motion_data(path: str, fps: float = 30.0):
    data = {
        "schema_version": "1.0.0",
        "session_id": "test_viz_123",
        "athlete_id": "mock_athlete",
        "created_at": "2026-08-21T00:00:00Z",
        "video_metadata": {
            "filename": "dummy.mp4",
            "file_size_bytes": 1000,
            "fps": fps,
            "total_frames": 10,
            "duration_seconds": 10 / fps,
            "width": 640,
            "height": 480,
            "codec": "H264"
        },
        "processing_config": {
            "frame_skip": 0, "model_complexity": 0, "min_detection_confidence": 0.5,
            "min_tracking_confidence": 0.5, "smooth_landmarks": False, "enable_segmentation": False,
            "detection_confidence": 0.5, "interpolation_method": "linear", "smoothing_window": 3,
            "smoothing_polyorder": 1, "outlier_std_threshold": 3.0, "quality_min_score": 0.4,
            "compute_angles": True
        },
        "summary": {
            "total_input_frames": 10, "processed_frames": 10, "valid_frames": 10,
            "dropped_frames": [], "interpolated_frames": [], "avg_quality_score": 0.9,
            "min_quality_score": 0.8, "max_quality_score": 1.0, "avg_detection_confidence": 0.9,
            "landmarks_tracked": 33, "angles_computed": 12, "processing_time_seconds": 1.0,
            "frames_per_second_throughput": 10.0
        },
        "frames": [
            {
                "frame_number": i,
                "timestamp_ms": (i / fps) * 1000,
                "has_pose": True,
                "is_interpolated": False,
                "is_smoothed": False,
                "person_bbox": [100.0, 100.0, 300.0, 400.0],
                "detection_confidence": 0.9,
                "quality": {
                    "overall_score": 0.9, "is_valid": True, "avg_visibility": 0.9,
                    "low_visibility_landmarks": [], "missing_critical_landmarks": [], "issues": []
                },
                "landmarks": {
                    "left_shoulder": {"x": 0.4, "y": 0.3, "z": 0.0, "visibility": 0.9, "world_x": 0.0, "world_y": 0.0, "world_z": 0.0},
                    "right_shoulder": {"x": 0.6, "y": 0.3, "z": 0.0, "visibility": 0.9, "world_x": 0.0, "world_y": 0.0, "world_z": 0.0},
                    "left_elbow": {"x": 0.3, "y": 0.5, "z": 0.0, "visibility": 0.9, "world_x": 0.0, "world_y": 0.0, "world_z": 0.0}
                },
                "joint_angles": {
                    "left_elbow_angle": 120.0
                }
            } for i in range(10)
        ],
        "phase5_ready": True
    }
    with open(path, "w") as f:
        json.dump(data, f)
    return data

def main():
    print(f"\n{M}Verifying Phase 5 (Steps 18-21)…{C}")
    passed = 0
    total = 0
    
    session_id = "test_viz_123"
    storage = StorageManager()
    paths = storage.get_session_paths(session_id)
    
    # 1. Setup mock session dir
    os.makedirs(paths.upload_dir, exist_ok=True)
    os.makedirs(paths.results_dir, exist_ok=True)
    os.makedirs(paths.viz_dir, exist_ok=True)
    
    source_video = os.path.join(paths.upload_dir, "dummy.mp4")
    create_dummy_video(source_video, num_frames=10, fps=15)
    
    motion_data_dict = create_mock_motion_data(paths.motion_json, fps=15.0)
    motion_data = MotionData(**motion_data_dict)
    
    # --- Test Visualizer directly ---
    print(f"\n{B}── Steps 18-20: Skeleton Drawer, HUD, & Video Generator ──{C}")
    try:
        viz = Visualizer(session_id)
        mp4_path, gif_path = viz.generate_video(source_video, paths.viz_dir, motion_data)
        
        total += 1
        if os.path.exists(mp4_path) and os.path.getsize(mp4_path) > 1000:
            print_pass("skeleton_overlay.mp4 successfully generated")
            passed += 1
        else:
            print_fail("Failed to generate valid MP4")
            
        total += 1
        if os.path.exists(gif_path) and os.path.getsize(gif_path) > 1000:
            print_pass("preview.gif successfully generated")
            passed += 1
        else:
            print_fail("Failed to generate valid GIF")
            
    except Exception as e:
        print_fail(f"Visualizer crashed: {e}")
        
    # --- Test Visualization API ---
    print(f"\n{B}── Step 21: Visualization API ──{C}")
    client = TestClient(app)
    
    # 1. POST /generate
    total += 1
    resp = client.post(f"/api/v1/visualize/{session_id}/generate")
    if resp.status_code == 200:
        print_pass("POST /visualize/{id}/generate -> 200 OK (Background Task Started)")
        passed += 1
    else:
        print_fail(f"POST generate failed: {resp.status_code}")
        
    # 2. GET video
    total += 1
    resp = client.get(f"/api/v1/visualize/{session_id}/video")
    if resp.status_code == 200 and resp.headers.get("content-type") == "video/mp4":
        print_pass("GET /visualize/{id}/video -> 200 OK (FileResponse)")
        passed += 1
    else:
        print_fail("GET video failed")
        
    # 3. GET gif
    total += 1
    resp = client.get(f"/api/v1/visualize/{session_id}/gif")
    if resp.status_code == 200 and resp.headers.get("content-type") == "image/gif":
        print_pass("GET /visualize/{id}/gif -> 200 OK (FileResponse)")
        passed += 1
    else:
        print_fail("GET gif failed")
        
    print(f"\n{M}FINAL RESULT{C}")
    print(f"Passed : {passed}/{total}")
    if passed == total:
        print(f"{G}🎉 Phase 5 COMPLETE — Visualizer & API verified!{C}\n")
    else:
        print(f"{R}⚠️ Some checks failed.{C}\n")

if __name__ == "__main__":
    main()
