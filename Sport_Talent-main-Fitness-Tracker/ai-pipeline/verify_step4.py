"""
verify_step4.py
===============
Step 4 Verification — Pydantic Models
Tests every model: instantiation, validation, field defaults,
custom validators, property methods, and JSON round-trip.
"""

import sys
import json


def check(label: str, passed: bool, detail: str = "") -> bool:
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"  {status}  {label}" + (f"  →  {detail}" if detail else ""))
    return passed


def sep(title: str):
    print(f"\n{'─'*60}\n  {title}\n{'─'*60}")


results = []

# ─────────────────────────────────────────────────────────────
sep("1. Model Imports")
# ─────────────────────────────────────────────────────────────

try:
    from api.models.request_models import (
        ProcessRequest, VisualizationRequest,
        WebhookConfig, BatchExportRequest,
    )
    results.append(check("Request models import", True))
except Exception as e:
    results.append(check("Request models import", False, str(e)))

try:
    from api.models.response_models import (
        LandmarkPoint, JointAngles, QualityReport, FramePose,
        VideoMetadata, ProcessingConfig, MotionSummary, MotionData,
        UploadResponse, ProcessStatusResponse, VisualizationStatusResponse,
        TensorExportResponse, HealthResponse, APIInfoResponse,
    )
    results.append(check("Response models import", True))
except Exception as e:
    results.append(check("Response models import", False, str(e)))

try:
    from api.models import (
        ProcessRequest, MotionData, LandmarkPoint,
        VisualizationRequest, WebhookConfig,
    )
    results.append(check("api.models __init__ re-exports", True))
except Exception as e:
    results.append(check("api.models __init__ re-exports", False, str(e)))


# ─────────────────────────────────────────────────────────────
sep("2. ProcessRequest — Valid Cases")
# ─────────────────────────────────────────────────────────────

try:
    req = ProcessRequest(session_id="abc-123")
    results.append(check("Default ProcessRequest", True))
    results.append(check("  frame_skip default=2",          req.frame_skip == 2,          str(req.frame_skip)))
    results.append(check("  model_complexity default=2",    req.model_complexity == 2,    str(req.model_complexity)))
    results.append(check("  smooth_landmarks default=True", req.smooth_landmarks is True, str(req.smooth_landmarks)))
    results.append(check("  compute_angles default=True",   req.compute_angles is True,   str(req.compute_angles)))
    results.append(check("  webhook default=None",          req.webhook is None,          str(req.webhook)))
except Exception as e:
    results.append(check("Default ProcessRequest", False, str(e)))

try:
    full_req = ProcessRequest(
        session_id="xyz-789",
        frame_skip=3,
        model_complexity=1,
        smoothing_window=7,
        smoothing_polyorder=3,
        athlete_id="athlete_007",
    )
    results.append(check("Full ProcessRequest with all fields", True))
    results.append(check("  athlete_id stored", full_req.athlete_id == "athlete_007"))
    results.append(check("  smoothing_window=7", full_req.smoothing_window == 7))
except Exception as e:
    results.append(check("Full ProcessRequest", False, str(e)))


# ─────────────────────────────────────────────────────────────
sep("3. ProcessRequest — Validator Errors")
# ─────────────────────────────────────────────────────────────

from pydantic import ValidationError

# Even smoothing_window
try:
    ProcessRequest(session_id="x", smoothing_window=4)
    results.append(check("Even window rejected", False, "should have raised"))
except ValidationError as e:
    results.append(check("Even smoothing_window=4 rejected", True,
                         "ValidationError raised correctly"))

# polyorder >= window
try:
    ProcessRequest(session_id="x", smoothing_window=5, smoothing_polyorder=5)
    results.append(check("polyorder>=window rejected", False, "should have raised"))
except ValidationError as e:
    results.append(check("polyorder>=window rejected", True,
                         "ValidationError raised correctly"))

# Invalid model_complexity
try:
    ProcessRequest(session_id="x", model_complexity=3)
    results.append(check("model_complexity=3 rejected", False, "should have raised"))
except (ValidationError, ValueError) as e:
    results.append(check("model_complexity=3 rejected", True,
                         "Error raised correctly"))

# confidence out of range
try:
    ProcessRequest(session_id="x", min_detection_confidence=1.5)
    results.append(check("confidence=1.5 rejected", False, "should have raised"))
except ValidationError:
    results.append(check("confidence=1.5 rejected", True,
                         "ValidationError raised correctly"))


# ─────────────────────────────────────────────────────────────
sep("4. VisualizationRequest")
# ─────────────────────────────────────────────────────────────

try:
    vr = VisualizationRequest()
    results.append(check("Default VisualizationRequest", True))
    results.append(check("  mode default=overlay", vr.mode == "overlay"))
    results.append(check("  include_angles default=True", vr.include_angles is True))
    results.append(check("  output_fps default=30", vr.output_fps == 30))

    vr2 = VisualizationRequest(mode="heatmap", output_fps=60)
    results.append(check("Custom mode=heatmap fps=60", True))
    results.append(check("  mode=heatmap", vr2.mode == "heatmap"))

    try:
        VisualizationRequest(mode="invalid_mode")
        results.append(check("Invalid mode rejected", False))
    except ValidationError:
        results.append(check("Invalid mode rejected", True))
except Exception as e:
    results.append(check("VisualizationRequest", False, str(e)))


# ─────────────────────────────────────────────────────────────
sep("5. WebhookConfig")
# ─────────────────────────────────────────────────────────────

try:
    wh = WebhookConfig(
        url="https://phase5.example.com/hook",
        secret="supersecret123",
    )
    results.append(check("Valid WebhookConfig", True))
    results.append(check("  events default=['DONE','FAILED']",
                          set(wh.events) == {"DONE", "FAILED"}))

    try:
        WebhookConfig(url="http://example.com/hook", secret="secret123")
        results.append(check("HTTP non-localhost rejected", False))
    except ValidationError:
        results.append(check("HTTP non-localhost URL rejected", True))

    # localhost should be allowed
    wh_local = WebhookConfig(url="http://localhost:8001/hook", secret="secret123")
    results.append(check("http://localhost allowed", True))
except Exception as e:
    results.append(check("WebhookConfig", False, str(e)))


# ─────────────────────────────────────────────────────────────
sep("6. LandmarkPoint")
# ─────────────────────────────────────────────────────────────

try:
    lm = LandmarkPoint(
        x=0.48, y=0.21, z=-0.05,
        visibility=0.987,
        world_x=-0.12, world_y=0.45, world_z=0.02,
    )
    results.append(check("Valid LandmarkPoint", True))
    results.append(check("  is_interpolated default=False", lm.is_interpolated is False))
    results.append(check("  is_smoothed default=True", lm.is_smoothed is True))

    # Out of range x
    try:
        LandmarkPoint(x=1.5, y=0.5, z=0, visibility=0.9,
                      world_x=0, world_y=0, world_z=0)
        results.append(check("x=1.5 rejected", False))
    except ValidationError:
        results.append(check("x=1.5 out of range rejected", True))

    # JSON round-trip
    lm_json = lm.model_dump_json()
    lm2 = LandmarkPoint.model_validate_json(lm_json)
    results.append(check("JSON round-trip", lm2.x == lm.x and lm2.visibility == lm.visibility))
except Exception as e:
    results.append(check("LandmarkPoint", False, str(e)))


# ─────────────────────────────────────────────────────────────
sep("7. JointAngles")
# ─────────────────────────────────────────────────────────────

try:
    ja = JointAngles(
        left_knee_angle=165.3,
        right_knee_angle=162.1,
        trunk_lean=8.5,
    )
    results.append(check("Valid JointAngles (partial)", True))
    results.append(check("  left_knee_angle=165.3", ja.left_knee_angle == 165.3))
    results.append(check("  right_elbow_angle=None (not set)", ja.right_elbow_angle is None))

    available = ja.available_angles()
    results.append(check("  available_angles() returns 3",
                          len(available) == 3, str(available)))

    to_dict = ja.to_dict()
    results.append(check("  to_dict() has 12 keys", len(to_dict) == 12, str(len(to_dict))))

    # Default (all None)
    ja_empty = JointAngles()
    results.append(check("Empty JointAngles all None",
                          all(v is None for v in ja_empty.to_dict().values())))
except Exception as e:
    results.append(check("JointAngles", False, str(e)))


# ─────────────────────────────────────────────────────────────
sep("8. QualityReport")
# ─────────────────────────────────────────────────────────────

try:
    qr = QualityReport(
        overall_score=0.92,
        is_valid=True,
        avg_visibility=0.95,
    )
    results.append(check("Valid QualityReport", True))
    results.append(check("  low_visibility_landmarks default=[]",
                          qr.low_visibility_landmarks == []))
    results.append(check("  issues default=[]", qr.issues == []))

    qr_bad = QualityReport(
        overall_score=0.3,
        is_valid=False,
        avg_visibility=0.4,
        missing_critical_landmarks=["left_hip", "right_hip"],
        issues=["missing_critical", "low_overall_visibility"],
    )
    results.append(check("Invalid frame QualityReport", True))
    results.append(check("  2 missing critical", len(qr_bad.missing_critical_landmarks) == 2))
except Exception as e:
    results.append(check("QualityReport", False, str(e)))


# ─────────────────────────────────────────────────────────────
sep("9. FramePose")
# ─────────────────────────────────────────────────────────────

try:
    from core.constants import LANDMARK_NAMES

    # Build minimal landmarks dict (all 33)
    lms = {
        name: LandmarkPoint(
            x=0.5, y=0.5, z=0.0,
            visibility=0.95,
            world_x=0.0, world_y=0.0, world_z=0.0,
        )
        for name in LANDMARK_NAMES
    }
    qr = QualityReport(overall_score=0.92, is_valid=True, avg_visibility=0.95)
    ja = JointAngles(left_knee_angle=160.0, right_knee_angle=158.0)

    fp = FramePose(
        frame_number=42,
        timestamp_ms=1400.0,
        landmarks=lms,
        joint_angles=ja,
        quality=qr,
        person_bbox=[100.0, 80.0, 420.0, 720.0],
    )
    results.append(check("Valid FramePose", True))
    results.append(check("  frame_number=42", fp.frame_number == 42))
    results.append(check("  33 landmarks", len(fp.landmarks) == 33))
    results.append(check("  .landmark('left_knee') returns LandmarkPoint",
                          isinstance(fp.landmark("left_knee"), LandmarkPoint)))
    results.append(check("  .landmark('nonexistent') returns None",
                          fp.landmark("nonexistent") is None))
    results.append(check("  .get_angle('left_knee_angle') = 160.0",
                          fp.get_angle("left_knee_angle") == 160.0))
    results.append(check("  person_bbox has 4 elements", len(fp.person_bbox) == 4))

    # JSON round-trip
    fp_json = fp.model_dump_json()
    fp2 = FramePose.model_validate_json(fp_json)
    results.append(check("FramePose JSON round-trip",
                          fp2.frame_number == 42 and len(fp2.landmarks) == 33))
except Exception as e:
    results.append(check("FramePose", False, str(e)))


# ─────────────────────────────────────────────────────────────
sep("10. VideoMetadata")
# ─────────────────────────────────────────────────────────────

try:
    vm = VideoMetadata(
        filename="athlete_sprint.mp4",
        file_size_bytes=52428800,
        fps=30.0,
        total_frames=900,
        duration_seconds=30.0,
        width=1920,
        height=1080,
        codec="H264",
    )
    results.append(check("Valid VideoMetadata", True))
    results.append(check("  .resolution = (1920, 1080)", vm.resolution == (1920, 1080)))
    results.append(check("  .aspect_ratio ≈ 1.778",
                          abs(vm.aspect_ratio - 16/9) < 0.001,
                          f"{vm.aspect_ratio:.3f}"))
except Exception as e:
    results.append(check("VideoMetadata", False, str(e)))


# ─────────────────────────────────────────────────────────────
sep("11. MotionSummary")
# ─────────────────────────────────────────────────────────────

try:
    ms = MotionSummary(
        total_input_frames=450,
        processed_frames=450,
        valid_frames=430,
        dropped_frames=[12, 45, 89],
        interpolated_frames=[12, 45],
        avg_quality_score=0.92,
        min_quality_score=0.61,
        max_quality_score=0.99,
        processing_time_seconds=18.4,
        frames_per_second_throughput=24.5,
    )
    results.append(check("Valid MotionSummary", True))
    results.append(check("  drop_rate ≈ 0.0067",
                          abs(ms.drop_rate - 3/450) < 0.001, f"{ms.drop_rate:.4f}"))
    results.append(check("  coverage_pct ≈ 95.6",
                          abs(ms.coverage_pct - (430/450*100)) < 0.1,
                          f"{ms.coverage_pct:.1f}%"))
except Exception as e:
    results.append(check("MotionSummary", False, str(e)))


# ─────────────────────────────────────────────────────────────
sep("12. MotionData Root Model")
# ─────────────────────────────────────────────────────────────

try:
    from datetime import datetime, timezone
    from core.constants import MOTION_JSON_SCHEMA_VERSION

    # Reuse objects from above
    lms = {name: LandmarkPoint(x=0.5,y=0.5,z=0.0,visibility=0.95,
                               world_x=0.0,world_y=0.0,world_z=0.0)
           for name in LANDMARK_NAMES}
    qr = QualityReport(overall_score=0.92,is_valid=True,avg_visibility=0.95)

    frames = [
        FramePose(frame_number=i, timestamp_ms=float(i*33.3),
                  landmarks=lms, quality=qr)
        for i in range(5)
    ]

    md = MotionData(
        session_id="test-session-001",
        athlete_id="athlete_007",
        created_at=datetime.now(timezone.utc).isoformat(),
        video_metadata=VideoMetadata(
            filename="sprint.mp4", file_size_bytes=10_000_000,
            fps=30.0, total_frames=5, duration_seconds=0.167,
            width=1280, height=720, codec="H264",
        ),
        processing_config=ProcessingConfig(
            frame_skip=2, model_complexity=2,
            min_detection_confidence=0.7, min_tracking_confidence=0.5,
            smooth_landmarks=True, enable_segmentation=False,
            detection_confidence=0.7, interpolation_method="linear",
            smoothing_window=5, smoothing_polyorder=2,
            outlier_std_threshold=3.0, quality_min_score=0.6,
            compute_angles=True,
        ),
        summary=MotionSummary(
            total_input_frames=5, processed_frames=5, valid_frames=5,
            avg_quality_score=0.92, min_quality_score=0.92, max_quality_score=0.92,
            processing_time_seconds=1.0, frames_per_second_throughput=5.0,
        ),
        frames=frames,
    )

    results.append(check("MotionData root model", True))
    results.append(check("  schema_version correct",
                          md.schema_version == MOTION_JSON_SCHEMA_VERSION,
                          md.schema_version))
    results.append(check("  phase5_ready=True",  md.phase5_ready is True))
    results.append(check("  33 in landmark_index_map", len(md.landmark_index_map) == 33))
    results.append(check("  12 in angle_index_map",   len(md.angle_index_map) == 12))
    results.append(check("  .get_frame(2) returns FramePose",
                          md.get_frame(2) is not None and md.get_frame(2).frame_number == 2))
    results.append(check("  .get_frame(99) returns None", md.get_frame(99) is None))

    traj = md.landmark_trajectory("left_knee")
    results.append(check("  .landmark_trajectory('left_knee') has 5 items", len(traj) == 5))
    results.append(check("  trajectory item has x/y/z/visibility keys",
                          all(k in traj[0] for k in ["x", "y", "z", "visibility"])))

    # JSON round-trip
    md_json = md.model_dump_json()
    md2 = MotionData.model_validate_json(md_json)
    results.append(check("MotionData JSON round-trip",
                          md2.session_id == "test-session-001" and len(md2.frames) == 5))

    # Check JSON is valid and has correct top-level keys
    md_dict = json.loads(md_json)
    expected_keys = {"schema_version","session_id","athlete_id","created_at",
                     "video_metadata","processing_config","summary","frames",
                     "phase5_ready","tensor_shape","landmark_index_map"}
    results.append(check("JSON has all Phase 5 keys",
                          expected_keys.issubset(md_dict.keys()),
                          str(expected_keys - md_dict.keys() or "✓ all present")))
except Exception as e:
    results.append(check("MotionData root model", False, str(e)))
    import traceback; traceback.print_exc()


# ─────────────────────────────────────────────────────────────
sep("13. API Response Models")
# ─────────────────────────────────────────────────────────────

try:
    ur = UploadResponse(
        session_id="abc",
        filename="video.mp4",
        upload_path="storage/uploads/abc/video.mp4",
        video_metadata=VideoMetadata(
            filename="video.mp4", file_size_bytes=1000000,
            fps=30.0, total_frames=300, duration_seconds=10.0,
            width=1280, height=720, codec="H264",
        ),
    )
    results.append(check("UploadResponse", True, f"message='{ur.message[:40]}...'"))

    psr = ProcessStatusResponse(
        session_id="abc", status="ESTIMATING",
        progress_pct=42.0, frames_done=189, total_frames=450,
        current_stage="MediaPipe pose estimation",
        elapsed_seconds=8.4,
    )
    results.append(check("ProcessStatusResponse", True,
                          f"status={psr.status} progress={psr.progress_pct}%"))

    vsr = VisualizationStatusResponse(
        session_id="abc", status="DONE",
        progress_pct=100.0,
        output_path="storage/visualizations/abc/skeleton_video.mp4",
        video_url="/static/visualizations/abc/skeleton_video.mp4",
    )
    results.append(check("VisualizationStatusResponse", True, f"status={vsr.status}"))

except Exception as e:
    results.append(check("API Response Models", False, str(e)))


# ─────────────────────────────────────────────────────────────
sep("14. BatchExportRequest")
# ─────────────────────────────────────────────────────────────

try:
    batch = BatchExportRequest(
        session_ids=["abc-1", "abc-2", "abc-3"],
        include_csv=True,
        format="zip",
    )
    results.append(check("Valid BatchExportRequest", True,
                          f"{len(batch.session_ids)} sessions"))

    try:
        BatchExportRequest(session_ids=["abc", "abc"])  # duplicate
        results.append(check("Duplicate session_ids rejected", False))
    except ValidationError:
        results.append(check("Duplicate session_ids rejected", True))

    try:
        BatchExportRequest(session_ids=[])  # empty list
        results.append(check("Empty session_ids rejected", False))
    except ValidationError:
        results.append(check("Empty session_ids rejected", True))
except Exception as e:
    results.append(check("BatchExportRequest", False, str(e)))


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
    print("\n  🎉  Step 4 COMPLETE — All Pydantic models verified!\n")
    sys.exit(0)
else:
    print(f"\n  ⚠️   {failed} check(s) failed — review output above\n")
    sys.exit(1)
