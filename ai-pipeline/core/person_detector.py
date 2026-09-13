"""
core/person_detector.py
========================
YOLOv8 wrapper for person detection (Step 8).

Detects people in frames and selects the primary athlete based on
bounding box area.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

import numpy as np
from ultralytics import YOLO

from core.config import settings
from core.logger import get_logger

log = get_logger("person_detector")


@dataclass
class BoundingBox:
    """Represents a detected bounding box in pixel coordinates."""
    x1: float
    y1: float
    x2: float
    y2: float
    confidence: float
    class_id: int
    
    @property
    def area(self) -> float:
        """Area of the bounding box in pixels."""
        return max(0.0, self.x2 - self.x1) * max(0.0, self.y2 - self.y1)
        
    def to_list(self) -> List[float]:
        """Returns [x1, y1, x2, y2]."""
        return [float(self.x1), float(self.y1), float(self.x2), float(self.y2)]


class PersonDetector:
    """
    Wraps ultralytics YOLOv8 for detecting people in frames.
    """
    
    def __init__(
        self,
        model_size: str = "n",  # n (nano), s (small), m, l, x
        confidence: float = settings.DETECTION_CONFIDENCE,
        device: Optional[str] = None,
        session_id: str = "global",
    ) -> None:
        """
        Args:
            model_size: YOLOv8 model size (e.g. 'n' for yolov8n.pt)
            confidence: Minimum confidence threshold.
            device: 'cpu', 'cuda', 'mps'. If None, auto-selects.
            session_id: Logging context.
        """
        self.model_name = f"yolov8{model_size}.pt"
        self.confidence_threshold = confidence
        self._log = get_logger("person_detector", session_id=session_id)
        
        self.device = device
        
        self._log.info(
            "Loading YOLO model: {m} on device: {d}", 
            m=self.model_name, 
            d=self.device or "auto"
        )
        
        # verbose=False prevents YOLO from spamming stdout
        self.model = YOLO(self.model_name)
        
    def detect(self, frame_rgb: np.ndarray) -> List[BoundingBox]:
        """
        Runs inference on a single RGB frame to detect people.
        """
        # YOLOv8 python interface handles RGB arrays correctly
        results = self.model.predict(
            source=frame_rgb,
            conf=self.confidence_threshold,
            classes=[0],  # 0 is the COCO class ID for 'person'
            device=self.device,
            verbose=False,
        )
        
        bboxes = []
        if not results:
            return bboxes
            
        result = results[0] # Single image prediction
        
        # result.boxes has .xyxy (tensor of coords), .conf, .cls
        if len(result.boxes) == 0:
            return bboxes
            
        for box in result.boxes:
            conf = float(box.conf[0])
            cls_id = int(box.cls[0])
            
            # extract [x1, y1, x2, y2]
            x1, y1, x2, y2 = map(float, box.xyxy[0])
            
            bboxes.append(BoundingBox(
                x1=x1, y1=y1, x2=x2, y2=y2,
                confidence=conf,
                class_id=cls_id
            ))
            
        return bboxes

    def detect_primary_athlete(self, frame_rgb: np.ndarray) -> Optional[BoundingBox]:
        """
        Detects all people, and returns the one most likely to be the primary athlete.
        Heuristic: Picks the largest person bounding box by area.
        """
        bboxes = self.detect(frame_rgb)
        if not bboxes:
            return None
            
        # Select the largest person bounding box
        primary = max(bboxes, key=lambda b: b.area)
        return primary
