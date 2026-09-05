"""
api/routes/visualization.py
===========================
Visualization API (Step 21).

Provides endpoints to trigger the generation of the skeleton overlay video/GIF,
and endpoints to fetch (download/stream) those generated media files.
"""

from __future__ import annotations

import json
import os

from fastapi import APIRouter, HTTPException, Path, BackgroundTasks
from fastapi.responses import FileResponse

from api.models.response_models import MotionData
from core.storage_manager import StorageManager
from core.visualizer import Visualizer
from core.logger import get_logger

router = APIRouter()
log = get_logger("visualization_route")
storage = StorageManager()


def _generate_task(session_id: str):
    """Background task to generate visualization media."""
    try:
        paths = storage.get_session_paths(session_id)
        
        # 1. Load MotionData
        json_path = paths.motion_json
        if not os.path.exists(json_path):
            log.error(f"Cannot generate viz for {session_id}: motion_data.json missing.")
            return
            
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        motion_data = MotionData(**data)
        
        # 2. Locate original uploaded video
        # We need to find the file in the upload directory
        upload_files = os.listdir(paths.upload_dir) if os.path.exists(paths.upload_dir) else []
        video_files = [f for f in upload_files if not f.endswith(".json")]
        
        if not video_files:
            log.error(f"Cannot generate viz for {session_id}: Original video missing.")
            return
            
        source_video = os.path.join(paths.upload_dir, video_files[0])
        
        # 3. Generate
        viz = Visualizer(session_id=session_id)
        os.makedirs(paths.viz_dir, exist_ok=True)
        viz.generate_video(source_video, paths.viz_dir, motion_data)
        
    except Exception as e:
        log.error(f"Visualization generation failed for {session_id}: {e}")


@router.post("/visualize/{session_id}/generate")
async def generate_visualizations(
    background_tasks: BackgroundTasks,
    session_id: str = Path(...)
):
    """
    Triggers the generation of the skeleton overlay MP4 and preview GIF.
    Runs asynchronously in the background.
    """
    paths = storage.get_session_paths(session_id)
    if not os.path.exists(paths.motion_json):
        raise HTTPException(status_code=404, detail="motion_data.json not found. Processing must finish first.")
        
    background_tasks.add_task(_generate_task, session_id)
    return {"message": "Visualization generation started in the background."}


@router.get("/visualize/{session_id}/video")
async def get_video(session_id: str = Path(...)):
    """
    Returns the generated skeleton overlay MP4 file.
    """
    paths = storage.get_session_paths(session_id)
    if not os.path.exists(paths.skeleton_video):
        raise HTTPException(status_code=404, detail="Video not generated yet.")
        
    return FileResponse(
        path=paths.skeleton_video,
        media_type="video/mp4",
        filename=f"skeleton_overlay_{session_id}.mp4"
    )


@router.get("/visualize/{session_id}/gif")
async def get_gif(session_id: str = Path(...)):
    """
    Returns the generated preview GIF file.
    """
    paths = storage.get_session_paths(session_id)
    if not os.path.exists(paths.preview_gif):
        raise HTTPException(status_code=404, detail="GIF not generated yet.")
        
    return FileResponse(
        path=paths.preview_gif,
        media_type="image/gif",
        filename=f"preview_{session_id}.gif"
    )
