import pytest

from core.quality_checker import QualityChecker, QualityIssue
from core.pose_estimator import PoseResult, LandmarkData
from core.person_detector import BoundingBox

@pytest.fixture
def checker():
    return QualityChecker(min_visibility=0.6, critical_landmarks=["nose", "left_shoulder", "right_shoulder"])

def create_mock_pose_result(visibilities: dict, has_pose: bool = True) -> PoseResult:
    landmarks = {}
    if has_pose:
        for i, name in enumerate(["nose", "left_shoulder", "right_shoulder", "left_knee", "right_knee"]):
            vis = visibilities.get(name, 0.9)
            landmarks[name] = LandmarkData(
                name=name, index=i, x=0.5, y=0.5, z=0.0, visibility=vis,
                world_x=0.0, world_y=0.0, world_z=0.0
            )
            
    pose = PoseResult(
        frame_number=0,
        timestamp_ms=0.0,
        landmarks=landmarks,
        has_pose=has_pose,
        detection_confidence=0.9,
        segmentation_mask=None,
        raw_result=None
    )
    pose.person_bbox = BoundingBox(x1=0, y1=0, x2=100, y2=100, confidence=0.9, class_id=0)
    return pose

def test_high_quality_frame_passes(checker):
    pose = create_mock_pose_result({"nose": 0.9, "left_shoulder": 0.8, "right_shoulder": 0.95})
    report = checker.check_frame(pose)
    
    assert report.is_valid is True
    assert len(report.issues) == 0
    assert report.overall_score > 0.8

def test_low_visibility_fails(checker):
    # Overall visibility is low, plus critical landmarks are low
    pose = create_mock_pose_result({"nose": 0.1, "left_shoulder": 0.2, "right_shoulder": 0.3, "left_knee": 0.1, "right_knee": 0.1})
    report = checker.check_frame(pose)
    
    assert report.is_valid is False
    assert QualityIssue.LOW_OVERALL_VISIBILITY in report.issues
    assert QualityIssue.MISSING_CRITICAL_LANDMARK in report.issues

def test_missing_critical_landmark_fails(checker):
    pose = create_mock_pose_result({"nose": 0.9, "left_shoulder": 0.1, "right_shoulder": 0.9})
    report = checker.check_frame(pose)
    
    assert report.is_valid is False
    assert QualityIssue.MISSING_CRITICAL_LANDMARK in report.issues
    assert "left_shoulder" in report.missing_critical_landmarks

def test_no_pose_fails(checker):
    pose = create_mock_pose_result({}, has_pose=False)
    report = checker.check_frame(pose)
    
    assert report.is_valid is False
    assert QualityIssue.POSE_NOT_DETECTED in report.issues
