"""
core/logger.py
==============
Centralized logger setup for MediaPipeline.
Uses loguru for structured, coloured, per-session logging.

Usage:
    from core.logger import get_logger

    log = get_logger("video_ingestion", session_id="abc-123")
    log.info("Extracted 450 frames")
    log.warning("Low visibility on left_knee at frame 42")
    log.error("Pipeline failed: {error}", error=str(e))
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Optional

from loguru import logger as _loguru_logger

from core.config import settings


# ── Log format ────────────────────────────────────────────────────────────────
_CONSOLE_FORMAT = (
    "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{extra[module]: <20}</cyan> | "
    "<yellow>{extra[session_id]: <36}</yellow> | "
    "{message}"
)

_FILE_FORMAT = (
    "{time:YYYY-MM-DD HH:mm:ss} | "
    "{level: <8} | "
    "{extra[module]: <20} | "
    "{extra[session_id]: <36} | "
    "{message}"
)

# ── Remove default loguru handler ─────────────────────────────────────────────
_loguru_logger.remove()

# ── Console handler ───────────────────────────────────────────────────────────
_loguru_logger.add(
    sys.stdout,
    format=_CONSOLE_FORMAT,
    level=settings.LOG_LEVEL,
    colorize=True,
    backtrace=True,
    diagnose=True,
)

# ── Global file handler (all sessions) ───────────────────────────────────────
if settings.LOG_TO_FILE:
    _global_log_path = settings.logs_dir_abs / "mediapipeline.log"
    _loguru_logger.add(
        str(_global_log_path),
        format=_FILE_FORMAT,
        level=settings.LOG_LEVEL,
        rotation="50 MB",       # rotate when file hits 50 MB
        retention="7 days",     # keep logs for 7 days
        compression="zip",      # compress rotated logs
        backtrace=True,
        diagnose=False,         # no sensitive data in file logs
    )


def get_logger(module: str, session_id: str = "global") -> "BoundLogger":
    """
    Returns a loguru logger bound with module name and session_id.

    Args:
        module:     Name of the calling module (e.g. "video_ingestion")
        session_id: Processing session UUID (defaults to "global")

    Returns:
        Loguru BoundLogger with context fields pre-filled.

    Example:
        log = get_logger("pose_estimator", session_id="abc-123")
        log.info("Processing frame {n}", n=42)
    """
    bound = _loguru_logger.bind(module=module, session_id=session_id)
    return bound


def add_session_file_handler(session_id: str) -> None:
    """
    Adds a per-session log file: storage/logs/{session_id}.log
    Called by the orchestrator when a new processing session starts.

    Args:
        session_id: The UUID of the processing session.
    """
    if not settings.LOG_TO_FILE:
        return

    session_log_path = settings.logs_dir_abs / f"{session_id}.log"
    _loguru_logger.add(
        str(session_log_path),
        format=_FILE_FORMAT,
        level=settings.LOG_LEVEL,
        filter=lambda record: record["extra"].get("session_id") == session_id,
        rotation=None,      # no rotation for per-session logs
        retention=None,
        backtrace=True,
        diagnose=False,
    )


# ── Type alias for IDE autocompletion ────────────────────────────────────────
# loguru's BoundLogger is not easily importable, so we alias the base logger
BoundLogger = type(_loguru_logger)


# ── Module-level logger (for config.py itself) ────────────────────────────────
_startup_log = get_logger("config")
_startup_log.info(
    "MediaPipeline config loaded | "
    "log_level={level} | api_port={port} | model_complexity={mc}",
    level=settings.LOG_LEVEL,
    port=settings.API_PORT,
    mc=settings.MODEL_COMPLEXITY,
)
