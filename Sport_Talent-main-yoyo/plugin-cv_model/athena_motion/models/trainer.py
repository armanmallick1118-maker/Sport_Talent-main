"""
ATHENA-MOTION: CPU Model Training Pipeline.
Trains high-performance motion classifiers on CPU with cross-validation and evaluation metrics.
"""

from typing import Dict, Any, Tuple, Optional
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, classification_report

from athena_motion.dataset.schema import ALL_FEATURE_NAMES
from athena_motion.dataset.generator import DatasetGenerator
from athena_motion.models.classifier import AthenaMotionClassifier

class ModelTrainer:
    """
    Orchestrates dataset ingestion, train/test splitting, CPU model fitting, and validation.
    """
    def __init__(self):
        self.generator = DatasetGenerator()

    def train(
        self,
        dataset: pd.DataFrame,
        test_size: float = 0.2,
        random_state: int = 42
    ) -> Tuple[AthenaMotionClassifier, Dict[str, Any]]:
        """
        Trains AthenaMotionClassifier on CPU from pandas DataFrame containing features + labels.
        """
        feature_cols = [c for c in dataset.columns if c in ALL_FEATURE_NAMES]
        if not feature_cols:
            raise ValueError("Dataset does not contain required athena-motion feature columns.")

        X = dataset[feature_cols].values.astype(np.float32)
        y_exercise = dataset["exercise"].values.astype(str)
        y_form = dataset["form_quality"].values.astype(str)

        # Train / Test split
        X_train, X_test, y_ex_train, y_ex_test, y_form_train, y_form_test = train_test_split(
            X, y_exercise, y_form, test_size=test_size, random_state=random_state, stratify=y_form
        )

        print(f"[ATHENA-MOTION] Training CPU classifier on {len(X_train)} samples across {X_train.shape[1]} features...")
        classifier = AthenaMotionClassifier()
        classifier.fit(X_train, y_ex_train, y_form_train)

        # Evaluation
        ex_pred = [classifier.predict_frame(row).exercise for row in X_test]
        form_pred = [classifier.predict_frame(row).form_quality for row in X_test]

        ex_acc = float(accuracy_score(y_ex_test, ex_pred))
        ex_f1 = float(f1_score(y_ex_test, ex_pred, average="weighted"))

        form_acc = float(accuracy_score(y_form_test, form_pred))
        form_f1 = float(f1_score(y_form_test, form_pred, average="weighted"))

        metrics = {
            "num_train_samples": int(len(X_train)),
            "num_test_samples": int(len(X_test)),
            "exercise_accuracy": round(ex_acc, 4),
            "exercise_f1_weighted": round(ex_f1, 4),
            "form_accuracy": round(form_acc, 4),
            "form_f1_weighted": round(form_f1, 4),
            "exercise_classes": classifier.exercise_classes_,
            "form_classes": classifier.form_classes_
        }

        print(f"[ATHENA-MOTION] Training Complete! Exercise Acc: {ex_acc*100:.2f}%, Form Acc: {form_acc*100:.2f}%")
        return classifier, metrics

    def train_from_synthetic(
        self,
        n_samples_per_class: int = 250,
        random_state: int = 42
    ) -> Tuple[AthenaMotionClassifier, Dict[str, Any], pd.DataFrame]:
        """
        Synthesizes realistic biomechanical training data and trains the CPU model instantly.
        """
        print(f"[ATHENA-MOTION] Generating calibrated synthetic dataset ({n_samples_per_class} samples/profile)...")
        dataset = self.generator.generate_synthetic_exercise_dataset(
            n_samples_per_class=n_samples_per_class,
            random_state=random_state
        )
        classifier, metrics = self.train(dataset, random_state=random_state)
        return classifier, metrics, dataset

    def train_squat_specialist(
        self,
        n_samples_per_fault: int = 400,
        random_state: int = 42
    ) -> Tuple[AthenaMotionClassifier, Dict[str, Any], pd.DataFrame]:
        """
        Trains specialized high-accuracy squat biomechanics classifier.
        """
        dataset = self.generator.generate_squat_dataset(
            n_samples_per_fault=n_samples_per_fault,
            random_state=random_state
        )
        classifier, metrics = self.train(dataset, random_state=random_state)
        return classifier, metrics, dataset
