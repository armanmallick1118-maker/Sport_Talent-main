# Exercise AI Module for Sports & Talent Tracker

A lightweight, high-performance, machine-learning-based exercise posture analysis and repetition counting module built for the **AI Sports & Talent Tracker**.

---

## 1. Supported Exercises & Capabilities

| Exercise | Landmarks (Features) | ML Posture/Stage Model | Geometric Form Analysis | Rep Counter | Form Scoring (0–100) |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **Squat** | 9 landmarks (36 values) | Stage: `UP` vs. `DOWN` | Knee angle depth, foot/shoulder width ratio, knee tracking | ✅ State machine | ✅ Biomechanical |
| **Lunge** | 13 landmarks (52 values) | Stage: `I`, `M`, `D`<br>Error: `C` vs. `L` (knee over toe) | Front/rear knee angles (60°–125°), lead leg detection | ✅ State machine | ✅ Biomechanical |
| **Plank** | 17 landmarks (68 values) | Posture: `C`, `L` (low back), `H` (high back) | Shoulder-hip-ankle line alignment, lumbar curvature | Continuous hold | ✅ Temporal stability |
| **Bicep Curl** | 9 landmarks (36 values) | Posture: `C` vs. `L` (lean back) | Dual arm tracking, curl angle, elbow sway / loose arm, peak contraction | ✅ State machine | ✅ Range of motion |

---

## 2. Directory Structure

```text
Exercise-Correction-main/
│
├── core/
│   ├── squat_model/
│   │   ├── train.csv, test.csv, analyze_pose.csv
│   │   └── model/ (squat_model.pkl, LR_model.pkl)
│   ├── lunge_model/
│   │   ├── stage.train.csv, stage.test.csv, err.train.csv, err.test.csv, knee_angle.csv, knee_angle_2.csv
│   │   └── model/ (input_scaler.pkl, sklearn/stage_LR_model.pkl, sklearn/err_LR_model.pkl)
│   ├── plank_model/
│   │   ├── train.csv, test.csv, kaggle.csv
│   │   └── model/ (LR_model.pkl, input_scaler.pkl)
│   └── bicep_model/
│       ├── train.csv, test.csv
│       └── model/ (input_scaler.pkl, KNN_model.pkl, LR_model.pkl)
│
├── web/
│   └── server/
│       └── detection/
│           ├── __init__.py
│           ├── main.py          # Unified ExerciseDetector engine
│           ├── utils.py         # Angle & distance geometry, landmark vector extraction
│           ├── scoring.py       # Biomechanical 0-100 form scoring & feedback
│           ├── squat.py         # Squat detector
│           ├── lunge.py         # Lunge detector
│           ├── plank.py         # Plank detector
│           └── bicep_curl.py    # Bicep curl detector
│
├── training/
│   ├── collect_data.py          # Real-time MediaPipe sample recorder
│   ├── prepare_data.py          # Dataset inspection and health validation
│   └── train_models.py          # Model training, evaluation & serialization
│
├── requirements.txt
├── README.md
├── LICENSE
└── .gitignore
```

---

## 3. Installation

Ensure you have Python 3.11 installed:

```bash
pip install -r requirements.txt
```

Core dependencies:
- `opencv-python>=4.6.0`
- `mediapipe==0.10.14`
- `scikit-learn>=1.1.0`
- `pandas>=1.4.0`
- `numpy>=1.23.0`

---

## 4. Quick Start: Python API

### Frame-by-Frame Processing
```python
import cv2
from web.server.detection.main import ExerciseDetector

detector = ExerciseDetector("squat")
cap = cv2.VideoCapture(0)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    result = detector.process_frame(frame, draw=True)
    print(f"Reps: {result['reps']} | Score: {result['score']} | Stage: {result['stage']}")
    cv2.imshow("Squat Detector", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
detector.close()
```

### Video File Analysis
```python
from web.server.detection.main import ExerciseDetector

detector = ExerciseDetector("lunge")
summary = detector.process_video("path/to/video.mp4")
print(summary)
# Returns structured dictionary with total frames, reps, average form score, top errors, coaching feedback.
```

---

## 5. Structured Output Schema

```json
{
  "status": "success",
  "exercise": "squat",
  "total_frames_analyzed": 514,
  "reps": 6,
  "average_form_score": 81.8,
  "common_errors": [
    { "message": "Squat depth is insufficient", "count": 175 },
    { "message": "Knees are caving inward (valgus collapse)", "count": 132 },
    { "message": "Feet are too close together", "count": 84 }
  ],
  "feedback": [
    "Push your knees outward, aligned over your toes.",
    "Squat deeper — aim for thighs parallel to ground."
  ]
}
```

---

## 6. Training & Data Collection Pipeline

### 1. Collect Custom Training Samples
```bash
python training/collect_data.py --exercise squat --label down --source 0 --output custom_squats.csv
```

### 2. Validate Dataset Integrity
```bash
python training/prepare_data.py
```

### 3. Retrain All Models
```bash
python training/train_models.py
```
Outputs precision, recall, F1, and confusion matrix, and saves serialized `.pkl` files with 100% environment compatibility.
