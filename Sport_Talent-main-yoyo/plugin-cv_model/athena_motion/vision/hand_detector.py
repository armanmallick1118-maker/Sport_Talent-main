"""
ATHENA-MOTION: Real-Time 21-Landmark Hand Detection & Gesture Recognition.
Extracts 21 3D hand joints per hand, calculates finger extension counts,
and recognizes intuitive athletic/interactive gestures (Open Palm, Fist, Pinch, Peace, Thumbs Up).
"""

import os
import urllib.request
from typing import List, Tuple, Dict, Optional, Any
from dataclasses import dataclass
import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python.vision import HandLandmarker, HandLandmarkerOptions, RunningMode

HAND_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task"

# Standard 21 Hand anatomical connections
HAND_CONNECTIONS = [
    # Thumb
    (0, 1), (1, 2), (2, 3), (3, 4),
    # Index finger
    (0, 5), (5, 6), (6, 7), (7, 8),
    # Middle finger
    (5, 9), (9, 10), (10, 11), (11, 12),
    # Ring finger
    (9, 13), (13, 14), (14, 15), (15, 16),
    # Pinky & Palm base
    (13, 17), (17, 18), (18, 19), (19, 20),
    (0, 17)
]

@dataclass
class HandInfo:
    """Analyzed telemetry for a single detected hand."""
    handedness: str           # "Left" or "Right"
    confidence: float
    landmarks: np.ndarray     # Shape: (21, 3) [x, y, z] normalized
    pixel_coords: List[Tuple[int, int]]
    finger_count: int         # 0 to 5
    gesture: str              # "Open Palm", "Fist", "Pinch", "Peace", "Thumbs Up", etc.
    is_pinching: bool


class HandDetector:
    """
    High-speed hand landmarker detecting up to `max_hands` with gesture recognition.
    """
    def __init__(
        self,
        model_path: Optional[str] = None,
        max_hands: int = 2,
        min_hand_detection_confidence: float = 0.5,
        min_hand_presence_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5
    ):
        self.model_path = self._resolve_model_path(model_path)
        self.max_hands = max_hands

        options = HandLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=self.model_path),
            running_mode=RunningMode.IMAGE,
            num_hands=max_hands,
            min_hand_detection_confidence=min_hand_detection_confidence,
            min_hand_presence_confidence=min_hand_presence_confidence,
            min_tracking_confidence=min_tracking_confidence
        )
        self.landmarker = HandLandmarker.create_from_options(options)

    def _resolve_model_path(self, custom_path: Optional[str]) -> str:
        """Locates or downloads hand_landmarker.task model."""
        if custom_path and os.path.isfile(custom_path):
            return custom_path

        candidate_paths = [
            os.path.join(os.path.dirname(__file__), "..", "..", "assets", "models", "hand_landmarker.task"),
            os.path.join(os.path.dirname(__file__), "..", "assets", "models", "hand_landmarker.task"),
            "assets/models/hand_landmarker.task",
            "hand_landmarker.task"
        ]
        for path in candidate_paths:
            abs_p = os.path.abspath(path)
            if os.path.isfile(abs_p):
                return abs_p

        target_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "assets", "models"))
        os.makedirs(target_dir, exist_ok=True)
        download_target = os.path.join(target_dir, "hand_landmarker.task")
        print(f"[ATHENA-MOTION] Downloading hand_landmarker.task to {download_target}...")
        urllib.request.urlretrieve(HAND_MODEL_URL, download_target)
        return download_target

    def detect(self, frame_bgr: np.ndarray) -> List[HandInfo]:
        """
        Detects hands in an OpenCV BGR frame and extracts 21 landmarks + gestures.
        """
        if frame_bgr is None or frame_bgr.size == 0:
            return []

        h, w, _ = frame_bgr.shape
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)

        results = self.landmarker.detect(mp_image)
        if not results.hand_landmarks:
            return []

        hands_info: List[HandInfo] = []
        for i, landmarks_list in enumerate(results.hand_landmarks):
            # Extract (21, 3) normalized coordinates
            lm_array = np.zeros((21, 3), dtype=np.float32)
            pixel_pts: List[Tuple[int, int]] = []

            for j, lm in enumerate(landmarks_list):
                lm_array[j] = [lm.x, lm.y, lm.z]
                px = int(np.clip(lm.x * w, 0, w - 1))
                py = int(np.clip(lm.y * h, 0, h - 1))
                pixel_pts.append((px, py))

            # Handedness label (Left / Right)
            handedness = "Hand"
            confidence = 1.0
            if results.handedness and i < len(results.handedness) and len(results.handedness[i]) > 0:
                handedness = results.handedness[i][0].category_name
                confidence = results.handedness[i][0].score

            # Gesture & Finger Recognition
            finger_count, gesture, is_pinch = self._analyze_fingers_and_gesture(lm_array, handedness)

            hands_info.append(HandInfo(
                handedness=handedness,
                confidence=float(confidence),
                landmarks=lm_array,
                pixel_coords=pixel_pts,
                finger_count=finger_count,
                gesture=gesture,
                is_pinching=is_pinch
            ))

        return hands_info

    def _analyze_fingers_and_gesture(
        self,
        lm: np.ndarray,
        handedness: str
    ) -> Tuple[int, str, bool]:
        """Classifies finger states and gestures from 21 landmarks."""
        # Check pinch (distance between thumb tip 4 and index tip 8)
        pinch_dist = np.linalg.norm(lm[4][:2] - lm[8][:2])
        is_pinch = bool(pinch_dist < 0.055)

        # Tips: Thumb 4, Index 8, Middle 12, Ring 16, Pinky 20
        # PIP/MCP: Index 6, Middle 10, Ring 14, Pinky 18
        fingers_up = []

        # Thumb: check X displacement relative to MCP (joint 2)
        if handedness.lower() == "right":
            thumb_up = lm[4][0] < lm[3][0]
        else:
            thumb_up = lm[4][0] > lm[3][0]
        fingers_up.append(thumb_up)

        # 4 fingers: Check if tip Y is higher than PIP Y (smaller Y value in screen coordinates)
        tip_indices = [8, 12, 16, 20]
        pip_indices = [6, 10, 14, 18]

        for tip, pip in zip(tip_indices, pip_indices):
            fingers_up.append(lm[tip][1] < lm[pip][1])

        count = sum(fingers_up)

        # Gestures
        if is_pinch:
            gesture = "PINCH"
        elif count == 5:
            gesture = "OPEN PALM"
        elif count == 0:
            gesture = "FIST"
        elif count == 2 and fingers_up[1] and fingers_up[2]:
            gesture = "PEACE / VICTORY"
        elif count == 1 and fingers_up[1]:
            gesture = "POINTING"
        elif count == 1 and fingers_up[0] and (lm[4][1] < lm[2][1]):
            gesture = "THUMBS UP"
        else:
            gesture = f"{count} FINGERS"

        return count, gesture, is_pinch

    def draw_hands(self, canvas: np.ndarray, hands: List[HandInfo]) -> np.ndarray:
        """Draws aesthetic hand skeletons and joint points on canvas."""
        for hand in hands:
            pts = hand.pixel_coords
            # Draw bones
            for p1, p2 in HAND_CONNECTIONS:
                cv2.line(canvas, pts[p1], pts[p2], (0, 220, 255), 2, cv2.LINE_AA) # Cyan bones

            # Draw joints
            for i, pt in enumerate(pts):
                # Highlight fingertips
                if i in [4, 8, 12, 16, 20]:
                    cv2.circle(canvas, pt, 6, (0, 255, 120), -1, cv2.LINE_AA) # Emerald tips
                    cv2.circle(canvas, pt, 7, (0, 0, 0), 1, cv2.LINE_AA)
                else:
                    cv2.circle(canvas, pt, 4, (255, 200, 0), -1, cv2.LINE_AA) # Amber joints

            # Hand label above wrist
            wrist = pts[0]
            label = f"{hand.handedness} Hand: {hand.gesture}"
            cv2.putText(canvas, label, (wrist[0] - 40, max(20, wrist[1] - 15)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2, cv2.LINE_AA)

        return canvas

    def close(self):
        """Closes underlying model."""
        if hasattr(self, "landmarker") and self.landmarker:
            self.landmarker.close()
