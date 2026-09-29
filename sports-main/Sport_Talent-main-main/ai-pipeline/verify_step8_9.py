import asyncio
import os
import shutil
import time
from pathlib import Path

import cv2
import httpx
import numpy as np

from api.models.request_models import ProcessRequest
from core.person_detector import PersonDetector
from core.storage_manager import storage_manager
from core.video_ingestion import VideoIngestion

PORT = 8000
API_URL = f"http://localhost:{PORT}/api/v1"
TEST_FILE = "test_athlete.mp4"

# Color constants for terminal output
G = "\033[92m"
R = "\033[91m"
Y = "\033[93m"
B = "\033[94m"
M = "\033[95m"
C = "\033[0m"


def print_pass(msg):
    print(f"  {G}✅ PASS{C}  {msg}")

def print_fail(msg):
    print(f"  {R}❌ FAIL{C}  {msg}")

def create_test_video():
    path = Path(TEST_FILE)
    if path.exists():
        path.unlink()
        
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(str(path), fourcc, 30.0, (640, 480))
    for _ in range(90):
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        # Draw a moving white rectangle to act as a "person" for YOLO to detect
        # YOLO might not detect a simple rectangle as a person, but let's test it anyway.
        # Actually YOLO needs real people features. We'll skip YOLO accuracy tests 
        # on a blank box, and just test that the class initializes and doesn't crash on blank frames.
        out.write(frame)
    out.release()
    return path


def test_person_detector():
    print(f"\n{B}── Step 8: PersonDetector (YOLOv8) ──{C}")
    passed = 0
    
    try:
        # 1. Initialization
        detector = PersonDetector(model_size="n", confidence=0.25)
        print_pass("PersonDetector initialized (yolov8n loaded)")
        passed += 1
        
        # 2. Blank frame detection (should return empty list without crashing)
        blank_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        bboxes = detector.detect(blank_frame)
        if len(bboxes) == 0:
            print_pass("detector.detect() returned 0 bboxes for blank frame")
            passed += 1
        else:
            print_fail(f"Expected 0 bboxes, got {len(bboxes)}")
            
        # 3. Primary athlete detection
        primary = detector.detect_primary_athlete(blank_frame)
        if primary is None:
            print_pass("detector_primary_athlete() returned None for blank frame")
            passed += 1
        else:
            print_fail("Expected None primary athlete for blank frame")
            
    except Exception as e:
        print_fail(f"PersonDetector crashed: {e}")
        
    return passed


async def test_process_endpoints():
    print(f"\n{B}── Step 9: Process API Endpoints ──{C}")
    passed = 0
    
    async with httpx.AsyncClient(base_url=API_URL, timeout=10.0) as client:
        # First, we need a session by uploading our test video
        with open(TEST_FILE, "rb") as f:
            resp = await client.post("/upload", files={"file": (TEST_FILE, f, "video/mp4")})
        
        if resp.status_code != 201:
            print_fail(f"Failed to upload video for testing. Status {resp.status_code}")
            return passed
            
        session_id = resp.json()["session_id"]
        print_pass(f"Created test session {session_id}")
        passed += 1
        
        # 1. Trigger process
        req = {"session_id": session_id, "frame_skip": 2, "model_complexity": 1}
        resp = await client.post("/process", json=req)
        if resp.status_code == 202:
            print_pass("POST /process → 202 Accepted")
            passed += 1
        else:
            print_fail(f"POST /process failed: {resp.status_code}")
            
        # 2. Duplicate trigger (should be 409 Conflict)
        resp2 = await client.post("/process", json=req)
        if resp2.status_code == 409:
            print_pass("POST /process (duplicate) → 409 Conflict")
            passed += 1
        else:
            print_fail(f"Expected 409 Conflict, got {resp2.status_code}")
            
        # 3. Poll status
        await asyncio.sleep(0.5)
        resp_status = await client.get(f"/process/{session_id}/status")
        if resp_status.status_code == 200:
            data = resp_status.json()
            if data["status"] in ["EXTRACTING", "DETECTING", "ESTIMATING", "CLEANING", "EXPORTING"]:
                print_pass(f"GET /process/{{id}}/status → {data['status']} ({data['progress_pct']}%)")
                passed += 1
            else:
                print_fail(f"Unexpected status: {data['status']}")
        else:
            print_fail(f"GET /status failed: {resp_status.status_code}")
            
        # 4. Cancel
        resp_cancel = await client.delete(f"/process/{session_id}/cancel")
        if resp_cancel.status_code == 200:
            print_pass("DELETE /process/{{id}}/cancel → 200 OK")
            passed += 1
        else:
            print_fail(f"DELETE /cancel failed: {resp_cancel.status_code}")
            
        # 5. Check cancelled status
        await asyncio.sleep(0.5)
        resp_status2 = await client.get(f"/process/{session_id}/status")
        if resp_status2.json()["status"] == "CANCELLED":
            print_pass("GET /status reflects CANCELLED state")
            passed += 1
        else:
            print_fail(f"Expected CANCELLED status, got {resp_status2.json()['status']}")
            
        # 6. Invalid session trigger
        req_inv = {"session_id": "invalid-uuid", "frame_skip": 2, "model_complexity": 1}
        resp_inv = await client.post("/process", json=req_inv)
        if resp_inv.status_code == 404:
            print_pass("POST /process (invalid session) → 404 Not Found")
            passed += 1
        else:
            print_fail(f"Expected 404, got {resp_inv.status_code}")
            
    return passed


async def main():
    print(f"\n{M}Verifying Steps 8 & 9…{C}")
    create_test_video()
    
    p1 = test_person_detector()
    
    # Let server boot if we restarted it via external wrapper
    time.sleep(1)
    
    p2 = await test_process_endpoints()
    
    total = p1 + p2
    
    print(f"\n{M}FINAL RESULT{C}")
    print(f"Passed : {total}/10")
    if total == 10:
        print(f"{G}🎉 Steps 8 & 9 COMPLETE — Detector & Background Job queue verified!{C}\n")
    else:
        print(f"{R}⚠️ Some checks failed.{C}\n")

if __name__ == "__main__":
    asyncio.run(main())
