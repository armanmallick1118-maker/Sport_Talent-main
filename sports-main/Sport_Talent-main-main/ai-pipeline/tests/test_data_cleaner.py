import pytest
import numpy as np

from core.data_cleaner import DataCleaner
from core.pose_estimator import PoseResult, LandmarkData
from core.person_detector import BoundingBox
from core.quality_checker import QualityReport

@pytest.fixture
def cleaner():
    return DataCleaner(interpolation_method="linear", smoothing_window=3, polyorder=1)

def create_sequence(validity: list) -> tuple[list[PoseResult], list[QualityReport]]:
    frames = []
    reports = []
    
    for i, is_valid in enumerate(validity):
        # Frame 0 is y=0, Frame 1 is y=1, etc.
        val = float(i)
        
        # If invalid, we simulate missing landmarks or low visibility.
        # But we still create the PoseResult (or we make it has_pose=False)
        # Let's make it has_pose=False if not valid to test interpolation
        
        landmarks = {}
        if is_valid:
            for name in ["nose", "left_shoulder"]:
                landmarks[name] = LandmarkData(
                    name=name, index=0, x=val, y=val, z=0.0, visibility=0.9,
                    world_x=val, world_y=val, world_z=0.0
                )
                
        pose = PoseResult(
            frame_number=i,
            timestamp_ms=i * 33.3,
            landmarks=landmarks,
            has_pose=is_valid,
            detection_confidence=0.9 if is_valid else 0.0,
            segmentation_mask=None,
            raw_result=None
        )
        frames.append(pose)
        
        reports.append(QualityReport(
            overall_score=0.9 if is_valid else 0.1,
            is_valid=is_valid,
            avg_visibility=0.9 if is_valid else 0.1,
            low_visibility_landmarks=[],
            missing_critical_landmarks=["nose"] if not is_valid else [],
            issues=["POSE_NOT_DETECTED"] if not is_valid else []
        ))
        
    return frames, reports

def test_interpolation_fills_gaps(cleaner):
    # Valid, Invalid, Valid
    # The missing frame (val=1) should be interpolated between val=0 and val=2
    frames, reports = create_sequence([True, False, True])
    
    seq = cleaner.clean_sequence(frames, reports)
    cleaned = seq.frames
    
    assert seq.interpolated_frames_count == 1
    assert len(cleaned) == 3
    
    assert cleaned[0].landmarks["nose"].x == 0.0
    
    # Check interpolation worked
    assert cleaned[1].has_pose is True
    assert "nose" in cleaned[1].landmarks
    assert cleaned[1].landmarks["nose"].x == pytest.approx(1.0) # linear midpoint of 0 and 2
    
    assert cleaned[2].landmarks["nose"].x == 2.0

def test_smoothing_reduces_jitter():
    # We test smoothing explicitly
    cleaner = DataCleaner(interpolation_method="linear", smoothing_window=3, polyorder=1)
    
    # Create noisy sequence: 0, 10, 2, 0
    frames, reports = create_sequence([True, True, True, True])
    frames[0].landmarks["nose"].x = 0.0
    frames[1].landmarks["nose"].x = 10.0 # Huge spike
    frames[2].landmarks["nose"].x = 2.0
    frames[3].landmarks["nose"].x = 0.0
    
    seq = cleaner.clean_sequence(frames, reports)
    cleaned = seq.frames
    
    # Savitzky-Golay with window 3, poly 1 will essentially average out the spike
    # Not testing the exact math, but it should be significantly less than 10
    assert cleaned[1].landmarks["nose"].x < 10.0
    assert seq.smoothed is True

def test_outlier_removal_via_invalidation(cleaner):
    # A single frame bounded by True but with is_valid=False report
    # The cleaner should treat it as missing and interpolate it
    frames, reports = create_sequence([True, True, True])
    # manually invalidate middle frame via report
    reports[1].is_valid = False
    
    frames[1].landmarks["nose"].x = 999.0 # outlier data
    
    seq = cleaner.clean_sequence(frames, reports)
    
    # The outlier data should be replaced by interpolation
    assert seq.frames[1].landmarks["nose"].x != 999.0
    assert seq.interpolated_frames_count == 1
