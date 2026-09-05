"""
core/config.py
==============
Centralized settings management for MediaPipeline.
Reads all configuration from the .env file using pydantic-settings.
All modules import from the shared `settings` singleton at the bottom.

Usage:
    from core.config import settings
    print(settings.UPLOAD_DIR)
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import List, Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


# ── Project Root ─────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent


class StorageSettings(BaseSettings):
    """Storage path configuration."""

    UPLOAD_DIR: Path = Path("storage/uploads")
    FRAMES_DIR: Path = Path("storage/frames")
    RESULTS_DIR: Path = Path("storage/results")
    VIZ_DIR: Path = Path("storage/visualizations")
    LOGS_DIR: Path = Path("storage/logs")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @model_validator(mode="after")
    def make_dirs(self) -> "StorageSettings":
        """Ensure all storage directories exist on startup."""
        for field_name in ["UPLOAD_DIR", "FRAMES_DIR", "RESULTS_DIR", "VIZ_DIR", "LOGS_DIR"]:
            path = getattr(self, field_name)
            # Resolve relative to project root
            if not path.is_absolute():
                path = PROJECT_ROOT / path
                setattr(self, field_name, path)
            path.mkdir(parents=True, exist_ok=True)
        return self


class VideoSettings(BaseSettings):
    """Video ingestion & frame extraction settings."""

    MAX_VIDEO_SIZE_MB: int = Field(default=500, ge=1, le=5000)
    FRAME_SKIP: int = Field(default=2, ge=1, le=30)
    TARGET_RESOLUTION_W: int = Field(default=1280, ge=0)
    TARGET_RESOLUTION_H: int = Field(default=720, ge=0)
    SUPPORTED_FORMATS: str = "mp4,mov,avi,mkv,webm"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def supported_formats_list(self) -> List[str]:
        """Returns SUPPORTED_FORMATS as a list of extensions."""
        return [f".{fmt.strip()}" for fmt in self.SUPPORTED_FORMATS.split(",")]

    @property
    def max_video_size_bytes(self) -> int:
        return self.MAX_VIDEO_SIZE_MB * 1024 * 1024

    @property
    def target_resolution(self) -> tuple[int, int] | None:
        """Returns (W, H) tuple or None if no resize configured."""
        if self.TARGET_RESOLUTION_W > 0 and self.TARGET_RESOLUTION_H > 0:
            return (self.TARGET_RESOLUTION_W, self.TARGET_RESOLUTION_H)
        return None


class MediaPipeSettings(BaseSettings):
    """MediaPipe Pose estimation configuration."""

    MODEL_COMPLEXITY: Literal[0, 1, 2] = Field(default=2)
    MIN_DETECTION_CONFIDENCE: float = Field(default=0.7, ge=0.0, le=1.0)
    MIN_TRACKING_CONFIDENCE: float = Field(default=0.5, ge=0.0, le=1.0)
    CONFIDENCE_THRESHOLD: float = Field(default=0.6, ge=0.0, le=1.0)
    SMOOTH_LANDMARKS: bool = True
    ENABLE_SEGMENTATION: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("MODEL_COMPLEXITY", mode="before")
    @classmethod
    def validate_complexity(cls, v: int) -> int:
        if int(v) not in (0, 1, 2):
            raise ValueError("MODEL_COMPLEXITY must be 0 (lite), 1 (full), or 2 (heavy)")
        return int(v)


class DetectionSettings(BaseSettings):
    """YOLOv8 person detection configuration."""

    DETECTION_CONFIDENCE: float = Field(default=0.7, ge=0.0, le=1.0)
    YOLO_MODEL_SIZE: Literal["n", "s", "m", "l", "x"] = "n"
    BBOX_PADDING_PCT: float = Field(default=0.15, ge=0.0, le=0.5)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def yolo_model_name(self) -> str:
        return f"yolov8{self.YOLO_MODEL_SIZE}.pt"


class CleaningSettings(BaseSettings):
    """Data cleaning, smoothing, and interpolation settings."""

    INTERPOLATION_METHOD: Literal["linear", "cubic"] = "linear"
    SMOOTHING_WINDOW: int = Field(default=5, ge=3)
    SMOOTHING_POLYORDER: int = Field(default=2, ge=1)
    OUTLIER_STD_THRESHOLD: float = Field(default=3.0, ge=1.0)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("SMOOTHING_WINDOW", mode="after")
    @classmethod
    def window_must_be_odd(cls, v: int) -> int:
        if v % 2 == 0:
            raise ValueError(f"SMOOTHING_WINDOW must be odd, got {v}")
        return v

    @model_validator(mode="after")
    def polyorder_less_than_window(self) -> "CleaningSettings":
        if self.SMOOTHING_POLYORDER >= self.SMOOTHING_WINDOW:
            raise ValueError(
                f"SMOOTHING_POLYORDER ({self.SMOOTHING_POLYORDER}) must be "
                f"less than SMOOTHING_WINDOW ({self.SMOOTHING_WINDOW})"
            )
        return self


class QualitySettings(BaseSettings):
    """Frame quality thresholds."""

    QUALITY_MIN_SCORE: float = Field(default=0.6, ge=0.0, le=1.0)
    MAX_DROPPED_FRAME_PCT: float = Field(default=0.5, ge=0.0, le=1.0)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


class APISettings(BaseSettings):
    """FastAPI server and rate limiting configuration."""

    API_HOST: str = "0.0.0.0"
    API_PORT: int = Field(default=8000, ge=1, le=65535)
    API_VERSION: str = "v1"
    MAX_CONCURRENT_JOBS: int = Field(default=3, ge=1, le=20)
    RATE_LIMIT_UPLOADS_PER_MIN: int = Field(default=5, ge=1)
    AUTO_CLEANUP_FRAMES: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def api_prefix(self) -> str:
        return f"/api/{self.API_VERSION}"


class LoggingSettings(BaseSettings):
    """Logging configuration."""

    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    LOG_TO_FILE: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


# ── Master Settings ───────────────────────────────────────────────────────────

class Settings(BaseSettings):
    """
    Master settings object that combines all sub-settings.
    Import this singleton in every module:

        from core.config import settings
    """

    # ── Storage ──────────────────────────────────────────────
    UPLOAD_DIR: Path = Path("storage/uploads")
    FRAMES_DIR: Path = Path("storage/frames")
    RESULTS_DIR: Path = Path("storage/results")
    VIZ_DIR: Path = Path("storage/visualizations")
    LOGS_DIR: Path = Path("storage/logs")

    # ── Video ─────────────────────────────────────────────────
    MAX_VIDEO_SIZE_MB: int = Field(default=500, ge=1, le=5000)
    FRAME_SKIP: int = Field(default=2, ge=1, le=30)
    TARGET_RESOLUTION_W: int = Field(default=1280, ge=0)
    TARGET_RESOLUTION_H: int = Field(default=720, ge=0)
    SUPPORTED_FORMATS: str = "mp4,mov,avi,mkv,webm"

    # ── MediaPipe ─────────────────────────────────────────────
    MODEL_COMPLEXITY: int = Field(default=2)
    MIN_DETECTION_CONFIDENCE: float = Field(default=0.7, ge=0.0, le=1.0)
    MIN_TRACKING_CONFIDENCE: float = Field(default=0.5, ge=0.0, le=1.0)
    CONFIDENCE_THRESHOLD: float = Field(default=0.6, ge=0.0, le=1.0)
    SMOOTH_LANDMARKS: bool = True
    ENABLE_SEGMENTATION: bool = False

    # ── Person Detection ──────────────────────────────────────
    DETECTION_CONFIDENCE: float = Field(default=0.7, ge=0.0, le=1.0)
    YOLO_MODEL_SIZE: str = "n"
    BBOX_PADDING_PCT: float = Field(default=0.15, ge=0.0, le=0.5)

    # ── Data Cleaning ─────────────────────────────────────────
    INTERPOLATION_METHOD: str = "linear"
    SMOOTHING_WINDOW: int = Field(default=5, ge=3)
    SMOOTHING_POLYORDER: int = Field(default=2, ge=1)
    OUTLIER_STD_THRESHOLD: float = Field(default=3.0, ge=1.0)

    # ── Quality ───────────────────────────────────────────────
    QUALITY_MIN_SCORE: float = Field(default=0.6, ge=0.0, le=1.0)
    MAX_DROPPED_FRAME_PCT: float = Field(default=0.5, ge=0.0, le=1.0)

    # ── API ───────────────────────────────────────────────────
    API_HOST: str = "0.0.0.0"
    API_PORT: int = Field(default=8000, ge=1, le=65535)
    API_VERSION: str = "v1"
    MAX_CONCURRENT_JOBS: int = Field(default=3, ge=1, le=20)
    RATE_LIMIT_UPLOADS_PER_MIN: int = Field(default=5, ge=1)
    AUTO_CLEANUP_FRAMES: bool = True

    # ── Logging ───────────────────────────────────────────────
    LOG_LEVEL: str = "INFO"
    LOG_TO_FILE: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── Computed Properties ───────────────────────────────────

    @property
    def supported_formats_list(self) -> List[str]:
        return [f".{fmt.strip()}" for fmt in self.SUPPORTED_FORMATS.split(",")]

    @property
    def max_video_size_bytes(self) -> int:
        return self.MAX_VIDEO_SIZE_MB * 1024 * 1024

    @property
    def target_resolution(self) -> tuple | None:
        if self.TARGET_RESOLUTION_W > 0 and self.TARGET_RESOLUTION_H > 0:
            return (self.TARGET_RESOLUTION_W, self.TARGET_RESOLUTION_H)
        return None

    @property
    def yolo_model_name(self) -> str:
        return f"yolov8{self.YOLO_MODEL_SIZE}.pt"

    @property
    def api_prefix(self) -> str:
        return f"/api/{self.API_VERSION}"

    @property
    def upload_dir_abs(self) -> Path:
        p = Path(self.UPLOAD_DIR)
        return p if p.is_absolute() else PROJECT_ROOT / p

    @property
    def frames_dir_abs(self) -> Path:
        p = Path(self.FRAMES_DIR)
        return p if p.is_absolute() else PROJECT_ROOT / p

    @property
    def results_dir_abs(self) -> Path:
        p = Path(self.RESULTS_DIR)
        return p if p.is_absolute() else PROJECT_ROOT / p

    @property
    def viz_dir_abs(self) -> Path:
        p = Path(self.VIZ_DIR)
        return p if p.is_absolute() else PROJECT_ROOT / p

    @property
    def logs_dir_abs(self) -> Path:
        p = Path(self.LOGS_DIR)
        return p if p.is_absolute() else PROJECT_ROOT / p

    def ensure_storage_dirs(self) -> None:
        """Create all storage directories if they don't exist."""
        for d in [
            self.upload_dir_abs,
            self.frames_dir_abs,
            self.results_dir_abs,
            self.viz_dir_abs,
            self.logs_dir_abs,
        ]:
            d.mkdir(parents=True, exist_ok=True)

    def summary(self) -> dict:
        """Return a human-readable config summary dict (safe — no secrets)."""
        return {
            "storage": {
                "upload_dir": str(self.upload_dir_abs),
                "frames_dir": str(self.frames_dir_abs),
                "results_dir": str(self.results_dir_abs),
            },
            "video": {
                "max_size_mb": self.MAX_VIDEO_SIZE_MB,
                "frame_skip": self.FRAME_SKIP,
                "target_resolution": self.target_resolution,
                "supported_formats": self.supported_formats_list,
            },
            "mediapipe": {
                "model_complexity": self.MODEL_COMPLEXITY,
                "min_detection_confidence": self.MIN_DETECTION_CONFIDENCE,
                "min_tracking_confidence": self.MIN_TRACKING_CONFIDENCE,
                "smooth_landmarks": self.SMOOTH_LANDMARKS,
                "enable_segmentation": self.ENABLE_SEGMENTATION,
            },
            "detection": {
                "yolo_model": self.yolo_model_name,
                "confidence": self.DETECTION_CONFIDENCE,
                "bbox_padding_pct": self.BBOX_PADDING_PCT,
            },
            "cleaning": {
                "interpolation": self.INTERPOLATION_METHOD,
                "smoothing_window": self.SMOOTHING_WINDOW,
                "smoothing_polyorder": self.SMOOTHING_POLYORDER,
                "outlier_std_threshold": self.OUTLIER_STD_THRESHOLD,
            },
            "quality": {
                "min_score": self.QUALITY_MIN_SCORE,
                "max_dropped_pct": self.MAX_DROPPED_FRAME_PCT,
            },
            "api": {
                "host": self.API_HOST,
                "port": self.API_PORT,
                "prefix": self.api_prefix,
                "max_concurrent_jobs": self.MAX_CONCURRENT_JOBS,
                "rate_limit_uploads_per_min": self.RATE_LIMIT_UPLOADS_PER_MIN,
            },
            "logging": {
                "level": self.LOG_LEVEL,
                "to_file": self.LOG_TO_FILE,
            },
        }


# ── Singleton ─────────────────────────────────────────────────────────────────
# Import this in every module:
#   from core.config import settings
settings = Settings()

# Ensure storage directories exist as soon as config is loaded
settings.ensure_storage_dirs()
