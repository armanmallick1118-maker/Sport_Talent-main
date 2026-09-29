"""
core/__init__.py
================
Core package — re-exports all key singletons and types.

Usage:
    from core import settings, storage_manager, get_logger
    from core import LANDMARK_NAMES, ProcessingStatus
"""

from core.config import settings
from core.constants import (
    BODY_PART_COLORS_BGR,
    BODY_PARTS,
    CRITICAL_LANDMARKS,
    JOINT_ANGLE_DEFS,
    JOINT_ANGLE_NAMES,
    LANDMARK_INDEX,
    LANDMARK_NAMES,
    SKELETON_CONNECTIONS,
    LandmarkIndex,
    ProcessingStatus,
)
from core.logger import get_logger, add_session_file_handler
from core.storage_manager import (
    storage_manager,
    SessionPaths,
    SessionMeta,
    SessionInfo,
    DiskUsage,
)

__all__ = [
    # Config
    "settings",
    # Constants
    "LANDMARK_NAMES", "LANDMARK_INDEX", "BODY_PARTS",
    "CRITICAL_LANDMARKS", "SKELETON_CONNECTIONS",
    "JOINT_ANGLE_DEFS", "JOINT_ANGLE_NAMES",
    "BODY_PART_COLORS_BGR", "LandmarkIndex", "ProcessingStatus",
    # Logger
    "get_logger", "add_session_file_handler",
    # Storage
    "storage_manager", "SessionPaths", "SessionMeta",
    "SessionInfo", "DiskUsage",
]
