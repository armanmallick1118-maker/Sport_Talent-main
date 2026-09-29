"""
core/visualizer.py
==================
Visualization & Feedback (Phase 5).

Handles overlaying MediaPipe skeletons, joint angles, and quality HUD onto frames,
then re-encoding them into an MP4 and a preview GIF.
"""

from __future__ import annotations

import os
from typing import List, Tuple

import cv2
import imageio
import numpy as np

from api.models.response_models import FramePose, MotionData
from core.constants import SKELETON_CONNECTIONS
from core.logger import get_logger


class Visualizer:
    def __init__(self, session_id: str = "global") -> None:
        self.session_id = session_id
        self._log = get_logger("visualizer", session_id=session_id)
        
        # Colors (BGR)
        self.COLOR_LEFT = (0, 0, 255)      # Red for left side
        self.COLOR_RIGHT = (255, 0, 0)     # Blue for right side
        self.COLOR_TORSO = (0, 255, 0)     # Green for torso/center
        self.COLOR_HUD_BG = (30, 30, 30)
        self.COLOR_TEXT = (255, 255, 255)
        self.COLOR_WARN = (0, 165, 255)    # Orange for warnings

    def _get_connection_color(self, name1: str, name2: str) -> Tuple[int, int, int]:
        if "left" in name1 and "left" in name2:
            return self.COLOR_LEFT
        elif "right" in name1 and "right" in name2:
            return self.COLOR_RIGHT
        return self.COLOR_TORSO

    def draw_skeleton(self, frame: np.ndarray, pose: FramePose) -> np.ndarray:
        """
        Draws the pose skeleton and angles on a copy of the frame.
        """
        img = frame.copy()
        h, w, _ = img.shape
        
        if not pose.has_pose:
            return img
            
        # Draw connections
        for name1, name2 in SKELETON_CONNECTIONS:
            lm1 = pose.landmark(name1)
            lm2 = pose.landmark(name2)
            
            if lm1 and lm2 and lm1.visibility > 0.3 and lm2.visibility > 0.3:
                pt1 = (int(lm1.x * w), int(lm1.y * h))
                pt2 = (int(lm2.x * w), int(lm2.y * h))
                color = self._get_connection_color(name1, name2)
                cv2.line(img, pt1, pt2, color, thickness=2, lineType=cv2.LINE_AA)
                
        # Draw landmarks
        for name, lm in pose.landmarks.items():
            if lm.visibility > 0.3:
                pt = (int(lm.x * w), int(lm.y * h))
                color = self.COLOR_LEFT if "left" in name else (self.COLOR_RIGHT if "right" in name else self.COLOR_TORSO)
                cv2.circle(img, pt, radius=4, color=color, thickness=-1, lineType=cv2.LINE_AA)
                
        # Overlay joint angles at specific joints
        def draw_angle(angle_name: str, joint_name: str):
            val = pose.get_angle(angle_name)
            lm = pose.landmark(joint_name)
            if val is not None and lm and lm.visibility > 0.3:
                pt = (int(lm.x * w) + 10, int(lm.y * h) - 10)
                cv2.putText(img, f"{int(val)}", pt, cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1, cv2.LINE_AA)
                
        draw_angle("left_knee_angle", "left_knee")
        draw_angle("right_knee_angle", "right_knee")
        draw_angle("left_elbow_angle", "left_elbow")
        draw_angle("right_elbow_angle", "right_elbow")
        
        return img

    def draw_hud(self, frame: np.ndarray, pose: FramePose) -> np.ndarray:
        """
        Draws the quality HUD in the top-left corner.
        """
        img = frame.copy()
        h, w, _ = img.shape
        
        # Draw background rect
        rect_w, rect_h = 250, 100
        cv2.rectangle(img, (10, 10), (10 + rect_w, 10 + rect_h), self.COLOR_HUD_BG, -1)
        
        # Text settings
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.5
        thick = 1
        
        # Frame Number & Timestamp
        cv2.putText(img, f"Frame: {pose.frame_number}  {pose.timestamp_ms/1000:.2f}s", 
                    (20, 30), font, font_scale, self.COLOR_TEXT, thick, cv2.LINE_AA)
                    
        # Quality Score
        q = pose.quality
        score_color = self.COLOR_TEXT if q.is_valid else self.COLOR_WARN
        cv2.putText(img, f"Quality: {q.overall_score:.2f}", 
                    (20, 50), font, font_scale, score_color, thick, cv2.LINE_AA)
                    
        # Status flags
        status = []
        if pose.is_interpolated:
            status.append("INTERPOLATED")
        if not pose.has_pose:
            status.append("NO POSE")
        if q.missing_critical_landmarks:
            status.append("MISSING LMs")
            
        if status:
            cv2.putText(img, " | ".join(status), 
                        (20, 70), font, font_scale, self.COLOR_WARN, thick, cv2.LINE_AA)
                        
        return img

    def generate_video(self, source_video_path: str, output_dir: str, motion_data: MotionData) -> Tuple[str, str]:
        """
        Reads source video, applies drawer/HUD frame by frame, and writes to an MP4 and GIF.
        Returns (mp4_path, gif_path).
        """
        mp4_path = os.path.join(output_dir, "skeleton_video.mp4")
        gif_path = os.path.join(output_dir, "preview.gif")
        
        cap = cv2.VideoCapture(source_video_path)
        if not cap.isOpened():
            raise RuntimeError(f"Could not open source video: {source_video_path}")
            
        fps = motion_data.video_metadata.fps
        width = motion_data.video_metadata.width
        height = motion_data.video_metadata.height
        
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(mp4_path, fourcc, fps, (width, height))
        
        gif_frames = []
        max_gif_frames = int(fps * 3) # First 3 seconds for GIF
        
        frame_idx = 0
        pose_dict = {fp.frame_number: fp for fp in motion_data.frames}
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            fp = pose_dict.get(frame_idx)
            if fp:
                frame = self.draw_skeleton(frame, fp)
                frame = self.draw_hud(frame, fp)
                
            out.write(frame)
            
            # Save for GIF (RGB format)
            if frame_idx < max_gif_frames:
                gif_frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                
            frame_idx += 1
            
        cap.release()
        out.release()
        
        # Save GIF
        if gif_frames:
            # Optimize GIF by skipping frames (e.g. 15 fps) to keep size down
            skip = max(1, int(fps / 15))
            imageio.mimsave(gif_path, gif_frames[::skip], fps=15)
            
        self._log.info(f"Video generated: {mp4_path}")
        self._log.info(f"GIF generated: {gif_path}")
        
        return mp4_path, gif_path
