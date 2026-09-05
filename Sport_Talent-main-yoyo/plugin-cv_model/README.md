# ATHENA-MOTION: Biomechanical Computer Vision & CPU-Trained ML Pipeline

[![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![MediaPipe Tasks](https://img.shields.io/badge/mediapipe-1.0%2B-teal.svg)](https://developers.google.com/mediapipe)
[![ONNX Runtime](https://img.shields.io/badge/onnx-runtime-purple.svg)](https://onnxruntime.ai/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

A modular, high-performance, and fully reusable Python computer vision and machine learning engine for real-time athletic biomechanics, exercise recognition, and kinematic form auditing.

---

## Architecture Flow

```
VIDEO (File / Webcam / Stream)
  ↓
OpenCV (Frame Capture, Scaling, Visual HUD Rendering)
  ↓
MediaPipe Pose (33 3D landmarks + EMA jitter smoothing)
  ↓
33 Landmarks (Normalized spatial coords, visibility, spatial stability)
  ↓
Biomechanical Calculations (Joint angles, trunk inclination, depth ratio, knee valgus, symmetry)
  ↓
Training Dataset (Tabular & temporal 148-D feature vectors, synthetic & video generators)
  ↓
CPU-Trained ML Model (HistGradientBoosting / RandomForest / <2ms CPU latency)
  ↓
ATHENA-MOTION Engine (Unified API, CLI, ONNX Export, Cross-Project Plugin)
```

---

## Key Features

- **Standard 33-Landmark Pose Detection**: Powered by Google MediaPipe Tasks with automatic asset resolution and Exponential Moving Average (EMA) smoothing to eliminate frame-to-frame landmark jitter.
- **Clinically Grounded Biomechanics**:
  - 2D & 3D Joint Angles: Knees, Hips, Elbows, Shoulders, Ankles.
  - Posture & Spine: Trunk inclination angle relative to gravity axis, bilateral shoulder and hip tilt.
  - Functional Ratios: Squat depth ratio (hip crease vs knee line normalized by femur length), knee valgus/varus tracking ratio, and stance width ratio.
- **Hysteresis-Based Repetition Counter**: State machine tracking exercise phases (`IDLE` $\rightarrow$ `ECCENTRIC` $\rightarrow$ `INFLECTION` $\rightarrow$ `CONCENTRIC` $\rightarrow$ `COMPLETED`), tempo duration, and movement consistency scores ($0-100\%$).
- **Zero-GPU CPU Training**: Trains high-accuracy dual-target classifiers in seconds on standard CPU cores using `HistGradientBoosting`.
- **Sub-2ms CPU Inference**: Capable of processing over $500$ frames per second on a single CPU core.
- **Universal Cross-Project Reusability**:
  1. Standard pip package (`pip install -e .`) for plug-and-play Python imports.
  2. Standalone **ONNX** export (`.onnx`) and metadata JSON for zero-dependency inference in Node.js, Next.js, C++, Rust, or edge runtimes.
  3. Pre-configured FastAPI router plugin ready to mount onto the Athena Personal Wellness backend.

---

## Installation

### In Current Workspace or Any Python Project
```bash
git clone <repo-or-copy-folder>
cd plugin-cv_model

# Install in editable mode
pip install -e .
```

---

## How to Reuse This in Other Projects

### Method 1: Import as a Python Package
In any other Python project or service:
```python
from athena_motion import AthenaMotionPipeline

# Initialize pipeline
pipeline = AthenaMotionPipeline()

# Option A: Analyze a video file
summary = pipeline.process_video(
    input_path="workout.mp4",
    output_path="analyzed_output.mp4"
)
print(f"Reps completed: {summary['completed_reps']}")
print(f"Consistency: {summary['consistency_score']}%")

# Option B: Analyze frame-by-frame (e.g. from camera, OpenCV, or web upload)
result = pipeline.analyze_frame(frame_bgr, render_overlay=True)
print(f"Exercise: {result.exercise}")
print(f"Form Quality: {result.form_quality}")
print(f"Coaching Cue: {result.feedback_cue}")
```

### Method 2: Zero-Dependency ONNX Runtime
Train and export the model to ONNX:
```bash
athena-motion train --export-onnx assets/models/onnx
```

In any external project (even without `scikit-learn` or `torch` installed):
```python
import numpy as np
from athena_motion import OnnxMotionRunner

# Load standalone ONNX runner
runner = OnnxMotionRunner("assets/models/onnx")

# Run inference on 148-dimensional feature vector
prediction = runner.predict(feature_vector)
print(prediction.exercise, prediction.form_quality, prediction.feedback_cue)
```

### Method 3: Drop-in FastAPI Microservice Router
Mount the pre-built router in your FastAPI backend (e.g. Athena Personal Wellness platform):
```python
from fastapi import FastAPI
from athena_motion.examples.04_fastapi_plugin_example import motion_router

app = FastAPI()
app.include_router(motion_router, prefix="/api/v1/motion", tags=["Motion Intelligence"])
```

Endpoints provided:
- `POST /api/v1/motion/analyze-frame`: Base64 frame input $\rightarrow$ Full biomechanical telemetry.
- `POST /api/v1/motion/reset`: Resets rep counters.
- `GET /api/v1/motion/status`: Session telemetry and model info.

---

## Command Line Interface (CLI)

```bash
# 1. Train CPU Model on synthetic biomechanics dataset & export to Joblib + ONNX
athena-motion train --samples-per-class 300 --export-onnx assets/models/onnx

# 2. Analyze a video file with visual HUD overlay
athena-motion analyze --video input_exercise.mp4 --output analyzed.mp4

# 3. Launch live webcam feedback coach
athena-motion live --camera 0

# 4. Benchmark CPU inference latency
athena-motion benchmark --iterations 500
```

---

## Feature Vector Schema (148 Features)

| Feature Range | Source | Description |
|---|---|---|
| `[0:132]` | MediaPipe Pose | 33 body landmarks $\times$ 4 coordinates (`x, y, z, visibility`) normalized relative to pelvis midpoint and torso scale. |
| `[132:134]` | Biomechanics | Left & Right Knee flexion angles ($0^\circ - 180^\circ$). |
| `[134:136]` | Biomechanics | Left & Right Hip angles ($0^\circ - 180^\circ$). |
| `[136:138]` | Biomechanics | Left & Right Elbow angles ($0^\circ - 180^\circ$). |
| `[138:140]` | Biomechanics | Left & Right Shoulder angles ($0^\circ - 180^\circ$). |
| `[140:142]` | Biomechanics | Left & Right Ankle angles ($0^\circ - 180^\circ$). |
| `[142]` | Biomechanics | Trunk inclination angle relative to vertical axis ($0^\circ - 90^\circ$). |
| `[143]` | Biomechanics | Shoulder tilt angle deviation from horizontal. |
| `[144]` | Biomechanics | Hip tilt angle deviation from horizontal. |
| `[145]` | Biomechanics | Squat depth ratio (hip crease vs knee joint line). |
| `[146]` | Biomechanics | Knee valgus ratio (knee width vs ankle width). |
| `[147]` | Biomechanics | Stance width ratio (ankle distance vs shoulder width). |

---

## Running Automated Tests

```bash
py -3.13 -m pytest tests/ -v
```
