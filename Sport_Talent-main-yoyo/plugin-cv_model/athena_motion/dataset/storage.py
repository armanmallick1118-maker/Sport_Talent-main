"""
ATHENA-MOTION: Dataset Storage and Serialization Layer.
Saves and loads tabular biomechanical datasets in CSV, Parquet, and NumPy (.npz) formats.
"""

import os
import json
from typing import Tuple, Optional, Dict, Any
import numpy as np
import pandas as pd

from athena_motion.dataset.schema import ALL_FEATURE_NAMES

def save_dataset(
    df: pd.DataFrame,
    output_path: str,
    metadata: Optional[Dict[str, Any]] = None
) -> str:
    """
    Saves dataframe to disk in CSV, Parquet, or NPZ depending on file extension.
    Also creates accompanying .json metadata file.
    """
    out_dir = os.path.dirname(os.path.abspath(output_path))
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    ext = os.path.splitext(output_path)[1].lower()
    if ext == ".csv":
        df.to_csv(output_path, index=False)
    elif ext in [".parquet", ".pq"]:
        df.to_parquet(output_path, index=False)
    elif ext == ".npz":
        # Separate feature columns from labels
        feature_cols = [c for c in df.columns if c in ALL_FEATURE_NAMES]
        X = df[feature_cols].values.astype(np.float32)
        y_exercise = df["exercise"].values if "exercise" in df.columns else np.array([])
        y_form = df["form_quality"].values if "form_quality" in df.columns else np.array([])
        np.savez_compressed(output_path, X=X, y_exercise=y_exercise, y_form=y_form, feature_names=feature_cols)
    else:
        df.to_csv(output_path, index=False)

    # Save metadata JSON
    meta_path = os.path.splitext(output_path)[0] + "_metadata.json"
    info = {
        "num_samples": len(df),
        "num_features": len([c for c in df.columns if c in ALL_FEATURE_NAMES]),
        "exercise_distribution": df["exercise"].value_counts().to_dict() if "exercise" in df.columns else {},
        "form_distribution": df["form_quality"].value_counts().to_dict() if "form_quality" in df.columns else {},
        "custom_metadata": metadata or {}
    }
    with open(meta_path, "w") as f:
        json.dump(info, f, indent=2)

    return output_path


def load_dataset(dataset_path: str) -> Tuple[np.ndarray, np.ndarray, np.ndarray, pd.DataFrame]:
    """
    Loads dataset from CSV, Parquet, or NPZ.
    Returns: (X, y_exercise, y_form, full_df)
    """
    if not os.path.isfile(dataset_path):
        raise FileNotFoundError(f"Dataset file not found: {dataset_path}")

    ext = os.path.splitext(dataset_path)[1].lower()
    if ext == ".npz":
        data = np.load(dataset_path, allow_pickle=True)
        X = data["X"]
        y_ex = data["y_exercise"]
        y_form = data["y_form"]
        df = pd.DataFrame(X, columns=data["feature_names"])
        df["exercise"] = y_ex
        df["form_quality"] = y_form
        return X, y_ex, y_form, df

    elif ext in [".parquet", ".pq"]:
        df = pd.read_parquet(dataset_path)
    else:
        df = pd.read_csv(dataset_path)

    feature_cols = [c for c in df.columns if c in ALL_FEATURE_NAMES]
    if not feature_cols:
        # Fallback to all non-label columns
        feature_cols = [c for c in df.columns if c not in ["exercise", "form_quality", "timestamp", "frame_idx"]]

    X = df[feature_cols].values.astype(np.float32)
    y_exercise = df["exercise"].values.astype(str) if "exercise" in df.columns else np.array([])
    y_form = df["form_quality"].values.astype(str) if "form_quality" in df.columns else np.array([])

    return X, y_exercise, y_form, df
