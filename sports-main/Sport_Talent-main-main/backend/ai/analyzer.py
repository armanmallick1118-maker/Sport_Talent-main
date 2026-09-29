"""
Sport_Talent-main-main/backend/ai/analyzer.py
============================================
AI Exercise Assessment Analyzer.
Invoked by Node.js backend (assessmentController.js) to process athlete assessment video.

Usage:
    python analyzer.py <video_path> [<exercise_type>]

Returns:
    JSON formatted metrics to stdout for database persistence and frontend display.
"""

import sys
import json
import os

# Ensure UTF-8 output on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# 1. Resolve path to Exercise-Correction-main AI module
current_dir = os.path.dirname(os.path.abspath(__file__))
possible_ai_module_paths = [
    # Sibling directory in workspace
    os.path.normpath(os.path.join(current_dir, "..", "..", "..", "Exercise-Correction-main")),
    # Direct child if copied into Sport_Talent
    os.path.normpath(os.path.join(current_dir, "..", "..", "Exercise-Correction-main")),
    os.path.normpath(os.path.join(current_dir, "Exercise-Correction-main")),
]

module_imported = False
for p in possible_ai_module_paths:
    if os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)

try:
    from web.server.detection.main import ExerciseDetector
    module_imported = True
except ImportError as e:
    pass


def infer_exercise_type(video_path: str, user_hint: str = None) -> str:
    """Infer exercise type from hint or filename."""
    if user_hint and user_hint.strip():
        norm = user_hint.lower().strip().replace("-", "_").replace(" ", "_")
        for key in ["squat", "lunge", "plank", "bicep_curl", "bicep"]:
            if key in norm:
                return "bicep_curl" if "bicep" in key else key

    # Check filename
    filename = os.path.basename(video_path).lower()
    if "lunge" in filename:
        return "lunge"
    elif "plank" in filename:
        return "plank"
    elif "bicep" in filename or "bc" in filename or "curl" in filename:
        return "bicep_curl"
    elif "squat" in filename:
        return "squat"

    # Default to squat
    return "squat"


def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "status": "error",
            "message": "Missing required video_path argument. Usage: python analyzer.py <video_path> [<exercise_type>]"
        }))
        sys.exit(1)

    video_path = sys.argv[1]
    raw_exercise = sys.argv[2] if len(sys.argv) > 2 else None

    if not os.path.exists(video_path):
        print(json.dumps({
            "status": "error",
            "message": f"Video file not found at: {video_path}"
        }))
        sys.exit(1)

    exercise_type = infer_exercise_type(video_path, raw_exercise)

    if not module_imported:
        # Fallback if AI module could not be imported
        import cv2
        cap = cv2.VideoCapture(video_path)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) if cap.isOpened() else 0
        cap.release()
        result = {
            "status": "partial_success",
            "video_processed": video_path,
            "exercise": exercise_type,
            "metrics": {
                "total_frames_analyzed": frame_count,
                "reps": 0,
                "posture_score": "Module dependency loading error",
            }
        }
        print(json.dumps(result))
        sys.stdout.flush()
        return

    try:
        detector = ExerciseDetector(exercise_type)
        summary = detector.process_video(video_path)
        detector.close()

        # Format output to match Node.js controller schema
        response = {
            "status": "success",
            "video_processed": video_path,
            "exercise": summary.get("exercise", exercise_type),
            "metrics": {
                "total_frames_analyzed": summary.get("total_frames_analyzed", 0),
                "reps": summary.get("reps", 0),
                "average_form_score": summary.get("average_form_score", 0.0),
                "posture_score": f"{summary.get('average_form_score', 0.0)}/100",
                "common_errors": summary.get("common_errors", []),
                "coaching_feedback": summary.get("feedback", []),
            },
            "details": summary,
        }

        print(json.dumps(response))
        sys.stdout.flush()

    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": f"Error during AI video analysis: {str(e)}",
            "video_processed": video_path,
        }))
        sys.stdout.flush()
        sys.exit(1)


if __name__ == "__main__":
    main()