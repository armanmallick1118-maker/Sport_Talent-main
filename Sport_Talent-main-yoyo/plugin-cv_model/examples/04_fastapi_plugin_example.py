"""
Example 04: Drop-in FastAPI Plugin for ATHENA Personal Wellness Platform.
Provides REST and WebSocket ready routers that can be mounted directly onto
the Athena backend (or any FastAPI application) to provide real-time biomechanics.
"""

from typing import Dict, Any
import base64
import numpy as np
import cv2
from fastapi import FastAPI, APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel

from athena_motion import AthenaMotionPipeline

# Create a self-contained router that other projects can import:
# e.g. from plugin_cv_model.examples.04_fastapi_plugin_example import motion_router
# app.include_router(motion_router, prefix="/api/v1/motion", tags=["Motion Intelligence"])
motion_router = APIRouter(prefix="/motion", tags=["Athena Motion Intelligence"])

# Initialize pipeline once on module load
pipeline = AthenaMotionPipeline()

class FrameBase64Request(BaseModel):
    image_base64: str # JPEG / PNG encoded in base64
    timestamp_sec: float = 0.0

@motion_router.post("/analyze-frame")
async def analyze_frame_endpoint(req: FrameBase64Request) -> Dict[str, Any]:
    """Analyzes a base64 encoded frame and returns complete biomechanical telemetry."""
    try:
        # Decode base64 to OpenCV BGR image
        encoded_data = req.image_base64.split(",")[-1]
        img_bytes = base64.b64decode(encoded_data)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image data")

        # Run through Athena-Motion pipeline
        result = pipeline.analyze_frame(frame, timestamp_sec=req.timestamp_sec, render_overlay=False)
        return result.to_dict(include_frame=False)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@motion_router.post("/reset")
async def reset_repetition_counter() -> Dict[str, str]:
    """Resets repetition counter and phase state."""
    pipeline.reset()
    return {"status": "success", "message": "Repetition state machine reset."}

@motion_router.get("/status")
async def motion_status() -> Dict[str, Any]:
    """Returns status, model version, and current session repetition statistics."""
    return {
        "engine": "ATHENA-MOTION",
        "version": "0.1.0",
        "current_rep_count": pipeline.rep_counter.rep_count,
        "current_phase": pipeline.rep_counter.current_phase.value,
        "consistency_score": pipeline.rep_counter.get_consistency_score(),
        "hardware_acceleration": "CPU-Optimized (XNNPACK + HistGradientBoosting)"
    }

# Standalone execution demo
if __name__ == "__main__":
    import uvicorn
    demo_app = FastAPI(title="ATHENA-MOTION Plugin API")
    demo_app.include_router(motion_router)
    print("Starting ATHENA-MOTION FastAPI server on http://127.0.0.1:8001 ...")
    uvicorn.run(demo_app, host="127.0.0.1", port=8001)
