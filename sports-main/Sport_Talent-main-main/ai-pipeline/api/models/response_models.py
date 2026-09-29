"""
api/models/response_models.py
==============================
All Pydantic response/output models for the MediaPipeline API.

Model hierarchy:
  LandmarkPoint                  → single landmark (x,y,z,visibility + world coords)
  JointAngles                    → 12 computed biomechanical angles
  QualityReport                  → per-frame quality metadata
  FramePose                      → complete pose data for one frame
  VideoMetadata                  → original video properties
  ProcessingConfig               → settings used during processing
  MotionSummary                  → aggregate stats for the whole session
  MotionData                     → root model — full motion JSON output

  UploadResponse                 → response from POST /upload
  ProcessStatusResponse          → response from GET /process/{id}/status
  VisualizationStatusResponse    → response from GET /visualize/{id}/status
  TensorExportResponse           → Phase 5 tensor metadata envelope
  HealthResponse                 → response from GET /health
  APIInfoResponse                → response from GET /api/v1/info
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field

from core.constants import (
    JOINT_ANGLE_NAMES,
    LANDMARK_NAMES,
    MOTION_JSON_SCHEMA_VERSION,
    TENSOR_FEATURE_NAMES,
    TENSOR_NUM_FEATURES,
    TENSOR_NUM_LANDMARKS,
    ProcessingStatus,
)


# ─────────────────────────────────────────────────────────────────────────────
#  LandmarkPoint — one of the 33 pose landmarks
# ─────────────────────────────────────────────────────────────────────────────

class LandmarkPoint(BaseModel):
    """
    All coordinates for a single MediaPipe pose landmark.

    Normalized coords (x, y, z):
      - x, y: 0.0–1.0 relative to frame width/height
      - z:    depth relative to hip midpoint (negative = closer to camera)

    World coords (world_x, world_y, world_z):
      - Metric (metres), hip-centred coordinate system
      - world_y points up, world_z points toward camera
    """

    # ── Normalized image-space coords ─────────────────────────
    x: float = Field(..., ge=0.0, le=1.0, description="Normalized x (0–1, left→right)")
    y: float = Field(..., ge=0.0, le=1.0, description="Normalized y (0–1, top→bottom)")
    z: float = Field(..., description="Normalized depth relative to hip midpoint")
    visibility: float = Field(..., ge=0.0, le=1.0, description="Landmark visibility/confidence (0–1)")

    # ── World (metric) coords ──────────────────────────────────
    world_x: float = Field(..., description="World x in metres (hip-centred)")
    world_y: float = Field(..., description="World y in metres (hip-centred, up=positive)")
    world_z: float = Field(..., description="World z in metres (toward camera=positive)")

    # ── Flags ─────────────────────────────────────────────────
    is_interpolated: bool = Field(
        default=False,
        description="True if this point was interpolated (original frame was dropped).",
    )
    is_smoothed: bool = Field(
        default=True,
        description="True if Savitzky-Golay smoothing was applied.",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "x": 0.4823, "y": 0.2134, "z": -0.0521,
                    "visibility": 0.987,
                    "world_x": -0.124, "world_y": 0.452, "world_z": 0.018,
                    "is_interpolated": False, "is_smoothed": True,
                }
            ]
        }
    }


# ─────────────────────────────────────────────────────────────────────────────
#  JointAngles — 12 biomechanical angles per frame
# ─────────────────────────────────────────────────────────────────────────────

class JointAngles(BaseModel):
    """
    12 computed biomechanical joint angles (in degrees) for one frame.
    None means the angle could not be computed (landmark(s) not visible).
    """

    # ── Lower body ────────────────────────────────────────────
    left_knee_angle:      Optional[float] = Field(None, ge=0.0, le=180.0)
    right_knee_angle:     Optional[float] = Field(None, ge=0.0, le=180.0)
    left_hip_angle:       Optional[float] = Field(None, ge=0.0, le=180.0)
    right_hip_angle:      Optional[float] = Field(None, ge=0.0, le=180.0)
    left_ankle_angle:     Optional[float] = Field(None, ge=0.0, le=180.0)
    right_ankle_angle:    Optional[float] = Field(None, ge=0.0, le=180.0)

    # ── Upper body ────────────────────────────────────────────
    left_elbow_angle:     Optional[float] = Field(None, ge=0.0, le=180.0)
    right_elbow_angle:    Optional[float] = Field(None, ge=0.0, le=180.0)
    left_shoulder_angle:  Optional[float] = Field(None, ge=0.0, le=180.0)
    right_shoulder_angle: Optional[float] = Field(None, ge=0.0, le=180.0)

    # ── Trunk ─────────────────────────────────────────────────
    trunk_lean:           Optional[float] = Field(None, ge=0.0, le=180.0,
                                                   description="Forward lean angle of torso (degrees)")
    hip_tilt:             Optional[float] = Field(None, ge=0.0, le=180.0,
                                                   description="Lateral hip tilt angle (degrees)")

    def to_dict(self) -> Dict[str, Optional[float]]:
        """Returns a flat {angle_name: degrees} dict."""
        return self.model_dump()

    def available_angles(self) -> List[str]:
        """Returns names of angles that were successfully computed (not None)."""
        return [k for k, v in self.model_dump().items() if v is not None]


# ─────────────────────────────────────────────────────────────────────────────
#  QualityReport — per-frame quality assessment
# ─────────────────────────────────────────────────────────────────────────────

class QualityReport(BaseModel):
    """Quality assessment result for a single frame."""

    overall_score: float = Field(
        ..., ge=0.0, le=1.0,
        description="Composite quality score 0–1. Frames below quality_min_score are dropped.",
    )
    is_valid: bool = Field(
        ...,
        description="True if overall_score >= quality_min_score threshold.",
    )
    avg_visibility: float = Field(
        ..., ge=0.0, le=1.0,
        description="Mean visibility score across all 33 landmarks.",
    )
    low_visibility_landmarks: List[str] = Field(
        default_factory=list,
        description="Landmark names with visibility below CONFIDENCE_THRESHOLD.",
    )
    missing_critical_landmarks: List[str] = Field(
        default_factory=list,
        description="Critical landmarks (shoulder/hip) that are not detected.",
    )
    issues: List[str] = Field(
        default_factory=list,
        description="List of QualityIssue codes detected in this frame.",
    )


# ─────────────────────────────────────────────────────────────────────────────
#  FramePose — complete pose data for one video frame
# ─────────────────────────────────────────────────────────────────────────────

class FramePose(BaseModel):
    """
    Full pose data for a single extracted video frame.
    The `landmarks` dict is keyed by landmark name (e.g. 'left_shoulder').
    """

    frame_number: int = Field(
        ..., ge=0,
        description="0-based frame index in the original video.",
    )
    timestamp_ms: float = Field(
        ..., ge=0.0,
        description="Frame timestamp in milliseconds from video start.",
    )

    # ── Pose data ─────────────────────────────────────────────
    landmarks: Dict[str, LandmarkPoint] = Field(
        ...,
        description=(
            "Dict of all 33 MediaPipe pose landmarks keyed by name. "
            f"Valid keys: {LANDMARK_NAMES[:3]} … {LANDMARK_NAMES[-1]}"
        ),
    )
    joint_angles: JointAngles = Field(
        default_factory=JointAngles,
        description="12 computed biomechanical joint angles for this frame.",
    )

    # ── Detection metadata ────────────────────────────────────
    person_bbox: Optional[List[float]] = Field(
        default=None,
        description="YOLOv8 bounding box [x1, y1, x2, y2] in pixel coords.",
        min_length=4,
        max_length=4,
    )
    detection_confidence: Optional[float] = Field(
        default=None, ge=0.0, le=1.0,
        description="YOLOv8 person detection confidence score.",
    )

    # ── Quality ───────────────────────────────────────────────
    quality: QualityReport = Field(
        ...,
        description="Per-frame quality assessment result.",
    )

    # ── Flags ─────────────────────────────────────────────────
    has_pose: bool = Field(
        default=True,
        description="False if MediaPipe detected no person in this frame.",
    )
    is_interpolated: bool = Field(
        default=False,
        description="True if this frame's pose data was linearly interpolated due to a tracking gap."
    )
    is_smoothed: bool = Field(
        default=False,
        description="True if Savitzky-Golay filtering was applied to this frame's pose data."
    )

    def landmark(self, name: str) -> Optional[LandmarkPoint]:
        """Convenience getter — returns None if name not found."""
        return self.landmarks.get(name)

    def get_angle(self, angle_name: str) -> Optional[float]:
        """Returns a named joint angle value or None."""
        return getattr(self.joint_angles, angle_name, None)


# ─────────────────────────────────────────────────────────────────────────────
#  VideoMetadata — original video file properties
# ─────────────────────────────────────────────────────────────────────────────

class VideoMetadata(BaseModel):
    """Properties of the original uploaded video, extracted by OpenCV."""

    filename: str          = Field(..., description="Original uploaded filename.")
    file_size_bytes: int   = Field(..., ge=0, description="File size in bytes.")
    fps: float             = Field(..., gt=0.0, description="Frames per second.")
    total_frames: int      = Field(..., ge=0, description="Total frame count in video.")
    duration_seconds: float = Field(..., ge=0.0, description="Video duration in seconds.")
    width: int             = Field(..., gt=0, description="Frame width in pixels.")
    height: int            = Field(..., gt=0, description="Frame height in pixels.")
    codec: str             = Field(..., description="Video codec (e.g. 'H264', 'MJPG').")

    @property
    def resolution(self) -> tuple[int, int]:
        return (self.width, self.height)

    @property
    def aspect_ratio(self) -> float:
        return self.width / self.height if self.height > 0 else 0.0


# ─────────────────────────────────────────────────────────────────────────────
#  ProcessingConfig — settings snapshot embedded in motion JSON
# ─────────────────────────────────────────────────────────────────────────────

class ProcessingConfig(BaseModel):
    """Snapshot of ProcessRequest settings used for this session — for reproducibility."""

    frame_skip: int
    model_complexity: int
    min_detection_confidence: float
    min_tracking_confidence: float
    smooth_landmarks: bool
    enable_segmentation: bool
    detection_confidence: float
    interpolation_method: str
    smoothing_window: int
    smoothing_polyorder: int
    outlier_std_threshold: float
    quality_min_score: float
    compute_angles: bool


# ─────────────────────────────────────────────────────────────────────────────
#  MotionSummary — aggregate statistics for the full session
# ─────────────────────────────────────────────────────────────────────────────

class MotionSummary(BaseModel):
    """Summary statistics for the complete processed session."""

    total_input_frames: int    = Field(..., description="Total frames extracted from video.")
    processed_frames: int      = Field(..., description="Frames that went through pose estimation.")
    valid_frames: int          = Field(..., description="Frames that passed quality check.")
    dropped_frames: List[int]  = Field(default_factory=list, description="Frame indices that were dropped.")
    interpolated_frames: List[int] = Field(default_factory=list, description="Frame indices that were interpolated.")

    avg_quality_score: float   = Field(..., ge=0.0, le=1.0, description="Mean quality score across valid frames.")
    min_quality_score: float   = Field(..., ge=0.0, le=1.0)
    max_quality_score: float   = Field(..., ge=0.0, le=1.0)

    avg_detection_confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    landmarks_tracked: int     = Field(default=33)
    angles_computed: int       = Field(default=12)

    processing_time_seconds: float = Field(..., ge=0.0)
    frames_per_second_throughput: float = Field(..., ge=0.0,
        description="Pipeline throughput in frames/sec.")

    @property
    def drop_rate(self) -> float:
        if self.total_input_frames == 0:
            return 0.0
        return len(self.dropped_frames) / self.total_input_frames

    @property
    def coverage_pct(self) -> float:
        if self.total_input_frames == 0:
            return 0.0
        return (self.valid_frames / self.total_input_frames) * 100


# ─────────────────────────────────────────────────────────────────────────────
#  MotionData — ROOT model — the full motion JSON output
# ─────────────────────────────────────────────────────────────────────────────

class MotionData(BaseModel):
    """
    Root model for the complete motion data JSON exported per session.
    Saved to: storage/results/{session_id}/motion_data.json

    This is the primary output consumed by Phase 5 ML pipelines.
    """

    schema_version: str = Field(
        default=MOTION_JSON_SCHEMA_VERSION,
        description="Motion JSON schema version for forward compatibility.",
    )
    session_id: str = Field(..., description="Processing session UUID.")
    athlete_id: Optional[str] = Field(
        default=None,
        description="Optional athlete identifier.",
    )
    created_at: str = Field(
        ...,
        description="ISO 8601 UTC timestamp when this file was generated.",
    )

    video_metadata: VideoMetadata   = Field(..., description="Original video properties.")
    processing_config: ProcessingConfig = Field(..., description="Settings used for this run.")
    summary: MotionSummary          = Field(..., description="Aggregate statistics.")
    frames: List[FramePose]         = Field(..., description="Per-frame pose data (all processed frames).")

    # ── Phase 5 metadata ──────────────────────────────────────
    phase5_ready: bool = Field(
        default=True,
        description="Always True — signals downstream ML systems this file is complete.",
    )
    tensor_shape: List[int] = Field(
        default=[0, TENSOR_NUM_LANDMARKS, TENSOR_NUM_FEATURES],
        description=f"Shape of tensor export: (num_frames, {TENSOR_NUM_LANDMARKS}, {TENSOR_NUM_FEATURES})",
    )
    landmark_index_map: Dict[str, int] = Field(
        default_factory=lambda: {name: i for i, name in enumerate(LANDMARK_NAMES)},
        description="Landmark name → tensor axis-1 index mapping.",
    )
    angle_index_map: Dict[str, int] = Field(
        default_factory=lambda: {name: i for i, name in enumerate(JOINT_ANGLE_NAMES)},
        description="Angle name → index mapping.",
    )
    coordinate_system: str = Field(
        default="normalized_image_space",
        description="Coordinate system for x/y/z fields.",
    )
    world_coordinate_system: str = Field(
        default="mediapipe_world_hip_centered",
        description="Coordinate system for world_x/world_y/world_z fields.",
    )

    def get_frame(self, frame_number: int) -> Optional[FramePose]:
        """Returns FramePose for the given frame_number, or None."""
        for f in self.frames:
            if f.frame_number == frame_number:
                return f
        return None

    def landmark_trajectory(self, landmark_name: str) -> List[Dict[str, Any]]:
        """
        Returns time-series for one landmark across all frames.
        [ { frame_number, timestamp_ms, x, y, z, visibility, world_x, world_y, world_z } ]
        """
        result = []
        for f in self.frames:
            lm = f.landmarks.get(landmark_name)
            if lm:
                result.append({
                    "frame_number": f.frame_number,
                    "timestamp_ms": f.timestamp_ms,
                    **lm.model_dump(exclude={"is_interpolated", "is_smoothed"}),
                })
        return result

    def angle_trajectory(self, angle_name: str) -> List[Dict[str, Any]]:
        """
        Returns time-series for one joint angle.
        [ { frame_number, timestamp_ms, degrees } ]
        """
        return [
            {
                "frame_number": f.frame_number,
                "timestamp_ms": f.timestamp_ms,
                "degrees":      getattr(f.joint_angles, angle_name, None),
            }
            for f in self.frames
        ]

    model_config = {"arbitrary_types_allowed": True}


# ─────────────────────────────────────────────────────────────────────────────
#  API-level Response Models
# ─────────────────────────────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    """Response from POST /api/v1/upload."""

    session_id: str     = Field(..., description="UUID for all subsequent API calls.")
    filename: str       = Field(..., description="Sanitised filename as stored.")
    upload_path: str    = Field(..., description="Server-side storage path.")
    video_metadata: VideoMetadata
    message: str        = Field(default="Upload successful. Call /process to start pipeline.")

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "session_id":   "3f2a8b1c-0e4d-4f7a-9c3b-1a2b3c4d5e6f",
                "filename":     "athlete_sprint.mp4",
                "upload_path":  "storage/uploads/3f2a8b1c.../athlete_sprint.mp4",
                "message":      "Upload successful. Call /process to start pipeline.",
            }]
        }
    }


class ProcessStatusResponse(BaseModel):
    """Response from GET /api/v1/process/{session_id}/status."""

    session_id: str     = Field(...)
    status: str         = Field(..., description=f"One of: {ProcessingStatus.ALL}")
    progress_pct: float = Field(default=0.0, ge=0.0, le=100.0)
    frames_done: int    = Field(default=0, ge=0)
    total_frames: int   = Field(default=0, ge=0)
    current_stage: str  = Field(default="", description="Human-readable current pipeline stage.")
    elapsed_seconds: float = Field(default=0.0, ge=0.0)
    eta_seconds: Optional[float] = Field(default=None, ge=0.0)
    errors: List[str]   = Field(default_factory=list)
    result_path: Optional[str] = Field(
        default=None,
        description="Path to motion_data.json — populated when status=DONE.",
    )
    queue_position: Optional[int] = Field(
        default=None,
        description="Position in job queue — populated when status=PENDING.",
    )


class VisualizationStatusResponse(BaseModel):
    """Response from GET /api/v1/visualize/{session_id}/status."""

    session_id: str  = Field(...)
    status: str      = Field(...)
    progress_pct: float = Field(default=0.0, ge=0.0, le=100.0)
    mode: str        = Field(default="overlay")
    output_path: Optional[str] = Field(default=None)
    video_url: Optional[str]   = Field(
        default=None,
        description="URL to stream the rendered video — populated when status=DONE.",
    )
    elapsed_seconds: float = Field(default=0.0)


class TensorExportResponse(BaseModel):
    """Phase 5 — Response from GET /api/v1/results/{session_id}/tensor."""

    session_id: str             = Field(...)
    phase5_ready: bool          = Field(default=True)
    tensor_shape: List[int]     = Field(
        ...,
        description=f"[num_frames, {TENSOR_NUM_LANDMARKS}, {TENSOR_NUM_FEATURES}]",
    )
    features: List[str]         = Field(default=TENSOR_FEATURE_NAMES)
    landmark_index_map: Dict[str, int] = Field(...)
    angle_index_map: Dict[str, int]    = Field(...)
    coordinate_system: str      = Field(default="normalized_image_space")
    world_coordinate_system: str = Field(default="mediapipe_world_hip_centered")
    data: List[List[List[float]]] = Field(
        ...,
        description="Nested list of shape [num_frames][33][7] — JSON-serialised tensor.",
    )


class HealthResponse(BaseModel):
    """Response from GET /health."""

    status: Literal["healthy", "degraded"]
    started_at: str
    uptime_seconds: float
    python: str
    platform: str
    storage_ok: bool
    opencv: Dict[str, Any]
    mediapipe: Dict[str, Any]
    hardware: Dict[str, Any]
    config: Dict[str, Any]
    timestamp: str


class APIInfoResponse(BaseModel):
    """Response from GET /api/v1/info."""

    schema_version: str
    mediapipe_version: str
    opencv_version: str
    landmarks: Dict[str, Any]
    joint_angles: Dict[str, Any]
    skeleton_connections_count: int
    supported_video_formats: List[str]
    max_video_size_mb: int
    processing_statuses: List[str]
    tensor_export: Dict[str, Any]
    config: Dict[str, Any]


# ── Re-exports for convenience ────────────────────────────────────────────────
__all__ = [
    "LandmarkPoint",
    "JointAngles",
    "QualityReport",
    "FramePose",
    "VideoMetadata",
    "ProcessingConfig",
    "MotionSummary",
    "MotionData",
    "UploadResponse",
    "ProcessStatusResponse",
    "VisualizationStatusResponse",
    "TensorExportResponse",
    "HealthResponse",
    "APIInfoResponse",
]
