import os
import cv2
import math
import numpy as np
import mediapipe as mp
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sklearn.ensemble import RandomForestRegressor
from typing import Dict, Any

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# 1. Training Dataset & CPU-trained ML model (ATHENA-MOTION)
# ---------------------------------------------------------
print("Training ATHENA-MOTION local CPU model...")
# Generate a synthetic dataset correlating knee angle and stride consistency to speed/technique
# Features: [avg_knee_angle, stride_frequency, posture_score]
X_train = np.array([
    [160, 4.0, 90],  # Excellent biomechanics
    [140, 3.5, 75],  # Good
    [120, 2.5, 60],  # Average
    [100, 2.0, 50],  # Poor
    [170, 4.5, 95],  # Elite
])
# Targets: [overall_score, speed, technique]
y_train = np.array([
    [85, 90, 80],
    [75, 78, 70],
    [60, 62, 58],
    [45, 50, 40],
    [95, 96, 92],
])

model = RandomForestRegressor(n_estimators=10, random_state=42)
model.fit(X_train, y_train)
print("ATHENA-MOTION model trained successfully!")

# ---------------------------------------------------------
# 2. Biomechanical Calculations
# ---------------------------------------------------------
def calculate_angle(a, b, c):
    a = np.array(a) # First
    b = np.array(b) # Mid
    c = np.array(c) # End
    
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians*180.0/np.pi)
    
    if angle > 180.0:
        angle = 360 - angle
        
    return angle

# ---------------------------------------------------------
# 3. Pipeline Endpoint
# ---------------------------------------------------------
@app.post("/api/v1/analyze")
async def analyze_video(file: UploadFile = File(...)):
    print(f"Received video: {file.filename}")
    
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    # Initialize MediaPipe Pose
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)

    cap = cv2.VideoCapture(file_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    
    knee_angles = []
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        # Recolor image to RGB
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image.flags.writeable = False
      
        # Make detection
        results = pose.process(image)
        
        # Extract landmarks
        try:
            landmarks = results.pose_landmarks.landmark
            
            # Get coordinates for left leg (Hip, Knee, Ankle)
            hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x, landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
            knee = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x, landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
            ankle = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x, landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]
            
            angle = calculate_angle(hip, knee, ankle)
            knee_angles.append(angle)
        except:
            pass
            
    cap.release()
    
    # Cleanup immediately
    if os.path.exists(file_path):
        os.remove(file_path)
        
    # Feature Extraction
    if len(knee_angles) == 0:
        return {"error": "No person detected in the video."}
        
    avg_knee_angle = np.mean(knee_angles)
    
    # Mocking stride frequency and posture for now, deriving loosely from knee data variance
    stride_frequency = min(4.5, max(2.0, (np.var(knee_angles) / 100) + 2.0))
    posture_score = min(100, max(40, avg_knee_angle - 40))
    
    features = np.array([[avg_knee_angle, stride_frequency, posture_score]])
    
    # Predict using the CPU-trained ATHENA-MOTION model
    prediction = model.predict(features)[0]
    
    overall = int(prediction[0])
    speed = int(prediction[1])
    technique = int(prediction[2])
    
    # Generate Feedback
    if avg_knee_angle < 120:
        feedback = "Knee drive is too low. Focus on driving knees forward for maximum extension."
    elif stride_frequency < 3.0:
        feedback = "Stride turnover is slow. Improve hip mobility and explosive power."
    else:
        feedback = "Excellent biomechanics detected by ATHENA-MOTION. Maintain current form."
        
    data = {
        "speed": speed,
        "technique": technique,
        "agility": overall,
        "endurance": overall - 5,
        "strength": overall + 2,
        "overall_score": overall,
        "qualitative_grade": "A-" if overall > 80 else ("B" if overall > 60 else "C"),
        "feedback": feedback
    }

    return {
        "success": True,
        "message": "Processed successfully by ATHENA-MOTION pipeline",
        "data": data
    }
