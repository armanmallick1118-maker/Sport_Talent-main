"""
core/pipeline.py
================
The Master Pipeline Class (Phase 6, Steps 22-23).

Orchestrates the full flow for a given session:
  VideoIngestion -> PersonDetector -> PoseEstimator -> QualityChecker ->
  DataCleaner -> MotionExporter
"""

from __future__ import annotations

import os
import time
from typing import Optional

import cv2

from api.models.request_models import ProcessRequest
from api.models.response_models import MotionSummary
from core.storage_manager import StorageManager
from core.person_detector import PersonDetector
from core.pose_estimator import PoseEstimator
from core.quality_checker import QualityChecker
from core.data_cleaner import DataCleaner
from core.motion_exporter import MotionExporter
from core.logger import get_logger


class MediaPipeline:
    """Master orchestrator for processing athlete motion data."""
    
    def __init__(self):
        self.storage = StorageManager()
        self.detector = PersonDetector()
        self.pose_estimator = PoseEstimator()
        self.quality = QualityChecker()
        self.cleaner = DataCleaner()

    def process_session(
        self, 
        request: ProcessRequest,
        progress_callback: Optional[callable] = None,
        is_cancelled: Optional[callable] = None
    ) -> Optional[MotionSummary]:
        """
        Executes the entire CV/ML pipeline on a session.
        This runs frame-by-frame and should be called asynchronously.
        """
        session_id = request.session_id
        log = get_logger("pipeline", session_id=session_id)
        
        log.info(f"Starting pipeline execution for {session_id}")
        paths = self.storage.get_session_paths(session_id)
        
        try:
            self.storage.update_status(session_id, "PROCESSING")
            
            # Load metadata to get fps
            meta = self.storage.read_session_meta(session_id)
            if not meta or meta.fps is None:
                raise ValueError("Session metadata or video metadata missing.")
                
            fps = meta.fps
            start_time = time.perf_counter()
            
            # --- Frame Iteration ---
            raw_timeline = []
            frame_files = sorted(
                [f for f in os.listdir(paths.frames_dir) if f.endswith(".jpg")],
                key=lambda x: int(x.split("_")[1].split(".")[0])
            )
            
            total_frames = len(frame_files)
            if total_frames == 0:
                raise ValueError("No frames found to process.")
                
            log.info(f"Processing {total_frames} frames...")
            
            for idx, file_name in enumerate(frame_files):
                if is_cancelled and is_cancelled():
                    log.warning("Pipeline execution cancelled.")
                    self.storage.update_status(session_id, "CANCELLED")
                    return None
                    
                frame_path = os.path.join(paths.frames_dir, file_name)
                frame_number = int(file_name.split("_")[1].split(".")[0])
                timestamp_ms = (frame_number / fps) * 1000.0
                
                frame = cv2.imread(frame_path)
                if frame is None:
                    continue
                    
                # 1. Person Detection
                bbox = self.detector.detect_primary_athlete(frame)
                
                # 2. Pose Estimation
                pose_result = self.pose_estimator.estimate(frame, frame_number, timestamp_ms)
                if pose_result and bbox:
                    pose_result.person_bbox = bbox
                    pose_result.detection_confidence = bbox.confidence
                
                if pose_result:
                    # 3. Quality Check
                    q_report = self.quality.check_frame(pose_result)
                    
                    raw_timeline.append({
                        "pose": pose_result,
                        "quality": q_report
                    })
                    
                if progress_callback:
                    progress_callback(idx + 1, total_frames)
                    
            if not raw_timeline:
                raise ValueError("Pipeline generated no poses.")
                
            # --- Post-Processing ---
            log.info("Cleaning data (Interpolation & Smoothing)...")
            
            frames = [item["pose"] for item in raw_timeline]
            reports = [item["quality"] for item in raw_timeline]
            
            cleaned_timeline = self.cleaner.clean_sequence(frames, reports)
            
            # Reconstruct VideoMetadata from SessionMeta
            from api.models.response_models import VideoMetadata
            video_meta = VideoMetadata(
                filename=meta.original_filename or "unknown.mp4",
                file_size_bytes=meta.file_size_bytes or 0,
                fps=meta.fps or 30.0,
                total_frames=meta.total_frames or 0,
                duration_seconds=meta.duration_seconds or 0.0,
                width=meta.width or 0,
                height=meta.height or 0,
                codec=meta.codec or "unknown"
            )
            
            # Reconstruct ProcessingConfig from request
            from api.models.response_models import ProcessingConfig
            proc_config = ProcessingConfig(**request.model_dump())
            
            # --- Export ---
            log.info("Exporting JSON and CSV...")
            exporter = MotionExporter(output_dir=str(paths.results_dir), session_id=session_id)
            motion_data = exporter.build_motion_data(
                session_id=session_id,
                cleaned_sequence=cleaned_timeline,
                original_quality_reports=reports,
                video_metadata=video_meta,
                config=request,
                processing_time_seconds=(time.perf_counter() - start_time)
            )
            exporter.export_json(motion_data)
            exporter.export_csv(motion_data)
            
            self.storage.update_status(session_id, "DONE")
            log.info("Pipeline execution COMPLETED successfully.")
            
            return motion_data.summary
            
        except Exception as e:
            log.error(f"Pipeline execution FAILED: {e}")
            self.storage.update_status(session_id, "FAILED")
            raise e
