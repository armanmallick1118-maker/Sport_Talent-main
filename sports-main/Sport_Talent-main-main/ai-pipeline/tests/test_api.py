import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
import time
import os
import shutil

from api.main import app
from core.storage_manager import StorageManager

# Need a small sample video for integration testing
# We will create a dummy file just to pass through the initial upload,
# but a real integration test would use a real MP4.
# We'll mock the actual MediaPipeline for this API test, or provide a real video if available.
# Let's provide a fixture that handles it.

# Actually, httpx AsyncClient handles FastAPI directly.
# For full end-to-end, we might want to test the background worker.

@pytest.fixture
def anyio_backend():
    return 'asyncio'

@pytest.fixture(autouse=True)
def setup_test_env():
    # Make sure storage dir exists
    storage = StorageManager()
    app.state.storage = storage # Point app to test storage
    
    yield

@pytest.mark.anyio
async def test_full_pipeline_api():
    # Since we might not have a real video in CI, let's just test that the endpoints
    # accept the requests properly.
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Test POST /process
        # We need a session_id. Let's just create a dummy session in storage_test
        storage = StorageManager()
        session_id = "test_e2e_session"
        storage.create_session(session_id)
        storage.update_status(session_id, "UPLOADED")
        
        # We need a dummy video file in the session dir
        video_dir = storage.get_session_paths(session_id).upload_dir
        dummy_video = video_dir / "video.mp4"
        dummy_video.write_bytes(b"dummy_video_data")
        
        # Trigger process
        resp = await client.post("/api/v1/process", json={
            "session_id": session_id,
            "frame_skip": 2,
            "model_complexity": 0
        })
        
        assert resp.status_code == 202
        assert resp.json()["status"] == "PENDING"
        
        # 2. Test GET /status
        # The background task might fail because the video is a dummy,
        # but we can check if status endpoint returns properly.
        resp = await client.get(f"/api/v1/process/{session_id}/status")
        assert resp.status_code == 200
        data = resp.json()
        assert "status" in data
        
        # 3. We won't test /results here because processing a dummy video fails.
        # But we verify the endpoints are up.
