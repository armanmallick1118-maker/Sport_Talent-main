"""
verify_step2.py
===============
Step 2 Verification Script — Environment Configuration
Run this after setup to confirm all config, constants, and packages are correct.

Usage:
    python verify_step2.py
"""

import sys
import json
from pathlib import Path


def check(label: str, passed: bool, detail: str = "") -> bool:
    status = "✅ PASS" if passed else "❌ FAIL"
    msg = f"  {status}  {label}"
    if detail:
        msg += f"  →  {detail}"
    print(msg)
    return passed


def separator(title: str):
    print(f"\n{'─'*60}")
    print(f"  {title}")
    print('─'*60)


results = []

# ─────────────────────────────────────────────────────────────
separator("1. Core Package Imports")
# ─────────────────────────────────────────────────────────────

try:
    import mediapipe as mp
    results.append(check("mediapipe", True, f"version {mp.__version__}"))
except ImportError as e:
    results.append(check("mediapipe", False, str(e)))

try:
    import cv2
    results.append(check("opencv-python", True, f"version {cv2.__version__}"))
except ImportError as e:
    results.append(check("opencv-python", False, str(e)))

try:
    import numpy as np
    results.append(check("numpy", True, f"version {np.__version__}"))
except ImportError as e:
    results.append(check("numpy", False, str(e)))

try:
    import scipy
    results.append(check("scipy", True, f"version {scipy.__version__}"))
except ImportError as e:
    results.append(check("scipy", False, str(e)))

try:
    import matplotlib
    results.append(check("matplotlib", True, f"version {matplotlib.__version__}"))
except ImportError as e:
    results.append(check("matplotlib", False, str(e)))

try:
    import pandas as pd
    results.append(check("pandas", True, f"version {pd.__version__}"))
except ImportError as e:
    results.append(check("pandas", False, str(e)))

try:
    import pydantic
    results.append(check("pydantic", True, f"version {pydantic.__version__}"))
except ImportError as e:
    results.append(check("pydantic", False, str(e)))

try:
    import fastapi
    results.append(check("fastapi", True, f"version {fastapi.__version__}"))
except ImportError as e:
    results.append(check("fastapi", False, str(e)))

try:
    import uvicorn
    results.append(check("uvicorn", True, f"version {uvicorn.__version__}"))
except ImportError as e:
    results.append(check("uvicorn", False, str(e)))

try:
    import ultralytics
    results.append(check("ultralytics (YOLOv8)", True, f"version {ultralytics.__version__}"))
except ImportError as e:
    results.append(check("ultralytics (YOLOv8)", False, str(e)))

try:
    import loguru
    results.append(check("loguru", True, "ok"))
except ImportError as e:
    results.append(check("loguru", False, str(e)))

try:
    import pydantic_settings
    results.append(check("pydantic-settings", True, f"version {pydantic_settings.__version__}"))
except ImportError as e:
    results.append(check("pydantic-settings", False, str(e)))

# ─────────────────────────────────────────────────────────────
separator("2. .env File & Settings")
# ─────────────────────────────────────────────────────────────

env_path = Path(".env")
results.append(check(".env file exists", env_path.exists(), str(env_path.resolve())))

try:
    from core.config import settings

    results.append(check("Settings loaded", True, "pydantic-settings OK"))
    results.append(check("FRAME_SKIP valid", settings.FRAME_SKIP >= 1, f"= {settings.FRAME_SKIP}"))
    results.append(check("MODEL_COMPLEXITY valid", settings.MODEL_COMPLEXITY in (0,1,2), f"= {settings.MODEL_COMPLEXITY}"))
    results.append(check("MIN_DETECTION_CONFIDENCE valid", 0 <= settings.MIN_DETECTION_CONFIDENCE <= 1, f"= {settings.MIN_DETECTION_CONFIDENCE}"))
    results.append(check("Supported formats", len(settings.supported_formats_list) > 0, str(settings.supported_formats_list)))
    results.append(check("YOLO model name", settings.yolo_model_name.endswith(".pt"), settings.yolo_model_name))
    results.append(check("API prefix", settings.api_prefix.startswith("/api/"), settings.api_prefix))
    results.append(check("Max video bytes", settings.max_video_size_bytes > 0, f"{settings.MAX_VIDEO_SIZE_MB} MB"))
    results.append(check("Target resolution", True, str(settings.target_resolution)))

    print(f"\n  📋 Config Summary:")
    summary = settings.summary()
    for section, values in summary.items():
        print(f"     [{section}]")
        for k, v in values.items():
            print(f"       {k}: {v}")

except Exception as e:
    results.append(check("Settings loaded", False, str(e)))

# ─────────────────────────────────────────────────────────────
separator("3. Constants Module")
# ─────────────────────────────────────────────────────────────

try:
    from core.constants import (
        LANDMARK_NAMES, LANDMARK_INDEX, BODY_PARTS,
        CRITICAL_LANDMARKS, SKELETON_CONNECTIONS,
        JOINT_ANGLE_DEFS, LANDMARK_BODY_PART, LandmarkIndex,
        ProcessingStatus, TENSOR_NUM_LANDMARKS, TENSOR_NUM_FEATURES
    )

    results.append(check("33 landmark names", len(LANDMARK_NAMES) == 33, f"got {len(LANDMARK_NAMES)}"))
    results.append(check("Reverse lookup dict", len(LANDMARK_INDEX) == 33, f"got {len(LANDMARK_INDEX)}"))
    results.append(check("Body parts coverage", len(BODY_PARTS) == 6, str(list(BODY_PARTS.keys()))))
    results.append(check("Critical landmarks", len(CRITICAL_LANDMARKS) >= 4, str(CRITICAL_LANDMARKS)))
    results.append(check("Skeleton connections", len(SKELETON_CONNECTIONS) > 20, f"{len(SKELETON_CONNECTIONS)} connections"))
    results.append(check("Joint angle defs", len(JOINT_ANGLE_DEFS) >= 10, f"{len(JOINT_ANGLE_DEFS)} angles"))
    results.append(check("LandmarkIndex enum", LandmarkIndex.LEFT_SHOULDER == 11, f"LEFT_SHOULDER = {LandmarkIndex.LEFT_SHOULDER}"))
    results.append(check("Tensor shape", TENSOR_NUM_LANDMARKS == 33 and TENSOR_NUM_FEATURES == 7, f"({TENSOR_NUM_LANDMARKS}, {TENSOR_NUM_FEATURES})"))
    results.append(check("ProcessingStatus", "DONE" in ProcessingStatus.TERMINAL, str(ProcessingStatus.TERMINAL)))

    # Verify all skeleton connection names exist
    bad_connections = [
        (a, b) for a, b in SKELETON_CONNECTIONS
        if a not in LANDMARK_INDEX or b not in LANDMARK_INDEX
    ]
    results.append(check("All connection names valid", len(bad_connections) == 0,
                         f"{len(bad_connections)} bad" if bad_connections else "all valid"))

    # Verify angle defs reference known landmarks
    bad_angles = {}
    for angle, (a, v, c) in JOINT_ANGLE_DEFS.items():
        for pt in (a, v, c):
            if pt not in LANDMARK_INDEX:
                bad_angles[angle] = pt
    results.append(check("All angle landmark refs valid", len(bad_angles) == 0,
                         str(bad_angles) if bad_angles else "all valid"))

except Exception as e:
    results.append(check("Constants module", False, str(e)))

# ─────────────────────────────────────────────────────────────
separator("4. Storage Directories")
# ─────────────────────────────────────────────────────────────

try:
    from core.config import settings
    dirs = {
        "uploads":        settings.upload_dir_abs,
        "frames":         settings.frames_dir_abs,
        "results":        settings.results_dir_abs,
        "visualizations": settings.viz_dir_abs,
        "logs":           settings.logs_dir_abs,
    }
    for name, path in dirs.items():
        results.append(check(f"storage/{name} exists", path.exists(), str(path)))
except Exception as e:
    results.append(check("Storage dirs", False, str(e)))

# ─────────────────────────────────────────────────────────────
separator("5. MediaPipe Smoke Test")
# ─────────────────────────────────────────────────────────────

try:
    import mediapipe as mp
    import numpy as np

    # Create a tiny blank image and run MediaPipe on it (no athlete, just test init)
    dummy_image = np.zeros((480, 640, 3), dtype=np.uint8)

    with mp.solutions.pose.Pose(
        model_complexity=0,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) as pose:
        result = pose.process(dummy_image)
        results.append(check("MediaPipe Pose init", True, "model loaded successfully"))
        results.append(check("Pose on blank image", result is not None, "no crash on empty frame"))
        results.append(check("No landmarks on blank", result.pose_landmarks is None, "expected None"))

    # Verify landmark name mapping
    mp_names = [lm.name for lm in mp.solutions.pose.PoseLandmark]
    results.append(check("MP landmark count", len(mp_names) == 33, f"got {len(mp_names)}"))

except Exception as e:
    results.append(check("MediaPipe smoke test", False, str(e)))

# ─────────────────────────────────────────────────────────────
separator("6. OpenCV Smoke Test")
# ─────────────────────────────────────────────────────────────

try:
    import cv2
    import numpy as np

    dummy = np.zeros((100, 100, 3), dtype=np.uint8)
    gray = cv2.cvtColor(dummy, cv2.COLOR_BGR2GRAY)
    results.append(check("OpenCV color conversion", gray.shape == (100, 100), f"shape={gray.shape}"))

    # Test video capture (won't open, just check init)
    cap = cv2.VideoCapture.__new__(cv2.VideoCapture)
    results.append(check("OpenCV VideoCapture available", True, "class accessible"))

except Exception as e:
    results.append(check("OpenCV smoke test", False, str(e)))

# ─────────────────────────────────────────────────────────────
separator("FINAL RESULT")
# ─────────────────────────────────────────────────────────────

passed = sum(1 for r in results if r)
total  = len(results)
failed = total - passed

print(f"\n  Passed : {passed}/{total}")
if failed:
    print(f"  Failed : {failed}/{total}")

if failed == 0:
    print("\n  🎉  Step 2 COMPLETE — Environment fully configured!\n")
    sys.exit(0)
else:
    print(f"\n  ⚠️   {failed} check(s) failed — review output above\n")
    sys.exit(1)
