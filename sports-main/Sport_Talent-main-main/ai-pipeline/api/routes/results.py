"""
api/routes/results.py
=====================
Results Retrieval API (Step 17).

Provides endpoints to fetch the full MotionData JSON, summary stats,
individual frames, individual landmark trajectories, and joint angle time-series.
Includes file download endpoints for the JSON and CSV.
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Path
from fastapi.responses import FileResponse

from api.models.response_models import MotionData, MotionSummary, FramePose
from core.storage_manager import StorageManager
from core.logger import get_logger

router = APIRouter()
log = get_logger("results_route")

storage = StorageManager()

def _get_motion_data(session_id: str) -> MotionData:
    """Helper to load and validate MotionData JSON from disk."""
    session_dir = storage.get_session_paths(session_id).results_dir
    json_path = os.path.join(session_dir, "motion_data.json")
    
    if not os.path.exists(json_path):
        raise HTTPException(status_code=404, detail="Motion data not found. Has processing finished?")
        
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return MotionData(**data)
    except Exception as e:
        log.error(f"Failed to load motion data for {session_id}: {e}")
        raise HTTPException(status_code=500, detail="Corrupted or invalid motion data file.")


@router.get("/results/{session_id}", response_model=MotionData)
async def get_full_results(session_id: str = Path(..., description="The processing session UUID")):
    """
    Returns the complete Phase 5-ready MotionData JSON payload.
    """
    return _get_motion_data(session_id)


@router.get("/results/{session_id}/summary", response_model=MotionSummary)
async def get_summary(session_id: str = Path(...)):
    """
    Returns only the summary statistics for the processed session.
    """
    data = _get_motion_data(session_id)
    return data.summary


@router.get("/results/{session_id}/frame/{frame_number}", response_model=FramePose)
async def get_frame(
    session_id: str = Path(...),
    frame_number: int = Path(..., ge=0)
):
    """
    Returns the pose data for a specific frame number.
    """
    data = _get_motion_data(session_id)
    
    for fp in data.frames:
        if fp.frame_number == frame_number:
            return fp
            
    raise HTTPException(status_code=404, detail=f"Frame {frame_number} not found in this session.")


@router.get("/results/{session_id}/download")
async def download_results(
    session_id: str = Path(...),
    format: str = "json"
):
    """
    Downloads the motion data as a file (JSON or CSV).
    """
    if format not in ("json", "csv"):
        raise HTTPException(status_code=400, detail="Invalid format. Use 'json' or 'csv'.")
        
    session_dir = storage.get_session_paths(session_id).results_dir
    file_path = os.path.join(session_dir, f"motion_data.{format}")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Motion data {format.upper()} file not found.")
        
    return FileResponse(
        path=file_path,
        filename=f"motion_data_{session_id}.{format}",
        media_type="application/json" if format == "json" else "text/csv"
    )


@router.get("/results/{session_id}/landmarks/{landmark_name}")
async def get_landmark_trajectory(
    session_id: str = Path(...),
    landmark_name: str = Path(..., description="Name of the MediaPipe landmark (e.g. left_shoulder)")
) -> Dict[str, Any]:
    """
    Returns a time-series array of coordinates for a specific landmark across all frames.
    Format:
    {
      "landmark": "left_shoulder",
      "trajectory": [
         {"frame": 0, "timestamp_ms": 0.0, "x": ..., "y": ..., "z": ..., "visibility": ...},
         ...
      ]
    }
    """
    data = _get_motion_data(session_id)
    
    trajectory = []
    for fp in data.frames:
        lm = fp.landmark(landmark_name)
        if lm:
            trajectory.append({
                "frame": fp.frame_number,
                "timestamp_ms": fp.timestamp_ms,
                "x": lm.x,
                "y": lm.y,
                "z": lm.z,
                "visibility": lm.visibility,
                "world_x": lm.world_x,
                "world_y": lm.world_y,
                "world_z": lm.world_z
            })
            
    if not trajectory:
        raise HTTPException(status_code=404, detail=f"Landmark '{landmark_name}' not found.")
        
    return {
        "landmark": landmark_name,
        "trajectory": trajectory
    }


@router.get("/results/{session_id}/angles")
async def get_all_angles(session_id: str = Path(...)) -> Dict[str, Any]:
    """
    Returns time-series arrays for all computed joint angles.
    Format:
    {
       "left_knee_angle": [{"frame": 0, "angle": 90.0}, ...],
       ...
    }
    """
    data = _get_motion_data(session_id)
    
    result = {}
    for fp in data.frames:
        for angle_name, angle_val in fp.joint_angles.model_dump().items():
            if angle_val is not None:
                if angle_name not in result:
                    result[angle_name] = []
                result[angle_name].append({
                    "frame": fp.frame_number,
                    "timestamp_ms": fp.timestamp_ms,
                    "angle": angle_val
                })
                
    return result

# ─────────────────────────────────────────────────────────────────────────────
#  Phase 5 Integration Hooks (Step 30)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/export/batch")
async def export_batch(session_ids: str):
    """
    Batch export data for multiple sessions.
    Provide a comma-separated list of session_ids.
    """
    s_ids = [s.strip() for s in session_ids.split(",") if s.strip()]
    results = {}
    for sid in s_ids:
        try:
            results[sid] = _get_motion_data(sid)
        except Exception:
            results[sid] = {"error": "Not found or failed"}
    return results


@router.get("/results/{session_id}/tensor")
async def get_ml_tensor(session_id: str):
    """
    ML-ready tensor export.
    Returns a flat array-like structure compatible with NumPy.
    Shape: [num_frames, 33, 7]
    Features: [x, y, z, vis, world_x, world_y, world_z]
    """
    motion_data = _get_motion_data(session_id)
    tensor = []
    
    # 33 landmarks mapping
    # ensure consistent ordering
    from core.constants import LANDMARK_NAMES
    
    for frame in motion_data.frames:
        frame_data = []
        for lm_name in LANDMARK_NAMES:
            lm = frame.pose.landmarks.get(lm_name)
            if lm:
                frame_data.append([
                    lm.x, lm.y, lm.z, lm.visibility,
                    lm.world_x, lm.world_y, lm.world_z
                ])
            else:
                frame_data.append([0.0]*7)
        tensor.append(frame_data)
        
    return {
        "phase5_ready": True,
        "tensor_shape": [len(tensor), 33, 7],
        "landmark_index_map": {name: i for i, name in enumerate(LANDMARK_NAMES)},
        "coordinate_system": "normalized_image_space",
        "world_coordinate_system": "mediapipe_world_hip_centered",
        "tensor": tensor
    }


import asyncio
from fastapi.responses import StreamingResponse

@router.get("/results/{session_id}/stream")
async def stream_results(session_id: str):
    """
    Server-Sent Events (SSE) stream of frame pose data.
    """
    async def event_generator():
        try:
            motion_data = _get_motion_data(session_id)
            for frame in motion_data.frames:
                yield f"data: {frame.json()}\n\n"
                await asyncio.sleep(0.033)  # Simulate 30fps playback
        except Exception:
            yield f"data: {{\"error\": \"Session not ready\"}}\n\n"
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")
