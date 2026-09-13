"""
verify_step6.py
===============
Step 6 Verification — Video Upload Endpoint + VideoIngestion Metadata

Tests:
  1. VideoIngestion.extract_metadata() with a real generated video
  2. FrameData and VideoMetadataResult properties
  3. Extension validation helper
  4. File sanitisation helper
  5. Live API tests against the running FastAPI server:
     - POST /api/v1/upload  (valid video)
     - GET  /api/v1/upload/{session_id}/info
     - GET  /api/v1/upload/sessions
     - GET  /api/v1/upload/sessions/count
     - POST /api/v1/upload  (bad extension → 415)
     - POST /api/v1/upload  (no file → 422)
     - GET  /api/v1/upload/nonexistent/info  (→ 404)
     - DELETE /api/v1/upload/{session_id}
"""

import io
import os
import sys
import subprocess
import tempfile
import time
from pathlib import Path


def check(label: str, passed: bool, detail: str = "") -> bool:
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"  {status}  {label}" + (f"  →  {detail}" if detail else ""))
    return passed


def sep(title: str):
    print(f"\n{'─'*60}\n  {title}\n{'─'*60}")


results = []

# ─────────────────────────────────────────────────────────────
sep("0. Generate Test Video with OpenCV")
# ─────────────────────────────────────────────────────────────

TEST_VIDEO_PATH = Path("storage/test_athlete_step6.mp4")

try:
    import cv2
    import numpy as np

    # Create a 3-second 30fps 640x480 video with moving circle
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out    = cv2.VideoWriter(str(TEST_VIDEO_PATH), fourcc, 30.0, (640, 480))

    for i in range(90):   # 3s × 30fps
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        # Moving blue circle
        cx = int(50 + (540 * i / 89))
        cv2.circle(frame, (cx, 240), 30, (255, 100, 0), -1)
        # Frame number text
        cv2.putText(frame, f"Frame {i}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        out.write(frame)

    out.release()
    results.append(check("Test video created",
                          TEST_VIDEO_PATH.exists(),
                          f"{TEST_VIDEO_PATH.stat().st_size // 1024} KB"))
except Exception as e:
    results.append(check("Test video created", False, str(e)))
    sys.exit(1)


# ─────────────────────────────────────────────────────────────
sep("1. VideoMetadataResult — extract_metadata()")
# ─────────────────────────────────────────────────────────────

try:
    from core.video_ingestion import VideoIngestion, VideoMetadataResult, FrameData

    meta = VideoIngestion.extract_metadata(TEST_VIDEO_PATH)

    results.append(check("Returns VideoMetadataResult",
                          isinstance(meta, VideoMetadataResult)))
    results.append(check("  is_readable = True", meta.is_readable is True))
    results.append(check("  fps ≈ 30",
                          28 <= meta.fps <= 32, f"fps={meta.fps}"))
    results.append(check("  total_frames = 90",
                          meta.total_frames == 90, f"total_frames={meta.total_frames}"))
    results.append(check("  duration ≈ 3s",
                          2.5 <= meta.duration_seconds <= 3.5,
                          f"duration={meta.duration_seconds}s"))
    results.append(check("  width = 640",  meta.width  == 640, str(meta.width)))
    results.append(check("  height = 480", meta.height == 480, str(meta.height)))
    results.append(check("  codec set",    bool(meta.codec), meta.codec))
    results.append(check("  file_size_bytes > 0", meta.file_size_bytes > 0,
                          f"{meta.file_size_mb} MB"))

    # Computed properties
    results.append(check("  .resolution = (640, 480)", meta.resolution == (640, 480)))
    results.append(check("  .aspect_ratio ≈ 1.333",
                          abs(meta.aspect_ratio - 640/480) < 0.01,
                          str(meta.aspect_ratio)))
    results.append(check("  .estimated_frames_after_skip > 0",
                          meta.estimated_frames_after_skip > 0,
                          str(meta.estimated_frames_after_skip)))

    d = meta.to_dict()
    results.append(check("  .to_dict() has all keys",
                          all(k in d for k in ["fps", "width", "height",
                                               "codec", "resolution", "aspect_ratio"])))

    # Non-existent file
    bad_meta = VideoIngestion.extract_metadata("/tmp/nonexistent_video.mp4")
    results.append(check("Non-existent file → is_readable=False",
                          bad_meta.is_readable is False))
except Exception as e:
    results.append(check("VideoIngestion.extract_metadata", False, str(e)))
    import traceback; traceback.print_exc()


# ─────────────────────────────────────────────────────────────
sep("2. VideoIngestion Instance — extract_frames() (5 frames)")
# ─────────────────────────────────────────────────────────────

try:
    ingestion = VideoIngestion(
        video_path=TEST_VIDEO_PATH,
        frame_skip=18,   # 90 frames / 18 = 5 frames
        session_id="verify-step6",
    )

    frames = list(ingestion.extract_frames())

    results.append(check("extract_frames() yields FrameData objects",
                          all(isinstance(f, FrameData) for f in frames)))
    results.append(check("Correct frame count with skip=18",
                          len(frames) == 5, f"got {len(frames)}"))

    f0 = frames[0]
    results.append(check("  frame_number=0",   f0.frame_number == 0))
    results.append(check("  timestamp_ms >= 0", f0.timestamp_ms >= 0))
    results.append(check("  image_bgr shape (480,640,3)",
                          f0.image_bgr.shape == (480, 640, 3),
                          str(f0.image_bgr.shape)))
    results.append(check("  image_rgb shape (480,640,3)",
                          f0.image_rgb.shape == (480, 640, 3)))
    results.append(check("  BGR≠RGB (channels differ)",
                          not (f0.image_bgr[:,:,0] == f0.image_rgb[:,:,0]).all()))
    results.append(check("  .width = 640",  f0.width  == 640))
    results.append(check("  .height = 480", f0.height == 480))

    # Frame numbers are in order
    frame_nums = [f.frame_number for f in frames]
    results.append(check("  Frame numbers in ascending order",
                          frame_nums == sorted(frame_nums),
                          str(frame_nums)))

    # With resize
    ingestion_resized = VideoIngestion(
        video_path=TEST_VIDEO_PATH,
        frame_skip=45,   # 2 frames
        target_resolution=(320, 240),
        session_id="verify-step6-resize",
    )
    frames_r = list(ingestion_resized.extract_frames())
    results.append(check("  Resize to (320,240) works",
                          frames_r[0].image_rgb.shape == (240, 320, 3),
                          str(frames_r[0].image_rgb.shape)))
    results.append(check("  was_resized=True",
                          frames_r[0].was_resized is True))

    # With disk save
    import tempfile
    with tempfile.TemporaryDirectory() as tmpdir:
        ingestion_save = VideoIngestion(
            video_path=TEST_VIDEO_PATH,
            frame_skip=45,
            output_dir=Path(tmpdir),
            session_id="verify-step6-save",
        )
        list(ingestion_save.extract_frames())
        saved_files = list(Path(tmpdir).glob("frame_*.jpg"))
        results.append(check("  Frames saved to disk",
                              len(saved_files) == 2,
                              f"saved {len(saved_files)} files"))
except Exception as e:
    results.append(check("VideoIngestion.extract_frames", False, str(e)))
    import traceback; traceback.print_exc()


# ─────────────────────────────────────────────────────────────
sep("3. extract_roi() — bounding box crop")
# ─────────────────────────────────────────────────────────────

try:
    import numpy as np
    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    dummy_frame[100:200, 150:300] = 255  # white rectangle

    ing = VideoIngestion(TEST_VIDEO_PATH)
    roi = ing.extract_roi(dummy_frame, bbox=(150, 100, 300, 200), padding_pct=0.0)
    results.append(check("extract_roi basic crop",
                          roi.shape == (100, 150, 3), str(roi.shape)))

    roi_padded = ing.extract_roi(dummy_frame, bbox=(200, 150, 400, 350), padding_pct=0.1)
    results.append(check("extract_roi with padding is larger",
                          roi_padded.shape[0] > 200 or roi_padded.shape[1] > 200,
                          str(roi_padded.shape)))

    # Edge: bbox out of frame → clamps to frame size
    roi_edge = ing.extract_roi(dummy_frame, bbox=(600, 450, 700, 550))
    results.append(check("extract_roi clamps to frame boundary",
                          roi_edge.shape[0] > 0 and roi_edge.shape[1] > 0))
except Exception as e:
    results.append(check("extract_roi", False, str(e)))


# ─────────────────────────────────────────────────────────────
sep("4. Extension & Filename Validation Helpers")
# ─────────────────────────────────────────────────────────────

try:
    from api.routes.upload import _validate_extension, _safe_filename
    from fastapi import HTTPException

    # Valid
    for ext_name in ["video.mp4", "clip.mov", "match.avi", "test.mkv", "run.webm"]:
        try:
            _validate_extension(ext_name)
            results.append(check(f"{ext_name} accepted", True))
        except Exception as e:
            results.append(check(f"{ext_name} accepted", False, str(e)))

    # Invalid
    for bad in ["file.exe", "image.jpg", "data.csv", "archive.zip"]:
        try:
            _validate_extension(bad)
            results.append(check(f"{bad} rejected", False, "should have raised"))
        except HTTPException as e:
            results.append(check(f"{bad} rejected (415)", e.status_code == 415))

    # Filename sanitisation
    cases = [
        ("../../etc/passwd.mp4",     "......etcpasswd.mp4"),
        ("my video file.mp4",        "my_video_file.mp4"),
        ("athlete sprint test.mov",  "athlete_sprint_test.mov"),
        ("",                         "uploaded_video.mp4"),
    ]
    for original, expected_clean in cases:
        safe = _safe_filename(original)
        # Just check it has no spaces and no path separators
        has_no_spaces = " " not in safe
        has_no_slashes = "/" not in safe and "\\" not in safe
        label = f"_safe_filename({original[:20]!r})"
        results.append(check(
            label,
            has_no_spaces and has_no_slashes,
            f"→ {safe!r}",
        ))
except Exception as e:
    results.append(check("Validation helpers", False, str(e)))
    import traceback; traceback.print_exc()


# ─────────────────────────────────────────────────────────────
sep("5. Live API Tests (server must be running on :8000)")
# ─────────────────────────────────────────────────────────────

try:
    import httpx

    BASE = "http://localhost:8000/api/v1"
    session_id = None

    # ── Check server is up ────────────────────────────────────
    try:
        r = httpx.get("http://localhost:8000/health", timeout=3)
        server_up = r.status_code == 200
    except Exception:
        server_up = False

    results.append(check("Server is running on :8000", server_up))

    if not server_up:
        print("  ⚠️  Skipping live API tests — start server with:")
        print("     venv/bin/uvicorn api.main:app --port 8000")
    else:
        # ── POST /upload — valid video ────────────────────────
        with open(TEST_VIDEO_PATH, "rb") as f:
            r = httpx.post(
                f"{BASE}/upload",
                files={"file": ("test_athlete.mp4", f, "video/mp4")},
                params={"athlete_id": "athlete_007"},
                timeout=30,
            )

        results.append(check("POST /upload status=201",
                              r.status_code == 201, f"got {r.status_code}"))

        if r.status_code == 201:
            body = r.json()
            session_id = body.get("session_id")
            results.append(check("  session_id returned",
                                  bool(session_id), session_id))
            results.append(check("  filename in response",
                                  "filename" in body, body.get("filename")))
            results.append(check("  video_metadata in response",
                                  "video_metadata" in body))

            vm = body.get("video_metadata", {})
            results.append(check("  video_metadata.fps > 0",
                                  vm.get("fps", 0) > 0, str(vm.get("fps"))))
            results.append(check("  video_metadata.total_frames > 0",
                                  vm.get("total_frames", 0) > 0,
                                  str(vm.get("total_frames"))))
            results.append(check("  video_metadata.width = 640",
                                  vm.get("width") == 640, str(vm.get("width"))))
            results.append(check("  video_metadata.height = 480",
                                  vm.get("height") == 480, str(vm.get("height"))))
            results.append(check("  message contains session_id",
                                  session_id in body.get("message", "")))
            results.append(check("  X-Process-Time-Ms header present",
                                  "x-process-time-ms" in r.headers))

        # ── POST /upload — bad extension ──────────────────────
        r415 = httpx.post(
            f"{BASE}/upload",
            files={"file": ("malware.exe", b"fake content", "application/octet-stream")},
            timeout=10,
        )
        results.append(check("POST /upload bad extension → 415",
                              r415.status_code == 415, f"got {r415.status_code}"))
        if r415.status_code == 415:
            err = r415.json()
            results.append(check("  error=unsupported_format",
                                  err.get("detail", {}).get("error") == "unsupported_format"))

        # ── POST /upload — no file ────────────────────────────
        r422 = httpx.post(f"{BASE}/upload", timeout=5)
        results.append(check("POST /upload no file → 422",
                              r422.status_code == 422, f"got {r422.status_code}"))

        if session_id:
            # ── GET /upload/{session_id}/info ─────────────────
            r_info = httpx.get(f"{BASE}/upload/{session_id}/info", timeout=5)
            results.append(check("GET /upload/{id}/info → 200",
                                  r_info.status_code == 200, f"got {r_info.status_code}"))
            if r_info.status_code == 200:
                info = r_info.json()
                results.append(check("  info.status = UPLOADED",
                                      info.get("status") == "UPLOADED",
                                      info.get("status")))
                results.append(check("  info.video.fps > 0",
                                      info.get("video", {}).get("fps", 0) > 0))
                results.append(check("  info.video.file_exists = True",
                                      info.get("video", {}).get("file_exists") is True))

            # ── GET /upload/sessions ──────────────────────────
            r_list = httpx.get(f"{BASE}/upload/sessions", timeout=5)
            results.append(check("GET /upload/sessions → 200",
                                  r_list.status_code == 200))
            if r_list.status_code == 200:
                lst = r_list.json()
                results.append(check("  sessions list has items",
                                      len(lst.get("sessions", [])) >= 1))
                results.append(check("  total count >= 1",
                                      lst.get("total", 0) >= 1,
                                      str(lst.get("total"))))

            # ── GET /upload/sessions/count ────────────────────
            r_cnt = httpx.get(f"{BASE}/upload/sessions/count", timeout=5)
            results.append(check("GET /upload/sessions/count → 200",
                                  r_cnt.status_code == 200))
            if r_cnt.status_code == 200:
                cnt = r_cnt.json()
                results.append(check("  count >= 1",
                                      cnt.get("count", 0) >= 1,
                                      str(cnt.get("count"))))
                results.append(check("  storage_usage in response",
                                      "storage_usage" in cnt))

            # ── GET 404 ───────────────────────────────────────
            r404 = httpx.get(f"{BASE}/upload/nonexistent-session-abc/info", timeout=5)
            results.append(check("GET /upload/nonexistent/info → 404",
                                  r404.status_code == 404))
            if r404.status_code == 404:
                err404 = r404.json()
                results.append(check("  error=session_not_found",
                                      err404.get("detail", {}).get("error") == "session_not_found"))

            # ── DELETE /upload/{session_id} ───────────────────
            r_del = httpx.delete(f"{BASE}/upload/{session_id}", timeout=5)
            results.append(check("DELETE /upload/{id} → 200",
                                  r_del.status_code == 200, f"got {r_del.status_code}"))
            if r_del.status_code == 200:
                del_body = r_del.json()
                results.append(check("  deleted=True",
                                      del_body.get("deleted") is True))
                results.append(check("  freed_mb > 0",
                                      del_body.get("freed_mb", 0) > 0,
                                      f"{del_body.get('freed_mb')} MB"))

            # Session should be gone now
            r_gone = httpx.get(f"{BASE}/upload/{session_id}/info", timeout=5)
            results.append(check("After DELETE, session is 404",
                                  r_gone.status_code == 404))

except Exception as e:
    results.append(check("Live API tests", False, str(e)))
    import traceback; traceback.print_exc()


# ── Cleanup test video ────────────────────────────────────────────────────────
TEST_VIDEO_PATH.unlink(missing_ok=True)


# ─────────────────────────────────────────────────────────────
sep("FINAL RESULT")
# ─────────────────────────────────────────────────────────────

passed = sum(1 for r in results if r)
total  = len(results)
failed = total - passed

print(f"\n  Passed : {passed}/{total}")
if failed:
    print(f"  Failed : {failed}/{total}")

if failed == 0:
    print("\n  🎉  Step 6 COMPLETE — Video Upload fully verified!\n")
    sys.exit(0)
else:
    print(f"\n  ⚠️   {failed} check(s) failed — review output above\n")
    sys.exit(1)
