"""
Unit Tests for End-to-End ATHENA-MOTION Pipeline Integration & Reusability.
"""

import pytest
import numpy as np
import cv2

from athena_motion.pipeline import AthenaMotionPipeline, FrameAnalysisResult
from athena_motion.dataset.schema import ExerciseType

def test_pipeline_instantiation_and_frame_analysis():
    # Instantiates pipeline (which auto-trains lightweight CPU model if missing)
    pipeline = AthenaMotionPipeline(exercise_type=ExerciseType.SQUAT)
    assert pipeline is not None

    # Test processing on blank frame (no person detected)
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    res = pipeline.analyze_frame(frame, render_overlay=True)

    assert isinstance(res, FrameAnalysisResult)
    assert res.person_detected is False
    assert res.feedback_cue == "STEP INTO FRAME"
    assert res.annotated_frame is not None
    assert res.annotated_frame.shape == (480, 640, 3)

    # Test dictionary export
    res_dict = res.to_dict()
    assert "exercise" in res_dict
    assert "rep_count" in res_dict
    assert "consistency_score" in res_dict

    pipeline.close()

def test_pipeline_reset():
    pipeline = AthenaMotionPipeline()
    pipeline.rep_counter.rep_count = 5
    pipeline.reset()
    assert pipeline.rep_counter.rep_count == 0
    pipeline.close()
