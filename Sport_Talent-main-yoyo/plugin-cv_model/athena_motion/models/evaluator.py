"""
ATHENA-MOTION: Model Benchmark & Latency Evaluator.
Benchmarks CPU inference latency per frame and generates comprehensive accuracy analytics.
"""

import time
from typing import Dict, Any, Tuple
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix

from athena_motion.models.classifier import AthenaMotionClassifier
from athena_motion.dataset.schema import TOTAL_FEATURE_COUNT

class ModelEvaluator:
    """
    Evaluates ML performance, accuracy matrices, and CPU latency characteristics.
    """
    @staticmethod
    def benchmark_latency(
        classifier: AthenaMotionClassifier,
        iterations: int = 500,
        warmup: int = 50
    ) -> Dict[str, float]:
        """
        Benchmarks single-frame CPU prediction latency in milliseconds.
        """
        sample_vec = np.random.randn(TOTAL_FEATURE_COUNT).astype(np.float32)

        # Warmup
        for _ in range(warmup):
            _ = classifier.predict_frame(sample_vec)

        # Timed iterations
        latencies_ms = []
        for _ in range(iterations):
            t0 = time.perf_counter()
            _ = classifier.predict_frame(sample_vec)
            t1 = time.perf_counter()
            latencies_ms.append((t1 - t0) * 1000.0)

        lat_arr = np.array(latencies_ms)
        return {
            "mean_ms": round(float(np.mean(lat_arr)), 3),
            "median_ms": round(float(np.median(lat_arr)), 3),
            "p95_ms": round(float(np.percentile(lat_arr, 95)), 3),
            "p99_ms": round(float(np.percentile(lat_arr, 99)), 3),
            "fps_capacity": round(1000.0 / max(float(np.mean(lat_arr)), 0.01), 1)
        }

    @staticmethod
    def detailed_report(
        classifier: AthenaMotionClassifier,
        X_test: np.ndarray,
        y_ex_test: np.ndarray,
        y_form_test: np.ndarray
    ) -> Dict[str, Any]:
        """Generates classification metrics and confusion matrices."""
        ex_preds = [classifier.predict_frame(row).exercise for row in X_test]
        form_preds = [classifier.predict_frame(row).form_quality for row in X_test]

        ex_report = classification_report(y_ex_test, ex_preds, output_dict=True, zero_division=0)
        form_report = classification_report(y_form_test, form_preds, output_dict=True, zero_division=0)

        latency = ModelEvaluator.benchmark_latency(classifier, iterations=300)

        return {
            "exercise_classification_report": ex_report,
            "form_classification_report": form_report,
            "latency_metrics": latency
        }
