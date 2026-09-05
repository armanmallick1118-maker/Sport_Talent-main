"""
api/routes/process.py
=====================
Pipeline processing endpoints (Step 9).

Routes:
  POST   /api/v1/process                         → trigger full pipeline for a session
  GET    /api/v1/process/{session_id}/status     → poll processing status + progress
  DELETE /api/v1/process/{session_id}/cancel     → cancel an in-progress job
"""

from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass, field
from typing import Dict, Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from fastapi.responses import JSONResponse

from api.models.request_models import ProcessRequest
from api.models.response_models import ProcessStatusResponse
from core.logger import get_logger
from core.storage_manager import storage_manager

log = get_logger("process_route")

router = APIRouter()

# ─────────────────────────────────────────────────────────────────────────────
#  In-Memory Job Tracking (Step 9)
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class JobState:
    session_id: str
    request: ProcessRequest
    status: str = "PENDING"
    progress_pct: int = 0
    frames_done: int = 0
    total_frames: int = 0
    error_message: Optional[str] = None
    start_time: float = field(default_factory=time.time)
    
    # asyncio.Event used to signal cancellation to the background task
    cancel_event: asyncio.Event = field(default_factory=asyncio.Event)


# Global state for active/recent jobs (cleared on restart)
_jobs: Dict[str, JobState] = {}


# ─────────────────────────────────────────────────────────────────────────────
#  Background Task Stub (Full implementation in Step 22)
# ─────────────────────────────────────────────────────────────────────────────

def _real_pipeline_worker(session_id: str):
    """
    Executes the real pipeline in a background thread.
    Updates the in-memory job state and handles success/failure.
    """
    job = _jobs.get(session_id)
    if not job:
        return
        
    try:
        job.status = "PROCESSING"
        log.info(f"Job {session_id} -> PROCESSING")
        
        # Real pipeline execution
        from core.pipeline import MediaPipeline
        pipeline = MediaPipeline()
        
        def progress_cb(current: int, total: int):
            job.frames_done = current
            job.progress_pct = int((current / total) * 100)
            
        def cancel_cb() -> bool:
            return job.cancel_event.is_set()
            
        summary = pipeline.process_session(
            request=job.request,
            progress_callback=progress_cb,
            is_cancelled=cancel_cb
        )
        
        if job.cancel_event.is_set():
            job.status = "CANCELLED"
            job.progress_pct = 0
            log.info(f"Job {session_id} cancelled.")
            return
        
        # Finish
        job.status = "DONE"
        job.progress_pct = 100
        job.frames_done = summary.processed_frames
        job.total_frames = summary.total_input_frames
        
        storage_manager.update_status(session_id, "DONE")
        log.info(f"Job {session_id} complete")
        
    except Exception as exc:
        job.status = "FAILED"
        job.error_message = str(exc)
        storage_manager.update_status(session_id, "FAILED")
        log.error(f"Job {session_id} failed: {str(exc)}")


# ─────────────────────────────────────────────────────────────────────────────
#  POST /api/v1/process
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/process",
    summary="Trigger full pipeline processing",
    description=(
        "Starts the full pipeline for an uploaded session.\n\n"
        "Processing runs as a background task. Poll `/process/{session_id}/status` "
        "to track progress."
    ),
    status_code=status.HTTP_202_ACCEPTED,
    responses={
        202: {"description": "Processing started."},
        404: {"description": "Session not found."},
        409: {"description": "Job already running or complete."},
    },
)
async def trigger_processing(
    request: ProcessRequest,
    background_tasks: BackgroundTasks,
) -> JSONResponse:
    
    session_id = request.session_id
    
    if not storage_manager.session_exists(session_id):
        raise HTTPException(status_code=404, detail={"error": "session_not_found"})
        
    meta = storage_manager.read_session_meta(session_id)
    
    if meta.status in ["PENDING", "EXTRACTING", "DETECTING", "ESTIMATING", "CLEANING", "EXPORTING", "DONE"]:
        # Allow retrying FAILED or CANCELLED jobs, but block active/completed ones
        force_reprocess = getattr(request, "force_reprocess", False)
        if meta.status != "DONE" or not force_reprocess:
            raise HTTPException(
                status_code=409, 
                detail={"error": "job_active", "message": f"Session status is {meta.status}"}
            )
            
    # Create job state
    job = JobState(session_id=session_id, request=request)
    _jobs[session_id] = job
    
    # Update on disk
    storage_manager.update_status(session_id, "PENDING")
    
    # Launch background worker
    background_tasks.add_task(_real_pipeline_worker, session_id)
    
    log.info("Pipeline triggered | session_id={sid} | skip={s} | comp={c}",
             sid=session_id, s=request.frame_skip, c=request.model_complexity)
             
    return JSONResponse(
        status_code=202,
        content={
            "session_id": session_id,
            "status": "PENDING",
            "message": "Pipeline triggered successfully. Poll /status for progress."
        }
    )


# ─────────────────────────────────────────────────────────────────────────────
#  GET /api/v1/process/{session_id}/status
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/process/{session_id}/status",
    summary="Poll processing status",
    response_model=ProcessStatusResponse,
)
async def get_processing_status(session_id: str) -> ProcessStatusResponse:
    if not storage_manager.session_exists(session_id):
        raise HTTPException(status_code=404, detail={"error": "session_not_found"})
        
    meta = storage_manager.read_session_meta(session_id)
    
    # If it's in memory, use real-time progress
    if session_id in _jobs:
        job = _jobs[session_id]
        elapsed = round(time.time() - job.start_time, 2)
        return ProcessStatusResponse(
            session_id=session_id,
            status=job.status,
            progress_pct=job.progress_pct,
            frames_processed=job.frames_done,
            total_frames=job.total_frames,
            elapsed_seconds=elapsed,
            error=job.error_message,
        )
        
    # If not in memory (e.g. server restarted or job finished a long time ago)
    return ProcessStatusResponse(
        session_id=session_id,
        status=meta.status,
        progress_pct=100 if meta.status == "DONE" else 0,
        frames_processed=0,
        total_frames=meta.total_frames,
        elapsed_seconds=0.0,
    )


# ─────────────────────────────────────────────────────────────────────────────
#  DELETE /api/v1/process/{session_id}/cancel
# ─────────────────────────────────────────────────────────────────────────────

@router.delete(
    "/process/{session_id}/cancel",
    summary="Cancel an in-progress pipeline job",
    status_code=status.HTTP_200_OK,
)
async def cancel_processing(session_id: str) -> JSONResponse:
    if not storage_manager.session_exists(session_id):
        raise HTTPException(status_code=404, detail={"error": "session_not_found"})
        
    if session_id not in _jobs:
        raise HTTPException(
            status_code=400, 
            detail={"error": "no_active_job", "message": "No active job found in memory for this session."}
        )
        
    job = _jobs[session_id]
    if job.status in ["DONE", "FAILED", "CANCELLED"]:
        return JSONResponse(
            content={"session_id": session_id, "status": job.status, "message": "Job already finished."}
        )
        
    job.cancel_event.set()
    job.status = "CANCELLING"
    
    return JSONResponse(
        content={
            "session_id": session_id,
            "status": "CANCELLING",
            "message": "Cancellation signal sent. Status will reflect CANCELLED shortly."
        }
    )
