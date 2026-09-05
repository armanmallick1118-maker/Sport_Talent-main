"""
api/models/__init__.py
======================
Convenience re-exports for all API models.

Usage:
    from api.models import ProcessRequest, MotionData, LandmarkPoint
"""

from api.models.request_models import (
    BatchExportRequest,
    ProcessRequest,
    VisualizationRequest,
    WebhookConfig,
)
from api.models.response_models import (
    APIInfoResponse,
    FramePose,
    HealthResponse,
    JointAngles,
    LandmarkPoint,
    MotionData,
    MotionSummary,
    ProcessingConfig,
    ProcessStatusResponse,
    QualityReport,
    TensorExportResponse,
    UploadResponse,
    VideoMetadata,
    VisualizationStatusResponse,
)

__all__ = [
    # Request
    "ProcessRequest",
    "VisualizationRequest",
    "WebhookConfig",
    "BatchExportRequest",
    # Response — building blocks
    "LandmarkPoint",
    "JointAngles",
    "QualityReport",
    "FramePose",
    "VideoMetadata",
    "ProcessingConfig",
    "MotionSummary",
    "MotionData",
    # Response — API-level
    "UploadResponse",
    "ProcessStatusResponse",
    "VisualizationStatusResponse",
    "TensorExportResponse",
    "HealthResponse",
    "APIInfoResponse",
]
