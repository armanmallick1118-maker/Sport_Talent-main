"""
verify_step5.py
===============
Step 5 Verification — Storage Manager
Tests: imports, session creation, path resolution, metadata CRUD,
path traversal protection, frame listing, cleanup, disk usage,
concurrent thread safety, and JSON atomicity.
"""

import json
import sys
import shutil
import threading
import time
from pathlib import Path


def check(label: str, passed: bool, detail: str = "") -> bool:
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"  {status}  {label}" + (f"  →  {detail}" if detail else ""))
    return passed


def sep(title: str):
    print(f"\n{'─'*60}\n  {title}\n{'─'*60}")


results = []
TEST_SESSION = "test-step5-verify"


# ─────────────────────────────────────────────────────────────
sep("1. Imports")
# ─────────────────────────────────────────────────────────────

try:
    from core.storage_manager import (
        StorageManager, storage_manager,
        SessionPaths, SessionMeta, DiskUsage, SessionInfo,
    )
    results.append(check("storage_manager imports", True))
    results.append(check("storage_manager singleton",
                          isinstance(storage_manager, StorageManager)))
except Exception as e:
    results.append(check("storage_manager imports", False, str(e)))
    sys.exit(1)

try:
    from core import storage_manager as sm2, SessionPaths, SessionMeta
    results.append(check("core.__init__ re-export", True))
except Exception as e:
    results.append(check("core.__init__ re-export", False, str(e)))


# ─────────────────────────────────────────────────────────────
sep("2. Path Resolution (no directories created yet)")
# ─────────────────────────────────────────────────────────────

try:
    paths = storage_manager.get_session_paths(TEST_SESSION)

    results.append(check("Returns SessionPaths",  isinstance(paths, SessionPaths)))
    results.append(check("upload_dir is absolute", paths.upload_dir.is_absolute()))
    results.append(check("frames_dir is absolute", paths.frames_dir.is_absolute()))
    results.append(check("results_dir is absolute", paths.results_dir.is_absolute()))
    results.append(check("viz_dir is absolute",    paths.viz_dir.is_absolute()))
    results.append(check("meta_file under results_dir",
                          paths.meta_file.parent == paths.results_dir))
    results.append(check("motion_json under results_dir",
                          paths.motion_json.parent == paths.results_dir))
    results.append(check("session_log is absolute", paths.session_log.is_absolute()))

    # frame_path helper
    fp = paths.frame_path(42)
    results.append(check(".frame_path(42) = frame_000042.jpg",
                          fp.name == "frame_000042.jpg", fp.name))

    # viz helpers
    vp = paths.viz_3d_path(7)
    results.append(check(".viz_3d_path(7) = 3d_frame_000007.png",
                          vp.name == "3d_frame_000007.png", vp.name))

    vfp = paths.viz_frame_path(99)
    results.append(check(".viz_frame_path(99) = skeleton_frame_000099.png",
                          vfp.name == "skeleton_frame_000099.png", vfp.name))

    # to_dict
    d = paths.to_dict()
    results.append(check(".to_dict() has session_id key", "session_id" in d))
    results.append(check(".to_dict() has 11 keys", len(d) == 11, str(len(d))))

    # session does not exist yet
    results.append(check(".exists() = False before create",
                          paths.exists() is False))
except Exception as e:
    results.append(check("Path resolution", False, str(e)))


# ─────────────────────────────────────────────────────────────
sep("3. Path Traversal Protection")
# ─────────────────────────────────────────────────────────────

bad_ids = ["../etc/passwd", "..\\windows\\system32", "a/b", "a\\b", "~root", ""]
for bad in bad_ids:
    try:
        storage_manager.get_session_paths(bad)
        results.append(check(f"'{bad}' rejected", False, "should have raised ValueError"))
    except ValueError:
        results.append(check(f"Path traversal '{bad[:20]}' rejected", True))


# ─────────────────────────────────────────────────────────────
sep("4. Session Creation")
# ─────────────────────────────────────────────────────────────

try:
    # Clean up any prior test session
    storage_manager.cleanup_session(TEST_SESSION)

    paths = storage_manager.create_session(
        TEST_SESSION,
        original_filename="test_athlete.mp4",
        athlete_id="athlete_test_001",
    )

    results.append(check("create_session returns SessionPaths",
                          isinstance(paths, SessionPaths)))
    results.append(check("upload_dir created",  paths.upload_dir.exists()))
    results.append(check("frames_dir created",  paths.frames_dir.exists()))
    results.append(check("results_dir created", paths.results_dir.exists()))
    results.append(check("viz_dir created",     paths.viz_dir.exists()))
    results.append(check("meta_file created",   paths.meta_file.exists()))
    results.append(check(".exists() = True after create",
                          paths.exists() is True))
    results.append(check("session_exists() = True",
                          storage_manager.session_exists(TEST_SESSION)))
except Exception as e:
    results.append(check("Session creation", False, str(e)))


# ─────────────────────────────────────────────────────────────
sep("5. Session Metadata — Read")
# ─────────────────────────────────────────────────────────────

try:
    meta = storage_manager.read_session_meta(TEST_SESSION)

    results.append(check("read_session_meta returns SessionMeta",
                          isinstance(meta, SessionMeta)))
    results.append(check("  session_id correct", meta.session_id == TEST_SESSION))
    results.append(check("  status = PENDING",   meta.status == "PENDING"))
    results.append(check("  original_filename",  meta.original_filename == "test_athlete.mp4"))
    results.append(check("  athlete_id",         meta.athlete_id == "athlete_test_001"))
    results.append(check("  created_at set",     bool(meta.created_at)))
    results.append(check("  motion_json_exists = False",
                          meta.motion_json_exists is False))
except Exception as e:
    results.append(check("Metadata read", False, str(e)))


# ─────────────────────────────────────────────────────────────
sep("6. Session Metadata — Write & Update")
# ─────────────────────────────────────────────────────────────

try:
    updated = storage_manager.write_session_meta(TEST_SESSION, {
        "fps": 30.0,
        "total_frames": 900,
        "duration_seconds": 30.0,
        "width": 1920,
        "height": 1080,
        "codec": "H264",
    })
    results.append(check("write_session_meta partial update", True))
    results.append(check("  fps = 30.0",          updated.fps == 30.0))
    results.append(check("  total_frames = 900",   updated.total_frames == 900))
    results.append(check("  session_id preserved", updated.session_id == TEST_SESSION))
    results.append(check("  status still PENDING", updated.status == "PENDING"))

    # Update status
    storage_manager.update_status(TEST_SESSION, "EXTRACTING")
    meta2 = storage_manager.read_session_meta(TEST_SESSION)
    results.append(check("update_status to EXTRACTING",
                          meta2.status == "EXTRACTING"))

    storage_manager.update_status(TEST_SESSION, "DONE")
    meta3 = storage_manager.read_session_meta(TEST_SESSION)
    results.append(check("update_status to DONE", meta3.status == "DONE"))

    # Check updated_at changed
    results.append(check("updated_at is set", bool(meta3.updated_at)))
except Exception as e:
    results.append(check("Metadata write/update", False, str(e)))


# ─────────────────────────────────────────────────────────────
sep("7. Frame Management")
# ─────────────────────────────────────────────────────────────

try:
    paths = storage_manager.get_session_paths(TEST_SESSION)

    # Create dummy frame files
    for i in range(10):
        frame_path = paths.frame_path(i)
        frame_path.write_bytes(b"FAKE_JPEG_DATA" * 100)

    frames = storage_manager.list_frames(TEST_SESSION)
    results.append(check("list_frames returns 10 files", len(frames) == 10, str(len(frames))))
    results.append(check("frames are sorted", frames == sorted(frames)))
    results.append(check("frame_count() = 10", storage_manager.frame_count(TEST_SESSION) == 10))
    results.append(check("frame_exists(0) = True",
                          storage_manager.frame_exists(TEST_SESSION, 0)))
    results.append(check("frame_exists(99) = False",
                          not storage_manager.frame_exists(TEST_SESSION, 99)))

    # iter_frames
    enumerated = list(storage_manager.iter_frames(TEST_SESSION))
    results.append(check("iter_frames yields (index, path) tuples",
                          all(isinstance(i, int) and isinstance(p, Path)
                              for i, p in enumerated)))
    results.append(check("iter_frames yields 10 items", len(enumerated) == 10))
except Exception as e:
    results.append(check("Frame management", False, str(e)))


# ─────────────────────────────────────────────────────────────
sep("8. Motion JSON Read/Write")
# ─────────────────────────────────────────────────────────────

try:
    test_data = {
        "schema_version": "1.0.0",
        "session_id": TEST_SESSION,
        "frames": [{"frame_number": 0, "timestamp_ms": 0.0}],
    }
    out_path = storage_manager.write_motion_json(TEST_SESSION, test_data)

    results.append(check("write_motion_json returns path", isinstance(out_path, Path)))
    results.append(check("motion_data.json exists", out_path.exists()))

    read_back = storage_manager.read_motion_json(TEST_SESSION)
    results.append(check("read_motion_json returns dict", isinstance(read_back, dict)))
    results.append(check("  session_id preserved",
                          read_back.get("session_id") == TEST_SESSION))
    results.append(check("  frames preserved",
                          len(read_back.get("frames", [])) == 1))

    results.append(check("results_exist() = True",
                          storage_manager.results_exist(TEST_SESSION)))

    # meta updated
    meta4 = storage_manager.read_session_meta(TEST_SESSION)
    results.append(check("meta.motion_json_exists updated to True",
                          meta4.motion_json_exists is True))
except Exception as e:
    results.append(check("Motion JSON read/write", False, str(e)))


# ─────────────────────────────────────────────────────────────
sep("9. Disk Usage")
# ─────────────────────────────────────────────────────────────

try:
    usage = storage_manager.get_disk_usage(TEST_SESSION)
    results.append(check("get_disk_usage returns DiskUsage", isinstance(usage, DiskUsage)))
    results.append(check("frames_bytes > 0 (we wrote 10 fake frames)",
                          usage.frames_bytes > 0, f"{usage.frames_bytes} bytes"))
    results.append(check("results_bytes > 0 (motion_data.json written)",
                          usage.results_bytes > 0, f"{usage.results_bytes} bytes"))
    results.append(check("total_bytes = sum of parts",
                          usage.total_bytes == (usage.upload_bytes + usage.frames_bytes +
                                                usage.results_bytes + usage.visualizations_bytes)))
    results.append(check(".total_mb property works", usage.total_mb >= 0,
                          f"{usage.total_mb:.3f} MB"))
    results.append(check(".summary() returns string", isinstance(usage.summary(), str),
                          usage.summary()))

    total_usage = storage_manager.get_total_disk_usage()
    results.append(check("get_total_disk_usage() works",
                          isinstance(total_usage, DiskUsage)))

    free = storage_manager.get_free_disk_space()
    results.append(check("get_free_disk_space() > 0", free > 0,
                          f"{free/(1024**3):.1f} GB free"))

    # Disk space check
    ok = storage_manager.check_disk_space(1024)      # need 1KB
    results.append(check("check_disk_space(1KB) = True", ok is True))

    too_much = storage_manager.check_disk_space(10**15)  # need 1 PB
    results.append(check("check_disk_space(1PB) = False", too_much is False))
except Exception as e:
    results.append(check("Disk usage", False, str(e)))


# ─────────────────────────────────────────────────────────────
sep("10. Session Listing")
# ─────────────────────────────────────────────────────────────

try:
    sessions = storage_manager.list_sessions()
    results.append(check("list_sessions() returns list", isinstance(sessions, list)))
    results.append(check("Test session appears in list",
                          any(s.session_id == TEST_SESSION for s in sessions)))

    # Filter by status
    done_sessions = storage_manager.list_sessions(status_filter="DONE")
    results.append(check("status_filter='DONE' works",
                          all(s.status == "DONE" for s in done_sessions)))

    # Limit
    limited = storage_manager.list_sessions(limit=1)
    results.append(check("limit=1 returns at most 1", len(limited) <= 1))

    count = storage_manager.get_session_count()
    results.append(check("get_session_count() >= 1", count >= 1, str(count)))

    # SessionInfo fields
    info = next(s for s in sessions if s.session_id == TEST_SESSION)
    results.append(check("SessionInfo.has_results = True",  info.has_results is True))
    results.append(check("SessionInfo.disk_usage is DiskUsage",
                          isinstance(info.disk_usage, DiskUsage)))

    # Storage summary
    summary = storage_manager.storage_summary()
    results.append(check("storage_summary() has total_sessions key",
                          "total_sessions" in summary, str(summary["total_sessions"])))
except Exception as e:
    results.append(check("Session listing", False, str(e)))


# ─────────────────────────────────────────────────────────────
sep("11. Find Uploaded Video")
# ─────────────────────────────────────────────────────────────

try:
    paths = storage_manager.get_session_paths(TEST_SESSION)

    # No video yet → None
    result = storage_manager.find_uploaded_video(TEST_SESSION)
    results.append(check("find_uploaded_video returns None (no video)",
                          result is None))

    # Plant a fake .mp4
    fake_video = paths.upload_dir / "test_athlete.mp4"
    fake_video.write_bytes(b"FAKE_VIDEO")

    result2 = storage_manager.find_uploaded_video(TEST_SESSION)
    results.append(check("find_uploaded_video finds .mp4",
                          result2 is not None and result2.suffix == ".mp4",
                          str(result2)))
except Exception as e:
    results.append(check("Find uploaded video", False, str(e)))


# ─────────────────────────────────────────────────────────────
sep("12. Cleanup — Frames Only")
# ─────────────────────────────────────────────────────────────

try:
    deleted = storage_manager.cleanup_frames(TEST_SESSION)
    results.append(check(f"cleanup_frames deleted 10 files",
                          deleted == 10, f"deleted={deleted}"))
    results.append(check("frame_count() = 0 after cleanup",
                          storage_manager.frame_count(TEST_SESSION) == 0))
    results.append(check("results still exist after frame cleanup",
                          storage_manager.results_exist(TEST_SESSION)))
    results.append(check("frames_dir still exists (just empty)",
                          storage_manager.get_session_paths(TEST_SESSION).frames_dir.exists()))
except Exception as e:
    results.append(check("cleanup_frames", False, str(e)))


# ─────────────────────────────────────────────────────────────
sep("13. Thread Safety")
# ─────────────────────────────────────────────────────────────

try:
    errors = []
    updates = []

    def worker(n: int):
        try:
            storage_manager.write_session_meta(
                TEST_SESSION, {f"thread_{n}": True}
            )
            updates.append(n)
        except Exception as ex:
            errors.append(str(ex))

    threads = [threading.Thread(target=worker, args=(i,)) for i in range(10)]
    for t in threads: t.start()
    for t in threads: t.join()

    results.append(check("10 concurrent writes — no errors",
                          len(errors) == 0, f"errors={errors}"))
    results.append(check("10 concurrent writes — all completed",
                          len(updates) == 10, f"completed={len(updates)}"))

    # Verify file is still valid JSON
    paths = storage_manager.get_session_paths(TEST_SESSION)
    data = json.loads(paths.meta_file.read_text())
    results.append(check("meta_file is valid JSON after concurrent writes",
                          isinstance(data, dict)))
except Exception as e:
    results.append(check("Thread safety", False, str(e)))


# ─────────────────────────────────────────────────────────────
sep("14. Full Session Cleanup")
# ─────────────────────────────────────────────────────────────

try:
    # keep_results=True — only upload+frames+viz deleted, results kept
    storage_manager.create_session("test-keep-results")
    storage_manager.write_motion_json("test-keep-results", {"test": True})

    ok = storage_manager.cleanup_session("test-keep-results", keep_results=True)
    results.append(check("cleanup_session(keep_results=True) returns True", ok is True))

    paths_kr = storage_manager.get_session_paths("test-keep-results")
    results.append(check("  results_dir preserved",    paths_kr.results_dir.exists()))
    results.append(check("  upload_dir removed",       not paths_kr.upload_dir.exists()))
    results.append(check("  frames_dir removed",       not paths_kr.frames_dir.exists()))

    # Full cleanup
    ok2 = storage_manager.cleanup_session("test-keep-results", keep_results=False)
    results.append(check("cleanup_session(full) returns True", ok2 is True))
    results.append(check("  results_dir also removed", not paths_kr.results_dir.exists()))

    # Cleanup non-existent session
    ok3 = storage_manager.cleanup_session("does-not-exist-xyz")
    results.append(check("cleanup_session(nonexistent) returns False", ok3 is False))

    # Full cleanup of test session
    storage_manager.cleanup_session(TEST_SESSION)
    results.append(check("cleanup TEST_SESSION — upload_dir removed",
                          not storage_manager.get_session_paths(TEST_SESSION).upload_dir.exists()))
except Exception as e:
    results.append(check("Full session cleanup", False, str(e)))


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
    print("\n  🎉  Step 5 COMPLETE — StorageManager fully verified!\n")
    sys.exit(0)
else:
    print(f"\n  ⚠️   {failed} check(s) failed — review output above\n")
    sys.exit(1)
