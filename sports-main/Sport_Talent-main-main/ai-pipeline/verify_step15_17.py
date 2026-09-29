import os
from fastapi.testclient import TestClient
from api.main import app
from core.motion_exporter import MotionExporter
from core.data_cleaner import CleanedSequence
from core.pose_estimator import PoseResult, LandmarkData
from api.models.request_models import ProcessRequest
from api.models.response_models import VideoMetadata, QualityReport
from core.storage_manager import StorageManager

G = "\033[92m"
R = "\033[91m"
B = "\033[94m"
M = "\033[95m"
C = "\033[0m"

def print_pass(msg):
    print(f"  {G}✅ PASS{C}  {msg}")

def print_fail(msg):
    print(f"  {R}❌ FAIL{C}  {msg}")

def main():
    print(f"\n{M}Verifying Phase 4 (Steps 15-17)…{C}")
    passed = 0
    total = 0
    
    # Setup mock data
    storage = StorageManager()
    session_id = "test_export_session_123"
    session_dir = storage.get_session_paths(session_id).results_dir
    os.makedirs(session_dir, exist_ok=True)
    
    # 1. Mock VideoMetadata
    video_meta = VideoMetadata(
        filename="test.mp4", file_size_bytes=1000, fps=30.0,
        total_frames=10, duration_seconds=0.33, width=640, height=480, codec="H264"
    )
    
    # 2. Mock ProcessRequest
    req = ProcessRequest(
        session_id=session_id,
        athlete_id="athlete_001",
        compute_angles=True
    )
    
    # 3. Mock CleanedSequence
    lm_data = {'left_shoulder': LandmarkData('left_shoulder', 11, 0.5, 0.5, 0.1, 0.9, 0,1,0)}
    f1 = PoseResult(0, 0.0, lm_data, True, 0.9, None, None)
    
    cleaned = CleanedSequence(
        frames=[f1],
        interpolated_frames_count=0,
        smoothed=False
    )
    
    q_reports = [QualityReport(
        overall_score=0.9, is_valid=True, avg_visibility=0.9,
        low_visibility_landmarks=[], missing_critical_landmarks=[], issues=[]
    )]
    
    exporter = MotionExporter(output_dir=session_dir, session_id=session_id)
    
    # --- Test MotionExporter (Steps 15 & 16) ---
    print(f"\n{B}── Steps 15-16: MotionExporter ──{C}")
    try:
        total += 1
        motion_data = exporter.build_motion_data(
            session_id, cleaned, q_reports, video_meta, req, 0.5
        )
        json_path = exporter.export_json(motion_data)
        csv_path = exporter.export_csv(motion_data)
        
        if os.path.exists(json_path) and os.path.exists(csv_path):
            print_pass("JSON and CSV successfully exported to disk")
            passed += 1
        else:
            print_fail("Files not created on disk")
            
        total += 1
        if motion_data.summary.processed_frames == 1 and motion_data.phase5_ready is True:
            print_pass("MotionData constructed correctly (Schema v1.0.0)")
            passed += 1
        else:
            print_fail("MotionData validation failed")
            
    except Exception as e:
        print_fail(f"MotionExporter crashed: {e}")
        
    # --- Test Results API (Step 17) ---
    print(f"\n{B}── Step 17: Results API ──{C}")
    client = TestClient(app)
    
    # 1. GET full JSON
    total += 1
    resp = client.get(f"/api/v1/results/{session_id}")
    if resp.status_code == 200 and resp.json()["session_id"] == session_id:
        print_pass("GET /results/{session_id} -> 200 OK")
        passed += 1
    else:
        print_fail(f"GET full JSON failed: {resp.status_code} - {resp.text}")
        
    # 2. GET summary
    total += 1
    resp = client.get(f"/api/v1/results/{session_id}/summary")
    if resp.status_code == 200 and "processed_frames" in resp.json():
        print_pass("GET /results/{id}/summary -> 200 OK")
        passed += 1
    else:
        print_fail("GET summary failed")
        
    # 3. GET specific frame
    total += 1
    resp = client.get(f"/api/v1/results/{session_id}/frame/0")
    if resp.status_code == 200 and "landmarks" in resp.json():
        print_pass("GET /results/{id}/frame/0 -> 200 OK")
        passed += 1
    else:
        print_fail("GET frame 0 failed")
        
    # 4. GET specific landmark trajectory
    total += 1
    resp = client.get(f"/api/v1/results/{session_id}/landmarks/left_shoulder")
    if resp.status_code == 200 and resp.json()["landmark"] == "left_shoulder":
        print_pass("GET /results/{id}/landmarks/left_shoulder -> 200 OK")
        passed += 1
    else:
        print_fail("GET landmark trajectory failed")
        
    # 5. GET 404 for bad session
    total += 1
    resp = client.get("/api/v1/results/bad_id_123")
    if resp.status_code == 404:
        print_pass("GET /results/bad_id_123 -> 404 Not Found")
        passed += 1
    else:
        print_fail(f"Expected 404 for bad ID, got {resp.status_code}")
        
    # 6. GET download
    total += 1
    resp = client.get(f"/api/v1/results/{session_id}/download?format=csv")
    if resp.status_code == 200 and resp.headers.get("content-type") == "text/csv; charset=utf-8":
        print_pass("GET /results/{id}/download?format=csv -> 200 OK (FileResponse)")
        passed += 1
    else:
        print_fail("GET CSV download failed")
        
    print(f"\n{M}FINAL RESULT{C}")
    print(f"Passed : {passed}/{total}")
    if passed == total:
        print(f"{G}🎉 Phase 4 COMPLETE — JSON Export & Results API verified!{C}\n")
    else:
        print(f"{R}⚠️ Some checks failed.{C}\n")

if __name__ == "__main__":
    main()
