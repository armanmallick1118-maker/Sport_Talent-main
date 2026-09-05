"""
ATHENA-MOTION: Model Exporter & Cross-Project Portability Layer.
Serializes trained models to Joblib and exports to ONNX format with companion JSON metadata
so the model can be used across any programming language or runtime without dependencies.
"""

import os
import json
from typing import Dict, Any, Optional, Tuple
import joblib
import numpy as np
import onnxruntime as ort

from athena_motion.dataset.schema import ALL_FEATURE_NAMES, TOTAL_FEATURE_COUNT
from athena_motion.models.classifier import AthenaMotionClassifier, MotionPrediction

class ModelExporter:
    """
    Exports trained AthenaMotionClassifier to Joblib and portable ONNX files.
    """
    @staticmethod
    def export_joblib(
        classifier: AthenaMotionClassifier,
        output_path: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Saves full classifier instance to .joblib artifact."""
        out_dir = os.path.dirname(os.path.abspath(output_path))
        if out_dir:
            os.makedirs(out_dir, exist_ok=True)

        payload = {
            "version": "0.1.0",
            "feature_names": ALL_FEATURE_NAMES,
            "exercise_classes": classifier.exercise_classes_,
            "form_classes": classifier.form_classes_,
            "exercise_model": classifier.exercise_model,
            "form_model": classifier.form_model,
            "metadata": metadata or {}
        }
        joblib.dump(payload, output_path)

        # Write metadata JSON
        meta_path = os.path.splitext(output_path)[0] + "_spec.json"
        spec = {
            "version": "0.1.0",
            "model_format": "joblib",
            "num_features": TOTAL_FEATURE_COUNT,
            "feature_names": ALL_FEATURE_NAMES,
            "exercise_classes": classifier.exercise_classes_,
            "form_classes": classifier.form_classes_,
            "custom_metadata": metadata or {}
        }
        with open(meta_path, "w") as f:
            json.dump(spec, f, indent=2)

        print(f"[ATHENA-MOTION] Model exported to Joblib: {output_path}")
        return output_path

    @staticmethod
    def load_joblib(model_path: str) -> AthenaMotionClassifier:
        """Loads classifier from .joblib artifact."""
        if not os.path.isfile(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")

        payload = joblib.load(model_path)
        classifier = AthenaMotionClassifier(
            exercise_model=payload["exercise_model"],
            form_model=payload["form_model"]
        )
        classifier.exercise_classes_ = payload["exercise_classes"]
        classifier.form_classes_ = payload["form_classes"]
        classifier.is_fitted = True
        return classifier

    @staticmethod
    def export_onnx(
        classifier: AthenaMotionClassifier,
        output_dir: str,
        target_opset: int = 15
    ) -> Tuple[str, str, str]:
        """
        Exports both exercise and form models to ONNX format.
        Returns paths: (exercise_onnx_path, form_onnx_path, metadata_json_path)
        """
        try:
            from skl2onnx import convert_sklearn
            from skl2onnx.common.data_types import FloatTensorType
        except ImportError:
            raise ImportError("skl2onnx is required for ONNX export. Run 'pip install skl2onnx'.")

        os.makedirs(output_dir, exist_ok=True)
        initial_type = [("float_input", FloatTensorType([None, TOTAL_FEATURE_COUNT]))]

        # 1. Convert Exercise Model to ONNX
        ex_onnx = convert_sklearn(
            classifier.exercise_model,
            initial_types=initial_type,
            target_opset=target_opset
        )
        ex_onnx_path = os.path.join(output_dir, "athena_exercise_model.onnx")
        with open(ex_onnx_path, "wb") as f:
            f.write(ex_onnx.SerializeToString())

        # 2. Convert Form Model to ONNX
        form_onnx = convert_sklearn(
            classifier.form_model,
            initial_types=initial_type,
            target_opset=target_opset
        )
        form_onnx_path = os.path.join(output_dir, "athena_form_model.onnx")
        with open(form_onnx_path, "wb") as f:
            f.write(form_onnx.SerializeToString())

        # 3. Write ONNX Metadata specification
        meta_path = os.path.join(output_dir, "athena_motion_onnx_spec.json")
        spec = {
            "framework": "ONNX",
            "version": "0.1.0",
            "input_name": "float_input",
            "input_shape": ["batch_size", TOTAL_FEATURE_COUNT],
            "feature_names": ALL_FEATURE_NAMES,
            "exercise_classes": classifier.exercise_classes_,
            "form_classes": classifier.form_classes_,
            "models": {
                "exercise_model": os.path.basename(ex_onnx_path),
                "form_model": os.path.basename(form_onnx_path)
            }
        }
        with open(meta_path, "w") as f:
            json.dump(spec, f, indent=2)

        print(f"[ATHENA-MOTION] ONNX models and metadata exported to {output_dir}")
        return ex_onnx_path, form_onnx_path, meta_path


class OnnxMotionRunner:
    """
    Lightweight runtime runner executing inference purely via ONNX Runtime.
    Requires NO Scikit-Learn or PyTorch! Perfect for drop-in use in any Python application.
    """
    def __init__(self, model_dir: str):
        meta_path = os.path.join(model_dir, "athena_motion_onnx_spec.json")
        if not os.path.isfile(meta_path):
            raise FileNotFoundError(f"ONNX metadata spec not found at {meta_path}")

        with open(meta_path, "r") as f:
            self.spec = json.load(f)

        self.exercise_classes = self.spec["exercise_classes"]
        self.form_classes = self.spec["form_classes"]

        ex_path = os.path.join(model_dir, self.spec["models"]["exercise_model"])
        form_path = os.path.join(model_dir, self.spec["models"]["form_model"])

        # Create ONNX Runtime CPU Inference Sessions
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = 2
        self.ex_session = ort.InferenceSession(ex_path, sess_options=opts, providers=["CPUExecutionProvider"])
        self.form_session = ort.InferenceSession(form_path, sess_options=opts, providers=["CPUExecutionProvider"])
        self.input_name = self.spec["input_name"]

    def predict(self, feature_vector: np.ndarray) -> MotionPrediction:
        """Runs fast CPU ONNX inference on a 148-dimensional feature vector."""
        feat = np.asarray(feature_vector, dtype=np.float32).reshape(1, -1)

        # Run Exercise Model
        ex_outs = self.ex_session.run(None, {self.input_name: feat})
        # Typically out 0 is label, out 1 is probabilities
        ex_label = ex_outs[0][0]
        ex_probs = ex_outs[1]
        ex_conf = 1.0
        if isinstance(ex_probs, list) and len(ex_probs) > 0 and isinstance(ex_probs[0], dict):
            ex_conf = float(ex_probs[0].get(ex_label, 1.0))
        elif hasattr(ex_probs, "shape"):
            ex_conf = float(np.max(ex_probs))

        # Run Form Model
        form_outs = self.form_session.run(None, {self.input_name: feat})
        form_label = form_outs[0][0]
        form_probs = form_outs[1]
        form_conf = 1.0
        if isinstance(form_probs, list) and len(form_probs) > 0 and isinstance(form_probs[0], dict):
            form_conf = float(form_probs[0].get(form_label, 1.0))
        elif hasattr(form_probs, "shape"):
            form_conf = float(np.max(form_probs))

        # Coaching cue
        is_good = "good" in str(form_label).lower()
        cue = "MAINTAIN FORM & TEMPO" if is_good else f"ATTENTION: {str(form_label).upper()}"

        return MotionPrediction(
            exercise=str(ex_label),
            exercise_confidence=round(ex_conf, 3),
            form_quality=str(form_label),
            form_confidence=round(form_conf, 3),
            feedback_cue=cue,
            is_good_form=is_good
        )
