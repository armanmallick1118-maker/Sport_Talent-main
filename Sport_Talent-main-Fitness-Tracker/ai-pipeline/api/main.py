"""
api/main.py
===========
MediaPipeline FastAPI Application — Entry Point.

Initialises the FastAPI app with:
  - CORS middleware (dev: all origins)
  - Static file mount  → /static  (serves storage/ directory)
  - All route groups   → /api/v1/upload | /process | /results | /visualize
  - Startup event      → validates GPU/CPU, storage dirs, MediaPipe + OpenCV
  - /health endpoint   → full system status JSON
  - /api/v1/info       → API capabilities summary
  - Global exception handlers (422, 500)

Run:
    uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
"""

from __future__ import annotations

import platform
import sys
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

import cv2
import mediapipe as mp
import numpy as np
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from core.config import settings
from core.constants import (
    LANDMARK_NAMES,
    JOINT_ANGLE_NAMES,
    SKELETON_CONNECTIONS,
    MOTION_JSON_SCHEMA_VERSION,
    ProcessingStatus,
)
from core.logger import get_logger

# ── Logger ────────────────────────────────────────────────────────────────────
log = get_logger("main")

# ── App boot timestamp ────────────────────────────────────────────────────────
_BOOT_TIME = time.time()
_STARTUP_INFO: Dict[str, Any] = {}          # populated in lifespan


# ─────────────────────────────────────────────────────────────────────────────
#  Lifespan  (startup + shutdown in one place — FastAPI ≥ 0.93)
# ─────────────────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs at startup (before first request) and at shutdown.
    Validates the environment: storage dirs, MediaPipe, OpenCV, GPU/CPU.
    Populates _STARTUP_INFO used by /health.
    """
    log.info("=" * 60)
    log.info("MediaPipeline starting up …")

    # ── 1. Storage directories ────────────────────────────────────
    log.info("Verifying storage directories …")
    settings.ensure_storage_dirs()
    storage_ok = all([
        settings.upload_dir_abs.exists(),
        settings.frames_dir_abs.exists(),
        settings.results_dir_abs.exists(),
        settings.viz_dir_abs.exists(),
        settings.logs_dir_abs.exists(),
    ])
    log.info("Storage dirs OK: {ok}", ok=storage_ok)

    # ── 2. OpenCV probe ───────────────────────────────────────────
    log.info("Probing OpenCV …")
    cv2_ok = False
    cv2_info = {}
    try:
        dummy = np.zeros((100, 100, 3), dtype=np.uint8)
        gray  = cv2.cvtColor(dummy, cv2.COLOR_BGR2GRAY)
        assert gray.shape == (100, 100)
        cv2_ok = True
        cv2_info = {
            "version":  cv2.__version__,
            "build_info_available": hasattr(cv2, "getBuildInformation"),
        }
        log.info("OpenCV OK — version {v}", v=cv2.__version__)
    except Exception as exc:
        log.error("OpenCV probe failed: {e}", e=exc)

    # ── 3. MediaPipe probe ────────────────────────────────────────
    log.info("Probing MediaPipe (model_complexity=0 for speed) …")
    mp_ok   = False
    mp_info = {}
    try:
        with mp.solutions.pose.Pose(
            model_complexity=0,
            min_detection_confidence=0.5,
        ) as _pose:
            _result = _pose.process(np.zeros((480, 640, 3), dtype=np.uint8))
        mp_ok = True
        mp_info = {
            "version":         mp.__version__,
            "model_complexity": settings.MODEL_COMPLEXITY,
            "num_landmarks":   len(LANDMARK_NAMES),
            "num_connections": len(SKELETON_CONNECTIONS),
            "num_angles":      len(JOINT_ANGLE_NAMES),
            "smooth_landmarks": settings.SMOOTH_LANDMARKS,
            "segmentation":    settings.ENABLE_SEGMENTATION,
        }
        log.info("MediaPipe OK — version {v}", v=mp.__version__)
    except Exception as exc:
        log.error("MediaPipe probe failed: {e}", e=exc)

    # ── 4. GPU / CPU detection ────────────────────────────────────
    log.info("Detecting compute hardware …")
    hardware_info = _detect_hardware()
    log.info("Hardware: {hw}", hw=hardware_info.get("backend", "CPU"))

    # ── 5. Build startup info dict ────────────────────────────────
    _STARTUP_INFO.update({
        "status":     "healthy" if (cv2_ok and mp_ok and storage_ok) else "degraded",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "python":     sys.version,
        "platform":   platform.platform(),
        "storage_ok": storage_ok,
        "opencv":     cv2_info,
        "mediapipe":  mp_info,
        "hardware":   hardware_info,
        "config":     settings.summary(),
    })

    overall = "✅ HEALTHY" if _STARTUP_INFO["status"] == "healthy" else "⚠️  DEGRADED"
    log.info("Startup complete — {s}", s=overall)
    log.info("=" * 60)

    yield   # ── app runs here ──────────────────────────────────────

    # ── Shutdown ──────────────────────────────────────────────────
    log.info("MediaPipeline shutting down …")


# ─────────────────────────────────────────────────────────────────────────────
#  FastAPI App Instance
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="MediaPipeline — Athlete Motion Tracking API",
    description=(
        "End-to-end athlete tracking pipeline:\n"
        "video upload → OpenCV frame extraction → YOLOv8 person detection "
        "→ MediaPipe 33-landmark pose estimation → quality check → "
        "data cleaning → motion JSON export → skeleton visualisation.\n\n"
        "**Schema version**: `{sv}`\n"
        "**Landmarks**: 33 MediaPipe Pose landmarks + world coordinates\n"
        "**Joint angles**: 12 biomechanical angles computed per frame"
    ).format(sv=MOTION_JSON_SCHEMA_VERSION),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
    contact={
        "name":  "MediaPipeline Team",
        "email": "admin@mediapipeline.local",
    },
    license_info={
        "name": "MIT",
    },
)


# ─────────────────────────────────────────────────────────────────────────────
#  Middleware
# ─────────────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # dev — tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time-Ms", "X-API-Version"],
)


# ── Request timing middleware ─────────────────────────────────────────────────
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Adds X-Process-Time-Ms header to every response."""
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
    response.headers["X-Process-Time-Ms"] = str(elapsed_ms)
    response.headers["X-API-Version"] = settings.API_VERSION
    return response


# ─────────────────────────────────────────────────────────────────────────────
#  Static Files  →  /static  (serves storage/ for direct media access)
# ─────────────────────────────────────────────────────────────────────────────

_storage_root = Path(__file__).resolve().parent.parent / "storage"
app.mount(
    "/static",
    StaticFiles(directory=str(_storage_root)),
    name="static",
)


# ─────────────────────────────────────────────────────────────────────────────
#  Routers
# ─────────────────────────────────────────────────────────────────────────────

from api.routes.upload        import router as upload_router        # noqa: E402
from api.routes.process       import router as process_router       # noqa: E402
from api.routes.results       import router as results_router       # noqa: E402
from api.routes.visualization import router as visualization_router # noqa: E402

_prefix = settings.api_prefix   # "/api/v1"

app.include_router(upload_router,        prefix=_prefix, tags=["Upload"])
app.include_router(process_router,       prefix=_prefix, tags=["Process"])
app.include_router(results_router,       prefix=_prefix, tags=["Results"])
app.include_router(visualization_router, prefix=_prefix, tags=["Visualization"])


# ─────────────────────────────────────────────────────────────────────────────
#  Core Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@app.get(
    "/health",
    summary="System health check",
    description=(
        "Returns full system status including MediaPipe version, "
        "OpenCV build, hardware backend, storage dirs, and config summary."
    ),
    tags=["System"],
    response_model=None,
)
async def health_check() -> JSONResponse:
    """
    Full health check — called by load balancers, dashboards, and Phase 5 clients.

    Returns:
        200 OK  + JSON with status="healthy" when all subsystems are operational.
        503     + JSON with status="degraded" if any subsystem failed at startup.
    """
    uptime_s = round(time.time() - _BOOT_TIME, 1)
    payload  = {
        **_STARTUP_INFO,
        "uptime_seconds": uptime_s,
        "timestamp":      datetime.now(timezone.utc).isoformat(),
    }
    http_status = (
        status.HTTP_200_OK
        if _STARTUP_INFO.get("status") == "healthy"
        else status.HTTP_503_SERVICE_UNAVAILABLE
    )
    return JSONResponse(content=payload, status_code=http_status)


@app.get(
    "/",
    summary="API root",
    tags=["System"],
    include_in_schema=False,
)
async def root() -> Dict[str, Any]:
    """Root redirect — returns quick orientation JSON."""
    return {
        "name":        "MediaPipeline — Athlete Motion Tracking API",
        "version":     "1.0.0",
        "status":      _STARTUP_INFO.get("status", "starting"),
        "docs":        "/docs",
        "redoc":       "/redoc",
        "health":      "/health",
        "api_prefix":  settings.api_prefix,
        "endpoints": {
            "upload":        f"{settings.api_prefix}/upload",
            "process":       f"{settings.api_prefix}/process",
            "results":       f"{settings.api_prefix}/results/{{session_id}}",
            "visualize":     f"{settings.api_prefix}/visualize/{{session_id}}",
        },
    }


@app.get(
    f"{settings.api_prefix}/info",
    summary="API capabilities",
    tags=["System"],
)
async def api_info() -> Dict[str, Any]:
    """
    Returns API capabilities: landmark names, joint angles,
    supported video formats, processing config.
    """
    return {
        "schema_version":       MOTION_JSON_SCHEMA_VERSION,
        "mediapipe_version":    mp.__version__,
        "opencv_version":       cv2.__version__,
        "landmarks": {
            "count":  len(LANDMARK_NAMES),
            "names":  LANDMARK_NAMES,
        },
        "joint_angles": {
            "count": len(JOINT_ANGLE_NAMES),
            "names": JOINT_ANGLE_NAMES,
        },
        "skeleton_connections_count": len(SKELETON_CONNECTIONS),
        "supported_video_formats":    settings.supported_formats_list,
        "max_video_size_mb":          settings.MAX_VIDEO_SIZE_MB,
        "processing_statuses":        ProcessingStatus.ALL,
        "tensor_export": {
            "shape_description": "(num_frames, 33, 7)",
            "features":          ["x", "y", "z", "visibility",
                                  "world_x", "world_y", "world_z"],
        },
        "config": {
            "frame_skip":               settings.FRAME_SKIP,
            "model_complexity":         settings.MODEL_COMPLEXITY,
            "min_detection_confidence": settings.MIN_DETECTION_CONFIDENCE,
            "smoothing_window":         settings.SMOOTHING_WINDOW,
            "quality_min_score":        settings.QUALITY_MIN_SCORE,
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
#  Global Exception Handlers
# ─────────────────────────────────────────────────────────────────────────────

@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException) -> JSONResponse:
    if isinstance(exc.detail, dict):
        return JSONResponse(status_code=404, content={"detail": exc.detail})
        
    return JSONResponse(
        status_code=404,
        content={
            "error":   "not_found",
            "message": f"Route not found: {request.method} {request.url.path}",
            "docs":    "/docs",
        },
    )


@app.exception_handler(422)
async def validation_error_handler(request: Request, exc) -> JSONResponse:
    log.warning(
        "Validation error on {method} {path}",
        method=request.method,
        path=request.url.path,
    )
    return JSONResponse(
        status_code=422,
        content={
            "error":   "validation_error",
            "message": "Request body or parameters failed validation.",
            "detail":  exc.errors() if hasattr(exc, "errors") else str(exc),
            "docs":    "/docs",
        },
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc: Exception) -> JSONResponse:
    log.error(
        "Internal server error on {method} {path}: {exc}",
        method=request.method,
        path=request.url.path,
        exc=str(exc),
    )
    return JSONResponse(
        status_code=500,
        content={
            "error":   "internal_server_error",
            "message": "An unexpected error occurred. Check server logs.",
            "path":    request.url.path,
        },
    )


# ─────────────────────────────────────────────────────────────────────────────
#  Hardware Detection Helper
# ─────────────────────────────────────────────────────────────────────────────

def _detect_hardware() -> Dict[str, Any]:
    """
    Detects available compute backend (Apple Silicon / CUDA / CPU).
    Returns a dict with backend name and device details.
    """
    info: Dict[str, Any] = {
        "platform": platform.machine(),
        "cpu_count": None,
        "backend":   "CPU",
        "gpu":       None,
    }

    try:
        import os
        info["cpu_count"] = os.cpu_count()
    except Exception:
        pass

    # Apple Silicon (Metal / MPS)
    if platform.machine() == "arm64" and platform.system() == "Darwin":
        info["backend"] = "Apple Silicon (Metal)"
        info["gpu"]     = "Apple M-series (unified memory)"
        log.info("Apple Silicon detected — MediaPipe will use Metal delegate")
        return info

    # CUDA via PyTorch
    try:
        import torch
        if torch.cuda.is_available():
            info["backend"] = "CUDA"
            info["gpu"]     = {
                "name":         torch.cuda.get_device_name(0),
                "memory_total": f"{torch.cuda.get_device_properties(0).total_memory // (1024**2)} MB",
                "device_count": torch.cuda.device_count(),
            }
            log.info("CUDA GPU detected: {gpu}", gpu=info["gpu"]["name"])
            return info
    except ImportError:
        pass

    log.info("No GPU detected — running on CPU")
    return info


# ─────────────────────────────────────────────────────────────────────────────
#  Dev entry point
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True,
        log_level=settings.LOG_LEVEL.lower(),
    )
