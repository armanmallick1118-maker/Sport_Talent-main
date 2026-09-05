"""
tests/test_video_ingestion.py
=============================
Unit tests for the VideoIngestion module (Step 7), including:
- Metadata extraction
- Frame extraction (with skip and resize)
- Bounds checking and ROI cropping
"""

import math
from pathlib import Path

import cv2
import numpy as np
import pytest

from core.video_ingestion import FrameData, VideoIngestion, VideoMetadataResult

# A dummy path for when we mock OpenCV
DUMMY_VIDEO = Path("tests/fixtures/dummy.mp4")


@pytest.fixture(scope="module")
def sample_video(tmp_path_factory):
    """Creates a small actual video file for testing extraction."""
    d = tmp_path_factory.mktemp("videos")
    vid_path = d / "test_1920x1080.mp4"
    
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(str(vid_path), fourcc, 30.0, (1920, 1080))
    
    for i in range(15):  # 15 frames
        frame = np.zeros((1080, 1920, 3), dtype=np.uint8)
        # Add some color to ensure BGR/RGB differences
        frame[:, :, 0] = 255  # Full blue
        out.write(frame)
        
    out.release()
    return vid_path


def test_metadata_extraction(sample_video):
    """Test static extraction of metadata."""
    meta = VideoIngestion.extract_metadata(sample_video)
    
    assert isinstance(meta, VideoMetadataResult)
    assert meta.is_readable is True
    assert meta.width == 1920
    assert meta.height == 1080
    assert meta.total_frames == 15
    assert meta.fps == 30.0
    assert meta.duration_seconds == 0.5
    assert meta.file_size_bytes > 0
    assert meta.resolution == (1920, 1080)
    # 1920 / 1080 = 1.7778
    assert math.isclose(meta.aspect_ratio, 1.7778, abs_tol=0.01)


def test_invalid_video_path():
    """Test missing file behaviour."""
    # Instance creation should fail
    with pytest.raises(FileNotFoundError):
        VideoIngestion("nonexistent.mp4")
        
    # Static metadata extraction should return an unreadable result
    meta = VideoIngestion.extract_metadata("nonexistent.mp4")
    assert meta.is_readable is False
    assert meta.fps == 0.0


def test_extract_frames_count(sample_video):
    """Test that frame skipping yields correct number of frames."""
    ingest = VideoIngestion(sample_video, frame_skip=5)
    frames = list(ingest.extract_frames())
    
    # 15 total frames, skipping every 5 -> frames 0, 5, 10
    assert len(frames) == 3
    assert frames[0].frame_number == 0
    assert frames[1].frame_number == 5
    assert frames[2].frame_number == 10


def test_auto_resize_behavior(sample_video):
    """Test that videos > 1280x720 are auto-resized for performance."""
    # sample_video is 1920x1080.
    # If no target_resolution is specified, it should be clamped to 1280x720 max.
    ingest = VideoIngestion(sample_video, frame_skip=15)
    frames = list(ingest.extract_frames())
    
    assert len(frames) == 1
    f = frames[0]
    
    # Check that original is retained
    assert f.original_width == 1920
    assert f.original_height == 1080
    
    # Check that it got resized
    assert f.was_resized is True
    assert f.width == 1280
    assert f.height == 720


def test_explicit_resize_behavior(sample_video):
    """Test that explicit target_resolution overrides auto-resize."""
    ingest = VideoIngestion(sample_video, frame_skip=15, target_resolution=(640, 480))
    frames = list(ingest.extract_frames())
    
    assert len(frames) == 1
    f = frames[0]
    
    assert f.was_resized is True
    assert f.width == 640
    assert f.height == 480


def test_rgb_bgr_conversion(sample_video):
    """Test that BGR and RGB frames are correctly separated."""
    ingest = VideoIngestion(sample_video, frame_skip=15)
    f = next(ingest.extract_frames())
    
    # We painted the whole dummy video pure OpenCV Blue (BGR: 255, 0, 0)
    # Video compression changes exact values, so we check for dominance
    # BGR check: Blue channel is dominant
    assert np.all(f.image_bgr[:, :, 0] > 240)
    assert np.all(f.image_bgr[:, :, 1] < 15)
    assert np.all(f.image_bgr[:, :, 2] < 15)
    
    # RGB check: Red channel (which was Blue in BGR) should now be in the 3rd index
    assert np.all(f.image_rgb[:, :, 0] < 15)
    assert np.all(f.image_rgb[:, :, 1] < 15)
    assert np.all(f.image_rgb[:, :, 2] > 240)


def test_extract_roi():
    """Test bounding box cropping and padding."""
    dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    
    # We can use any dummy path to init since we aren't calling extract_frames()
    ingest = VideoIngestion.__new__(VideoIngestion)
    
    # Normal crop
    roi = ingest.extract_roi(dummy_frame, bbox=(100, 100, 200, 200), padding_pct=0.0)
    assert roi.shape == (100, 100, 3)
    
    # With 10% padding (10px on all sides of a 100x100 box -> 120x120)
    roi_pad = ingest.extract_roi(dummy_frame, bbox=(100, 100, 200, 200), padding_pct=0.1)
    assert roi_pad.shape == (120, 120, 3)
    
    # Out of bounds clamping
    roi_edge = ingest.extract_roi(dummy_frame, bbox=(600, 400, 700, 500), padding_pct=0.0)
    # Capped to right/bottom frame edges (640, 480)
    assert roi_edge.shape == (80, 40, 3)  # H=(480-400), W=(640-600)
