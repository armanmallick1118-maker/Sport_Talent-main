"""
ATHENA-MOTION: CPU-Trained Machine Learning Model.
High-speed dual-target kinematic classifier predicting exercise category and
biomechanical form quality in under 2 milliseconds on standard CPU cores.
"""

from dataclasses import dataclass
from typing import Dict, Any, Optional, Tuple, List
import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier

from athena_motion.dataset.schema import ExerciseType, FormQuality

@dataclass
class MotionPrediction:
    """Biomechanical ML prediction result."""
    exercise: str
    exercise_confidence: float
    form_quality: str
    form_confidence: float
    feedback_cue: str
    is_good_form: bool

    def to_dict(self) -> Dict[str, Any]:
        return {
            "exercise": self.exercise,
            "exercise_confidence": round(self.exercise_confidence, 3),
            "form_quality": self.form_quality,
            "form_confidence": round(self.form_confidence, 3),
            "feedback_cue": self.feedback_cue,
            "is_good_form": self.is_good_form
        }


class AthenaMotionClassifier:
    """
    CPU-optimized multi-task classifier for movement classification and technique auditing.
    """
    def __init__(
        self,
        exercise_model: Optional[Any] = None,
        form_model: Optional[Any] = None
    ):
        # Optimized for fast CPU training and sub-millisecond inference
        self.exercise_model = exercise_model or HistGradientBoostingClassifier(
            max_iter=35,
            learning_rate=0.15,
            max_leaf_nodes=15,
            max_depth=5,
            random_state=42
        )
        self.form_model = form_model or HistGradientBoostingClassifier(
            max_iter=35,
            learning_rate=0.15,
            max_leaf_nodes=15,
            max_depth=5,
            random_state=42
        )
        self.is_fitted: bool = False
        self.exercise_classes_: List[str] = []
        self.form_classes_: List[str] = []

    def fit(
        self,
        X: np.ndarray,
        y_exercise: np.ndarray,
        y_form: np.ndarray
    ) -> "AthenaMotionClassifier":
        """
        Trains both classifiers on CPU using tabular feature matrix X.
        """
        X = np.asarray(X, dtype=np.float32)

        # 1. Train Exercise Classification Model
        self.exercise_model.fit(X, y_exercise)
        self.exercise_classes_ = list(self.exercise_model.classes_)

        # 2. Train Form Quality Assessment Model
        self.form_model.fit(X, y_form)
        self.form_classes_ = list(self.form_model.classes_)

        self.is_fitted = True
        return self

    def predict_frame(self, feature_vector: np.ndarray) -> MotionPrediction:
        """
        Runs sub-millisecond CPU inference for a single frame vector (shape: (148,)).
        """
        if not self.is_fitted:
            return MotionPrediction(
                exercise="Unknown",
                exercise_confidence=0.0,
                form_quality="Uncalibrated",
                form_confidence=0.0,
                feedback_cue="Model not trained",
                is_good_form=True
            )

        feat = np.asarray(feature_vector, dtype=np.float32).reshape(1, -1)

        # Predict Exercise
        ex_probs = self.exercise_model.predict_proba(feat)[0]
        ex_idx = int(np.argmax(ex_probs))
        exercise = self.exercise_classes_[ex_idx]
        ex_conf = float(ex_probs[ex_idx])

        # Predict Form Quality
        form_probs = self.form_model.predict_proba(feat)[0]
        form_idx = int(np.argmax(form_probs))
        form_quality = self.form_classes_[form_idx]
        form_conf = float(form_probs[form_idx])

        is_good = "good" in form_quality.lower()
        cue = self._generate_feedback_cue(exercise, form_quality)

        return MotionPrediction(
            exercise=exercise,
            exercise_confidence=ex_conf,
            form_quality=form_quality,
            form_confidence=form_conf,
            feedback_cue=cue,
            is_good_form=is_good
        )

    def _generate_feedback_cue(self, exercise: str, form_quality: str) -> str:
        """Generates actionable athletic coaching cue based on diagnosed fault."""
        fault = form_quality.lower()
        if "good" in fault:
            return "EXCELLENT FORM - MAINTAIN TEMPO"
        elif "valgus" in fault:
            return "KNEE VALGUS DETECTED: DRIVE KNEES OUTWARD OVER TOES"
        elif "forward_lean" in fault:
            return "EXCESSIVE TORSO LEAN: KEEP CHEST PROUD & CORE BRACED"
        elif "depth" in fault:
            return "INCOMPLETE DEPTH: DESCEND UNTIL THIGHS ARE PARALLEL"
        elif "flare" in fault:
            return "ELBOW FLARE: TUCK ELBOWS 45 DEGREES TO RIBCAGE"
        elif "rounded" in fault:
            return "ROUNDED BACK: RETRACT SCAPULAE & LOCK NEUTRAL SPINE"
        elif "asymmetrical" in fault:
            return "ASYMMETRICAL STANCE: EVENLY DISTRIBUTE WEIGHT ACROSS BOTH FEET"
        return f"ATTENTION: CHECK {form_quality.upper()}"
