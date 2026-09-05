"""
api/models/request_models.py
=============================
All Pydantic request/input models for the MediaPipeline API.

Models defined here:
  - ProcessRequest         → body for POST /api/v1/process
  - VisualizationRequest   → body for POST /api/v1/visualize/{session_id}
  - WebhookConfig          → optional Phase 5 webhook registration
  - BatchExportRequest     → Phase 5 batch multi-session export
"""

from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from core.constants import LANDMARK_NAMES, JOINT_ANGLE_NAMES


# ─────────────────────────────────────────────────────────────────────────────
#  ProcessRequest
# ─────────────────────────────────────────────────────────────────────────────

class ProcessRequest(BaseModel):
    """
    Request body for POST /api/v1/process.

    Controls every aspect of the pipeline run for a given session:
    frame skipping, MediaPipe model quality, detection thresholds,
    data cleaning, and Phase 5 export options.
    """

    # ── Required ──────────────────────────────────────────────
    session_id: str = Field(
        ...,
        description="UUID returned by the /upload endpoint.",
        examples=["3f2a8b1c-0e4d-4f7a-9c3b-1a2b3c4d5e6f"],
        min_length=1,
    )

    # ── Video / Frame Extraction ──────────────────────────────
    frame_skip: int = Field(
        default=2,
        ge=1,
        le=30,
        description=(
            "Extract every Nth frame. "
            "1 = every frame, 2 = every other frame, etc. "
            "Higher values = faster processing but lower temporal resolution."
        ),
    )

    # ── MediaPipe Pose ────────────────────────────────────────
    model_complexity: Literal[0, 1, 2] = Field(
        default=2,
        description=(
            "MediaPipe model complexity. "
            "0 = lite (fastest), 1 = full, 2 = heavy (most accurate)."
        ),
    )
    min_detection_confidence: float = Field(
        default=0.7,
        ge=0.0,
        le=1.0,
        description="Minimum confidence for initial person detection in a frame.",
    )
    min_tracking_confidence: float = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="Minimum confidence for landmark tracking across frames.",
    )
    smooth_landmarks: bool = Field(
        default=True,
        description="Apply MediaPipe's built-in landmark smoothing filter.",
    )
    enable_segmentation: bool = Field(
        default=False,
        description="Generate segmentation mask per frame (slower, more memory).",
    )

    # ── Person Detection (YOLOv8) ─────────────────────────────
    detection_confidence: float = Field(
        default=0.7,
        ge=0.0,
        le=1.0,
        description="Minimum YOLOv8 confidence for accepting a person bounding box.",
    )
    bbox_padding_pct: float = Field(
        default=0.15,
        ge=0.0,
        le=0.5,
        description="Percentage padding added around detected person bbox before pose estimation.",
    )

    # ── Data Cleaning ─────────────────────────────────────────
    interpolation_method: Literal["linear", "cubic"] = Field(
        default="linear",
        description="Interpolation method for filling gaps in dropped frames.",
    )
    smoothing_window: int = Field(
        default=5,
        ge=3,
        description="Savitzky-Golay smoothing window size. Must be odd.",
    )
    smoothing_polyorder: int = Field(
        default=2,
        ge=1,
        description="Savitzky-Golay polynomial order. Must be < smoothing_window.",
    )
    outlier_std_threshold: float = Field(
        default=3.0,
        ge=1.0,
        description="Z-score threshold for landmark outlier removal per trajectory.",
    )

    # ── Quality ───────────────────────────────────────────────
    quality_min_score: float = Field(
        default=0.6,
        ge=0.0,
        le=1.0,
        description="Frames with quality score below this are dropped/interpolated.",
    )

    # ── Output Options ────────────────────────────────────────
    export_csv: bool = Field(
        default=True,
        description="Also export a flat CSV alongside the motion JSON (for ML use).",
    )
    compute_angles: bool = Field(
        default=True,
        description="Compute 12 biomechanical joint angles per frame.",
    )
    auto_cleanup_frames: bool = Field(
        default=True,
        description="Delete raw extracted frames after processing to save disk space.",
    )

    # ── Phase 5 ───────────────────────────────────────────────
    webhook: Optional["WebhookConfig"] = Field(
        default=None,
        description="Optional webhook to call when processing completes.",
    )
    athlete_id: Optional[str] = Field(
        default=None,
        description="Optional athlete identifier to embed in the motion JSON.",
        max_length=128,
    )

    # ── Validators ────────────────────────────────────────────

    @field_validator("smoothing_window", mode="after")
    @classmethod
    def window_must_be_odd(cls, v: int) -> int:
        if v % 2 == 0:
            raise ValueError(
                f"smoothing_window must be an odd number (got {v}). "
                f"Try {v + 1} instead."
            )
        return v

    @model_validator(mode="after")
    def polyorder_less_than_window(self) -> "ProcessRequest":
        if self.smoothing_polyorder >= self.smoothing_window:
            raise ValueError(
                f"smoothing_polyorder ({self.smoothing_polyorder}) must be "
                f"strictly less than smoothing_window ({self.smoothing_window})."
            )
        return self

    @field_validator("model_complexity", mode="before")
    @classmethod
    def validate_complexity(cls, v: int) -> int:
        if int(v) not in (0, 1, 2):
            raise ValueError("model_complexity must be 0, 1, or 2.")
        return int(v)

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "session_id":               "3f2a8b1c-0e4d-4f7a-9c3b-1a2b3c4d5e6f",
                    "frame_skip":               2,
                    "model_complexity":         2,
                    "min_detection_confidence": 0.7,
                    "min_tracking_confidence":  0.5,
                    "smooth_landmarks":         True,
                    "enable_segmentation":      False,
                    "detection_confidence":     0.7,
                    "interpolation_method":     "linear",
                    "smoothing_window":         5,
                    "smoothing_polyorder":      2,
                    "compute_angles":           True,
                    "export_csv":               True,
                    "athlete_id":               "athlete_007",
                }
            ]
        }
    }


# ─────────────────────────────────────────────────────────────────────────────
#  VisualizationRequest
# ─────────────────────────────────────────────────────────────────────────────

class VisualizationRequest(BaseModel):
    """
    Request body for POST /api/v1/visualize/{session_id}.
    Controls skeleton rendering mode and annotation options.
    """

    mode: Literal["overlay", "black", "heatmap"] = Field(
        default="overlay",
        description=(
            "Render mode. "
            "`overlay` = skeleton on original video frames. "
            "`black` = skeleton on black background (clean export). "
            "`heatmap` = landmarks colour-coded by visibility score."
        ),
    )
    include_angles: bool = Field(
        default=True,
        description="Annotate joint angle values as text near each joint.",
    )
    include_quality_hud: bool = Field(
        default=True,
        description="Show per-frame quality score bar and issue badges.",
    )
    output_fps: int = Field(
        default=30,
        ge=1,
        le=120,
        description="Output video frame rate.",
    )
    landmark_radius: int = Field(
        default=6,
        ge=1,
        le=20,
        description="Radius of landmark dot circles in pixels.",
    )
    connection_thickness: int = Field(
        default=2,
        ge=1,
        le=10,
        description="Thickness of skeleton bone lines in pixels.",
    )
    color_by_body_part: bool = Field(
        default=True,
        description=(
            "Colour skeleton connections by body region "
            "(face/torso/left arm/right arm/left leg/right leg)."
        ),
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "mode":               "overlay",
                    "include_angles":     True,
                    "include_quality_hud": True,
                    "output_fps":         30,
                    "color_by_body_part": True,
                }
            ]
        }
    }


# ─────────────────────────────────────────────────────────────────────────────
#  WebhookConfig  (Phase 5)
# ─────────────────────────────────────────────────────────────────────────────

class WebhookConfig(BaseModel):
    """
    Optional webhook configuration for Phase 5 integration.
    MediaPipeline will POST a payload to `url` when processing completes.
    """

    url: str = Field(
        ...,
        description="HTTPS endpoint to POST processing results to.",
        examples=["https://phase5.example.com/hooks/mediapipe"],
    )
    secret: str = Field(
        ...,
        description="HMAC-SHA256 secret for request signature verification.",
        min_length=8,
    )
    events: List[Literal["DONE", "FAILED"]] = Field(
        default=["DONE", "FAILED"],
        description="Which processing events trigger the webhook.",
    )
    include_full_json: bool = Field(
        default=False,
        description=(
            "If True, include full motion JSON in webhook payload. "
            "If False, only send summary + download URL."
        ),
    )

    @field_validator("url", mode="after")
    @classmethod
    def url_must_be_https(cls, v: str) -> str:
        if not (v.startswith("https://") or v.startswith("http://localhost")):
            raise ValueError(
                "Webhook URL must use HTTPS (or http://localhost for development)."
            )
        return v


# ─────────────────────────────────────────────────────────────────────────────
#  BatchExportRequest  (Phase 5)
# ─────────────────────────────────────────────────────────────────────────────

class BatchExportRequest(BaseModel):
    """
    Request body for POST /api/v1/export/batch.
    Packages multiple sessions into a single ZIP for Phase 5 ML pipeline ingestion.
    """

    session_ids: List[str] = Field(
        ...,
        min_length=1,
        max_length=50,
        description="List of session UUIDs to include in the export.",
    )
    include_csv: bool = Field(
        default=True,
        description="Include CSV files alongside JSON in the export.",
    )
    include_visualizations: bool = Field(
        default=False,
        description="Include rendered skeleton videos in the export (large files).",
    )
    format: Literal["zip", "tar.gz"] = Field(
        default="zip",
        description="Archive format for the batch export.",
    )

    @field_validator("session_ids", mode="after")
    @classmethod
    def no_duplicate_sessions(cls, v: List[str]) -> List[str]:
        if len(v) != len(set(v)):
            raise ValueError("session_ids must not contain duplicates.")
        return v


# ── Update forward ref (WebhookConfig referenced in ProcessRequest) ───────────
ProcessRequest.model_rebuild()
