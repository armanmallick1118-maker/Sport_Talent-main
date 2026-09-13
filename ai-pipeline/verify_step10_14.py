import asyncio
import math
import numpy as np

from core.pose_estimator import PoseEstimator, PoseResult, LandmarkData, compute_joint_angles
from core.quality_checker import QualityChecker, QualityIssue
from core.data_cleaner import DataCleaner

# Color constants for terminal output
G = "\033[92m"
R = "\033[91m"
B = "\033[94m"
M = "\033[95m"
C = "\033[0m"


def print_pass(msg):
    print(f"  {G}✅ PASS{C}  {msg}")

def print_fail(msg):
    print(f"  {R}❌ FAIL{C}  {msg}")

def test_pose_estimator():
    print(f"\n{B}── Steps 10-12: PoseEstimator & Angles ──{C}")
    passed = 0
    try:
        estimator = PoseEstimator(model_complexity=0)
        
        # Test 1: Blank frame should return has_pose=False safely
        blank_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        res_blank = estimator.estimate(blank_frame)
        if not res_blank.has_pose and len(res_blank.landmarks) == 0:
            print_pass("Handles blank frame (has_pose=False)")
            passed += 1
        else:
            print_fail("Expected no pose on blank frame")
            
        # Test 2: Angle calculation on dummy data
        # Let's create a perfect 90 degree knee
        landmarks = {
            'left_hip': LandmarkData('left_hip', 23, 0, 0, 0, 1.0, 0.0, 1.0, 0.0),
            'left_knee': LandmarkData('left_knee', 25, 0, 0, 0, 1.0, 0.0, 0.0, 0.0),
            'left_ankle': LandmarkData('left_ankle', 27, 0, 0, 0, 1.0, 1.0, 0.0, 0.0),
        }
        angles = compute_joint_angles(landmarks)
        if 'left_knee_angle' in angles and math.isclose(angles['left_knee_angle'], 90.0, abs_tol=0.1):
            print_pass(f"Biomechanical angles computed correctly ({angles['left_knee_angle']} degrees)")
            passed += 1
        else:
            print_fail("Failed to compute joint angles correctly")
            
        estimator.close()
        
    except Exception as e:
        print_fail(f"PoseEstimator crashed: {e}")
        
    return passed

def test_quality_checker():
    print(f"\n{B}── Step 13: QualityChecker ──{C}")
    passed = 0
    try:
        checker = QualityChecker()
        
        # Test 1: Empty pose -> POSE_NOT_DETECTED
        empty_pose = PoseResult(0, 0.0, {}, False, 0.0, None, None)
        report1 = checker.check_frame(empty_pose)
        if not report1.is_valid and QualityIssue.POSE_NOT_DETECTED in report1.issues:
            print_pass("Empty pose -> POSE_NOT_DETECTED")
            passed += 1
        else:
            print_fail("Failed on empty pose check")
            
        # Test 2: Missing critical landmarks
        landmarks = {
            'nose': LandmarkData('nose', 0, 0.5, 0.5, 0.0, 0.9, 0,0,0)
            # missing shoulders, hips, knees
        }
        bad_pose = PoseResult(1, 33.3, landmarks, True, 0.9, None, None)
        report2 = checker.check_frame(bad_pose)
        if not report2.is_valid and QualityIssue.MISSING_CRITICAL_LANDMARK in report2.issues:
            print_pass("Missing critical landmarks properly flagged")
            passed += 1
        else:
            print_fail("Failed to flag missing critical landmarks")
            
    except Exception as e:
        print_fail(f"QualityChecker crashed: {e}")
        
    return passed

def test_data_cleaner():
    print(f"\n{B}── Step 14: DataCleaner ──{C}")
    passed = 0
    try:
        cleaner = DataCleaner(smoothing_window=3, polyorder=1)
        checker = QualityChecker(critical_landmarks=[])
        
        # Make 3 frames. Middle frame is missing (no pose)
        lm1 = {
            'nose': LandmarkData('nose', 0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0),
            'left_knee': LandmarkData('left_knee', 25, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0)
        }
        lm3 = {
            'nose': LandmarkData('nose', 0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0),
            'left_knee': LandmarkData('left_knee', 25, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0)
        }
        
        f1 = PoseResult(0, 0.0, lm1, True, 1.0, None, None)
        f2 = PoseResult(1, 33.3, {}, False, 0.0, None, None)
        f3 = PoseResult(2, 66.6, lm3, True, 1.0, None, None)
        
        frames = [f1, f2, f3]
        reports = [checker.check_frame(f) for f in frames]
        
        cleaned = cleaner.clean_sequence(frames, reports)
        
        if cleaned.interpolated_frames_count == 1:
            print_pass("Successfully interpolated missing frame")
            passed += 1
        else:
            print_fail(f"Expected 1 interpolated frame, got {cleaned.interpolated_frames_count}")
            
        mid_frame = cleaned.frames[1]
        if mid_frame.has_pose and 'nose' in mid_frame.landmarks:
            val = mid_frame.landmarks['nose'].x
            # linear interpolation between 0.0 and 1.0 = 0.5
            if math.isclose(val, 0.5, abs_tol=0.1):
                print_pass("Linear interpolation values are correct (0.5)")
                passed += 1
            else:
                print_fail(f"Interpolation value wrong, expected 0.5, got {val}")
        else:
            print_fail("Middle frame not interpolated properly")
            
    except Exception as e:
        print_fail(f"DataCleaner crashed: {e}")
        
    return passed

def main():
    print(f"\n{M}Verifying Phase 3 (Steps 10-14)…{C}")
    
    p1 = test_pose_estimator()
    p2 = test_quality_checker()
    p3 = test_data_cleaner()
    
    total = p1 + p2 + p3
    print(f"\n{M}FINAL RESULT{C}")
    print(f"Passed : {total}/6")
    if total == 6:
        print(f"{G}🎉 Phase 3 COMPLETE — MediaPipe + Quality + Cleaning verified!{C}\n")
    else:
        print(f"{R}⚠️ Some checks failed.{C}\n")

if __name__ == "__main__":
    main()
