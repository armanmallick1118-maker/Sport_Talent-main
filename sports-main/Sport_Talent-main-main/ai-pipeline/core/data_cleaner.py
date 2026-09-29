"""
core/data_cleaner.py
====================
Data cleaning and smoothing (Step 14).

Performs linear interpolation over missing frames (gaps) and applies
Savitzky-Golay filtering to smooth trajectory noise in the landmark coordinates.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

import numpy as np
import pandas as pd
from scipy.signal import savgol_filter

from api.models.response_models import QualityReport
from core.pose_estimator import LandmarkData, PoseResult
from core.logger import get_logger

log = get_logger("data_cleaner")


@dataclass
class CleanedSequence:
    frames: List[PoseResult]
    interpolated_frames_count: int
    smoothed: bool


class DataCleaner:
    def __init__(
        self,
        interpolation_method: str = "linear",
        smoothing_window: int = 5,
        polyorder: int = 2,
        session_id: str = "global",
    ) -> None:
        self.interpolation_method = interpolation_method
        self.smoothing_window = smoothing_window
        self.polyorder = polyorder
        self._log = get_logger("data_cleaner", session_id=session_id)

    def clean_sequence(
        self,
        frames: List[PoseResult],
        quality_reports: List[QualityReport],
    ) -> CleanedSequence:
        """
        Cleans the pose sequence by interpolating low-quality gaps
        and optionally smoothing the trajectories.
        """
        if not frames:
            return CleanedSequence(frames=[], interpolated_frames_count=0, smoothed=False)
            
        self._log.info(f"Starting data cleaning on {len(frames)} frames")
        
        # 1. Gather all landmarks into arrays shape (num_frames, 33, 3)
        # We also want to track world coordinates (num_frames, 33, 3)
        num_frames = len(frames)
        # We need a list of landmark names to ensure consistent ordering
        landmark_names = list(frames[0].landmarks.keys()) if frames[0].has_pose else []
        
        if not landmark_names:
            # If the first frame has no pose, search for one that does to get names
            for f in frames:
                if f.has_pose and f.landmarks:
                    landmark_names = list(f.landmarks.keys())
                    break
                    
        num_landmarks = len(landmark_names)
        if num_landmarks == 0:
            self._log.warning("No pose data found in any frame to clean.")
            return CleanedSequence(frames=frames, interpolated_frames_count=0, smoothed=False)
            
        # We will build pandas DataFrames for easy interpolation
        # One for normalized coords, one for world coords
        # Columns will be e.g. 'left_shoulder_x', 'left_shoulder_y', etc.
        
        norm_data = []
        world_data = []
        
        for i, (f, q) in enumerate(zip(frames, quality_reports)):
            norm_row = {}
            world_row = {}
            
            # If valid, use the data. If not valid (low quality / no pose), use NaN to force interpolation
            if q.is_valid and f.has_pose:
                for name in landmark_names:
                    if name in f.landmarks:
                        lm = f.landmarks[name]
                        norm_row[f"{name}_x"] = lm.x
                        norm_row[f"{name}_y"] = lm.y
                        norm_row[f"{name}_z"] = lm.z
                        
                        world_row[f"{name}_world_x"] = lm.world_x
                        world_row[f"{name}_world_y"] = lm.world_y
                        world_row[f"{name}_world_z"] = lm.world_z
                    else:
                        norm_row[f"{name}_x"] = np.nan
                        norm_row[f"{name}_y"] = np.nan
                        norm_row[f"{name}_z"] = np.nan
                        world_row[f"{name}_world_x"] = np.nan
                        world_row[f"{name}_world_y"] = np.nan
                        world_row[f"{name}_world_z"] = np.nan
            else:
                # Fill with NaN for invalid frames
                for name in landmark_names:
                    norm_row[f"{name}_x"] = np.nan
                    norm_row[f"{name}_y"] = np.nan
                    norm_row[f"{name}_z"] = np.nan
                    world_row[f"{name}_world_x"] = np.nan
                    world_row[f"{name}_world_y"] = np.nan
                    world_row[f"{name}_world_z"] = np.nan
                    
            norm_data.append(norm_row)
            world_data.append(world_row)
            
        df_norm = pd.DataFrame(norm_data)
        df_world = pd.DataFrame(world_data)
        
        # Count NaNs to know how many frames were missing/invalid
        nan_count_initial = df_norm.isna().all(axis=1).sum()
        
        # 2. Interpolate missing data (gaps)
        # limit=5 prevents interpolating huge gaps (e.g., player completely left the screen)
        # both directions: forward then backward for edge cases
        df_norm = df_norm.interpolate(method=self.interpolation_method, limit=5, limit_direction="both")
        df_world = df_world.interpolate(method=self.interpolation_method, limit=5, limit_direction="both")
        
        # 3. Smoothing
        smoothed = False
        if self.smoothing_window > 2 and len(df_norm) > self.smoothing_window:
            # savgol requires window_length to be odd
            window = self.smoothing_window if self.smoothing_window % 2 == 1 else self.smoothing_window + 1
            if window < len(df_norm):
                # Apply Savitzky-Golay filter column-wise
                for col in df_norm.columns:
                    # Only smooth where we have data (interpolate might have left NaNs if gap > limit)
                    mask = df_norm[col].notna()
                    if mask.sum() > window:
                        df_norm.loc[mask, col] = savgol_filter(df_norm.loc[mask, col], window, self.polyorder)
                        
                for col in df_world.columns:
                    mask = df_world[col].notna()
                    if mask.sum() > window:
                        df_world.loc[mask, col] = savgol_filter(df_world.loc[mask, col], window, self.polyorder)
                smoothed = True
                
        # 4. Reconstruct PoseResult objects
        cleaned_frames = []
        for i, orig_f in enumerate(frames):
            # Create a new dict of landmarks
            new_landmarks = {}
            row_norm = df_norm.iloc[i]
            row_world = df_world.iloc[i]
            
            # If the row is still NaN, we couldn't interpolate (e.g. huge gap)
            has_pose = not row_norm.isna().all()
            
            if has_pose:
                for idx, name in enumerate(landmark_names):
                    if not pd.isna(row_norm[f"{name}_x"]):
                        # Preserve original visibility if available, else 0.5 for interpolated
                        orig_vis = orig_f.landmarks[name].visibility if orig_f.has_pose and name in orig_f.landmarks else 0.5
                        
                        new_landmarks[name] = LandmarkData(
                            name=name,
                            index=idx,
                            x=float(row_norm[f"{name}_x"]),
                            y=float(row_norm[f"{name}_y"]),
                            z=float(row_norm[f"{name}_z"]),
                            visibility=orig_vis,
                            world_x=float(row_world[f"{name}_world_x"]),
                            world_y=float(row_world[f"{name}_world_y"]),
                            world_z=float(row_world[f"{name}_world_z"]),
                        )
                        
            cleaned_f = PoseResult(
                frame_number=orig_f.frame_number,
                timestamp_ms=orig_f.timestamp_ms,
                landmarks=new_landmarks,
                has_pose=has_pose,
                detection_confidence=orig_f.detection_confidence if has_pose else 0.0,
                segmentation_mask=orig_f.segmentation_mask,
                raw_result=orig_f.raw_result,
            )
            cleaned_frames.append(cleaned_f)
            
        nan_count_final = df_norm.isna().all(axis=1).sum()
        interpolated_count = nan_count_initial - nan_count_final
        
        self._log.info(f"Cleaning complete: interpolated {interpolated_count} frames, smoothed={smoothed}")
        
        return CleanedSequence(
            frames=cleaned_frames,
            interpolated_frames_count=interpolated_count,
            smoothed=smoothed
        )
