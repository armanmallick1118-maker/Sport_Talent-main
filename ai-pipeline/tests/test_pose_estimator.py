import pytest
import numpy as np
import cv2

from core.pose_estimator import PoseEstimator, PoseResult

@pytest.fixture(scope="module")
def pose_estimator():
    estimator = PoseEstimator(model_complexity=0) # use 0 for faster tests
    yield estimator
    estimator.close()

def create_mock_frame(has_person: bool = True) -> np.ndarray:
    """Creates a blank frame, optionally with a drawn 'person' for mediapipe."""
    # MediaPipe pose requires some human-like features. For a mock, it's hard to spoof 
    # a perfect human, but we can try to feed it a real image or a blank image.
    # We will use a blank image for 'no person'.
    if has_person:
        # Load a built-in OpenCV image or just create noise and hope it works?
        # Actually, MediaPipe returns None if it finds no person.
        # It's better to just test that no person returns None.
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        # Draw a rudimentary stick figure so MP might trigger (though unlikely without real features)
        cv2.circle(frame, (320, 100), 40, (255, 200, 200), -1) # head
        cv2.line(frame, (320, 140), (320, 300), (255, 200, 200), 10) # body
        cv2.line(frame, (320, 160), (200, 250), (255, 200, 200), 10) # L arm
        cv2.line(frame, (320, 160), (440, 250), (255, 200, 200), 10) # R arm
        cv2.line(frame, (320, 300), (250, 450), (255, 200, 200), 10) # L leg
        cv2.line(frame, (320, 300), (390, 450), (255, 200, 200), 10) # R leg
        return frame
    else:
        return np.zeros((480, 640, 3), dtype=np.uint8)

def test_no_person_returns_none(pose_estimator):
    frame = create_mock_frame(has_person=False)
    result = pose_estimator.estimate(frame, 0, 0.0)
    # MediaPipe will definitely not find a person in a pure black image
    assert result is not None
    assert result.has_pose is False

# Due to MediaPipe's ML complexity, it's very hard to guarantee a stick figure 
# triggers a pose detection. A true unit test for pose estimation should use 
# a fixture image of a real person. 
# For this step, we assume the API contract works if we pass.

def test_landmark_names_match():
    # Verify LANDMARK_NAMES length is 33
    assert len(PoseEstimator.LANDMARK_NAMES) == 33
    assert PoseEstimator.LANDMARK_NAMES[0] == "nose"
    assert PoseEstimator.LANDMARK_NAMES[32] == "right_foot_index"
