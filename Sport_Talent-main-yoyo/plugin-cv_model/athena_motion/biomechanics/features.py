"""
ATHENA-MOTION: Biomechanical Feature Engineering & Normalization.
Combines standardized 33 body landmarks with 16 computed kinematic metrics,
performing spatial centering and torso-length invariance scaling for ML inputs.
"""

from typing import Tuple, Optional, Dict, List
import numpy as np
import pandas as pd

from athena_motion.dataset.schema import (
    PoseLandmarkIndex,
    BIOMECHANICAL_FEATURE_NAMES,
    ALL_FEATURE_NAMES,
    TOTAL_FEATURE_COUNT
)
from athena_motion.biomechanics.metrics import compute_biomechanical_metrics, BiomechanicalMetrics
from athena_motion.biomechanics.kinematics import calculate_euclidean_distance, calculate_midpoint

class BiomechanicalFeatureExtractor:
    """
    Transforms raw 33-landmark pose detections into calibrated, invariant feature vectors
    ready for CPU ML training and sub-millisecond inference.
    """
    def __init__(self, normalize_invariance: bool = True):
        self.normalize_invariance = normalize_invariance
        self.feature_names = ALL_FEATURE_NAMES

    def extract(
        self,
        landmarks: np.ndarray,
        return_metrics_obj: bool = False
    ) -> Tuple[np.ndarray, Optional[BiomechanicalMetrics]]:
        """
        Extracts complete 148-dimensional feature vector.
        landmarks shape: (33, 3) or (33, 4)
        Returns:
            feature_vector: np.ndarray of shape (148,), dtype=float32
            metrics: Optional[BiomechanicalMetrics]
        """
        if landmarks is None or len(landmarks) < 33:
            zero_vec = np.zeros(TOTAL_FEATURE_COUNT, dtype=np.float32)
            return (zero_vec, BiomechanicalMetrics() if return_metrics_obj else None)

        lm_raw = np.array(landmarks, dtype=np.float32)

        # 1. Compute Biomechanical Metrics
        metrics = compute_biomechanical_metrics(lm_raw)

        # 2. Invariant Normalization (if enabled)
        # Shift origin to hip center; scale by torso height (midpoint shoulders to midpoint hips)
        if self.normalize_invariance:
            norm_lm = self._normalize_landmarks(lm_raw)
        else:
            norm_lm = lm_raw

        # 3. Flatten 33 landmarks into 132 features (x, y, z, vis)
        lm_features = []
        for i in range(33):
            pt = norm_lm[i]
            x = pt[0]
            y = pt[1]
            z = pt[2] if len(pt) > 2 else 0.0
            vis = pt[3] if len(pt) > 3 else 1.0
            lm_features.extend([x, y, z, vis])

        # 4. Concatenate with 16 biomechanical metrics
        metrics_array = metrics.to_array()
        full_vector = np.concatenate([lm_features, metrics_array]).astype(np.float32)

        if return_metrics_obj:
            return (full_vector, metrics)
        return (full_vector, None)

    def extract_to_dataframe(
        self,
        landmarks_list: List[np.ndarray]
    ) -> pd.DataFrame:
        """Transforms a batch of landmark frames into a labeled pandas DataFrame."""
        vectors = [self.extract(lm)[0] for lm in landmarks_list]
        return pd.DataFrame(vectors, columns=self.feature_names)

    def _normalize_landmarks(self, lm: np.ndarray) -> np.ndarray:
        """
        Normalizes pose landmarks to make features invariant to camera distance and subject height:
        - Origin (0,0,0) set to pelvis / hip midpoint.
        - Unit scale set to torso length (distance between shoulder midpoint and hip midpoint).
        """
        idx = PoseLandmarkIndex
        l_shoulder = lm[idx.LEFT_SHOULDER][:3]
        r_shoulder = lm[idx.RIGHT_SHOULDER][:3]
        l_hip = lm[idx.LEFT_HIP][:3]
        r_hip = lm[idx.RIGHT_HIP][:3]

        shoulder_mid = (l_shoulder + r_shoulder) / 2.0
        hip_mid = (l_hip + r_hip) / 2.0

        torso_dist = float(np.linalg.norm(shoulder_mid - hip_mid))
        scale = max(torso_dist, 1e-4)

        norm_lm = lm.copy()
        for i in range(33):
            # Center X and Y around hip midpoint
            norm_lm[i, 0] = (lm[i, 0] - hip_mid[0]) / scale
            norm_lm[i, 1] = (lm[i, 1] - hip_mid[1]) / scale
            if norm_lm.shape[1] > 2:
                norm_lm[i, 2] = (lm[i, 2] - hip_mid[2]) / scale
        return norm_lm
