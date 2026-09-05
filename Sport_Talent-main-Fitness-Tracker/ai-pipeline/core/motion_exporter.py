"""
core/motion_exporter.py
=======================
Motion Exporter (Steps 15 & 16).

Handles serialization of the cleaned pose sequence into the formal JSON
schema expected by Phase 5 ML pipelines, and also flat CSV exports.
"""

from __future__ import annotations

import csv
import json
import os
from datetime import datetime, timezone
from typing import List, Optional

from api.models.request_models import ProcessRequest
from api.models.response_models import (
    FramePose,
    JointAngles,
    LandmarkPoint,
    MotionData,
    MotionSummary,
    ProcessingConfig,
    QualityReport,
    VideoMetadata,
)
from core.data_cleaner import CleanedSequence
from core.logger import get_logger
from core.pose_estimator import compute_joint_angles


class MotionExporter:
    """
    Exports CleanedSequence to MotionData JSON and CSV.
    """

    def __init__(self, output_dir: str, schema_version: str = "1.0.0", session_id: str = "global") -> None:
        self.output_dir = output_dir
        self.schema_version = schema_version
        self._log = get_logger("motion_exporter", session_id=session_id)
        os.makedirs(self.output_dir, exist_ok=True)

    def _convert_to_frame_pose(
        self,
        cleaned_seq: CleanedSequence,
        original_quality_reports: List[QualityReport],
        compute_angles: bool,
    ) -> List[FramePose]:
        """
        Maps PoseResult (internal) to FramePose (API response model).
        Flags interpolation and computes joint angles.
        """
        frame_poses = []
        # original_quality_reports is the list of pre-clean QualityReports.
        
        # Determine which frames were interpolated
        # Any frame that originally had is_valid=False but now has_pose=True was interpolated
        
        for f, q in zip(cleaned_seq.frames, original_quality_reports):
            is_interpolated = (not q.is_valid) and f.has_pose
            is_smoothed = cleaned_seq.smoothed and f.has_pose
            
            # Map landmarks
            lms_dict = {}
            for name, lm_data in f.landmarks.items():
                lms_dict[name] = LandmarkPoint(
                    x=lm_data.x,
                    y=lm_data.y,
                    z=lm_data.z,
                    visibility=lm_data.visibility,
                    world_x=lm_data.world_x,
                    world_y=lm_data.world_y,
                    world_z=lm_data.world_z,
                )
                
            # Compute angles
            j_angles = JointAngles()
            if compute_angles and f.has_pose:
                calc_angles = compute_joint_angles(f.landmarks)
                # Map dynamically
                for k, v in calc_angles.items():
                    if hasattr(j_angles, k):
                        setattr(j_angles, k, v)
                        
            fp = FramePose(
                frame_number=f.frame_number,
                timestamp_ms=f.timestamp_ms,
                landmarks=lms_dict,
                joint_angles=j_angles,
                person_bbox=None,  # We don't track bounding box through cleaning yet
                detection_confidence=f.detection_confidence,
                quality=q,
                has_pose=f.has_pose,
                is_interpolated=is_interpolated,
                is_smoothed=is_smoothed,
            )
            frame_poses.append(fp)
            
        return frame_poses

    def build_motion_data(
        self,
        session_id: str,
        cleaned_sequence: CleanedSequence,
        original_quality_reports: List[QualityReport],
        video_metadata: VideoMetadata,
        config: ProcessRequest,
        processing_time_seconds: float,
    ) -> MotionData:
        """
        Constructs the full MotionData Pydantic model representing the session.
        """
        frame_poses = self._convert_to_frame_pose(
            cleaned_sequence,
            original_quality_reports,
            compute_angles=config.compute_angles,
        )
        
        # Calculate summary statistics
        total_extracted = len(cleaned_sequence.frames)
        valid_frames = sum(1 for q in original_quality_reports if q.is_valid)
        dropped_indices = [i for i, f in enumerate(cleaned_sequence.frames) if not f.has_pose]
        interpolated_indices = [fp.frame_number for fp in frame_poses if fp.is_interpolated]
        
        valid_scores = [q.overall_score for q in original_quality_reports if q.is_valid]
        avg_q = sum(valid_scores) / len(valid_scores) if valid_scores else 0.0
        min_q = min(valid_scores) if valid_scores else 0.0
        max_q = max(valid_scores) if valid_scores else 0.0
        
        fps_throughput = total_extracted / processing_time_seconds if processing_time_seconds > 0 else 0.0
        
        summary = MotionSummary(
            total_input_frames=video_metadata.total_frames,
            processed_frames=total_extracted,
            valid_frames=valid_frames,
            dropped_frames=dropped_indices,
            interpolated_frames=interpolated_indices,
            avg_quality_score=avg_q,
            min_quality_score=min_q,
            max_quality_score=max_q,
            avg_detection_confidence=None,
            landmarks_tracked=33,
            angles_computed=12 if config.compute_angles else 0,
            processing_time_seconds=processing_time_seconds,
            frames_per_second_throughput=fps_throughput,
        )
        
        proc_config = ProcessingConfig(
            frame_skip=config.frame_skip,
            model_complexity=config.model_complexity,
            min_detection_confidence=config.min_detection_confidence,
            min_tracking_confidence=config.min_tracking_confidence,
            smooth_landmarks=config.smooth_landmarks,
            enable_segmentation=config.enable_segmentation,
            detection_confidence=config.detection_confidence,
            interpolation_method=config.interpolation_method,
            smoothing_window=config.smoothing_window,
            smoothing_polyorder=config.smoothing_polyorder,
            outlier_std_threshold=config.outlier_std_threshold,
            quality_min_score=config.quality_min_score,
            compute_angles=config.compute_angles,
        )
        
        now_iso = datetime.now(timezone.utc).isoformat()
        
        return MotionData(
            schema_version=self.schema_version,
            session_id=session_id,
            athlete_id=config.athlete_id,
            created_at=now_iso,
            video_metadata=video_metadata,
            processing_config=proc_config,
            summary=summary,
            frames=frame_poses,
            phase5_ready=True,
        )

    def export_json(self, motion_data: MotionData) -> str:
        """
        Saves the MotionData to motion_data.json.
        """
        out_path = os.path.join(self.output_dir, "motion_data.json")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(motion_data.model_dump_json(indent=2))
        self._log.info(f"Exported JSON to {out_path}")
        return out_path

    def export_csv(self, motion_data: MotionData) -> str:
        """
        Flattens the timeline into a CSV for ML pipelines.
        """
        out_path = os.path.join(self.output_dir, "motion_data.csv")
        
        # Determine column headers based on 33 landmarks + angles
        # We take the first valid frame's keys to define columns
        lm_names = list(motion_data.frames[0].landmarks.keys()) if motion_data.frames else []
        
        cols = ["frame_number", "timestamp_ms", "is_interpolated"]
        
        for name in lm_names:
            cols.extend([f"{name}_x", f"{name}_y", f"{name}_z", f"{name}_vis",
                         f"{name}_wx", f"{name}_wy", f"{name}_wz"])
                         
        angle_names = list(motion_data.frames[0].joint_angles.model_dump().keys()) if motion_data.frames else []
        cols.extend(angle_names)
        
        with open(out_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(cols)
            
            for fp in motion_data.frames:
                row = [fp.frame_number, fp.timestamp_ms, fp.is_interpolated]
                for name in lm_names:
                    lm = fp.landmark(name)
                    if lm:
                        row.extend([lm.x, lm.y, lm.z, lm.visibility, lm.world_x, lm.world_y, lm.world_z])
                    else:
                        row.extend([""] * 7)
                        
                for a_name in angle_names:
                    val = getattr(fp.joint_angles, a_name, None)
                    row.append(val if val is not None else "")
                    
                writer.writerow(row)
                
        self._log.info(f"Exported CSV to {out_path}")
        return out_path
