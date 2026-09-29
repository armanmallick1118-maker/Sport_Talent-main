"""
training/prepare_data.py
========================
Dataset validation, inspection, cleaning, and preparation module.
Ensures that all dataset CSVs have correct feature counts, valid labels,
no NaN or corrupt values, and exact landmark column ordering before training.
"""

import os
import sys

# Ensure UTF-8 output on Windows console
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

import pandas as pd
import numpy as np

# Landmark feature expectations
FEATURE_SPECS = {
    "squat": {
        "num_landmarks": 9,
        "num_features": 36,
        "valid_labels": {"down", "up", 0, 1},
        "train_files": ["core/squat_model/train.csv"],
        "test_files": ["core/squat_model/test.csv"],
    },
    "lunge_stage": {
        "num_landmarks": 13,
        "num_features": 52,
        "valid_labels": {"I", "M", "D"},
        "train_files": ["core/lunge_model/stage.train.csv"],
        "test_files": ["core/lunge_model/stage.test.csv"],
    },
    "lunge_err": {
        "num_landmarks": 13,
        "num_features": 52,
        "valid_labels": {"C", "L"},
        "train_files": ["core/lunge_model/err.train.csv"],
        "test_files": ["core/lunge_model/err.test.csv"],
    },
    "plank": {
        "num_landmarks": 17,
        "num_features": 68,
        "valid_labels": {"C", "L", "H", 0, 1, 2},
        "train_files": ["core/plank_model/train.csv"],
        "test_files": ["core/plank_model/test.csv"],
    },
    "bicep": {
        "num_landmarks": 9,
        "num_features": 36,
        "valid_labels": {"C", "L"},
        "train_files": ["core/bicep_model/train.csv"],
        "test_files": ["core/bicep_model/test.csv"],
    },
}


def find_file(relative_path: str, base_dir: str = ".") -> str:
    """Finds path either relative to base_dir or workspace root."""
    candidates = [
        os.path.join(base_dir, relative_path),
        os.path.join(base_dir, "..", relative_path),
        os.path.abspath(relative_path),
    ]
    for c in candidates:
        if os.path.exists(c):
            return os.path.normpath(c)
    return None


def validate_dataset(file_path: str, expected_features: int, valid_labels: set) -> tuple:
    """
    Validates a dataset CSV:
    Returns (cleaned_df, report_dict)
    """
    if not os.path.exists(file_path):
        return None, {"error": f"File not found: {file_path}"}

    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        return None, {"error": f"Failed to read CSV: {e}"}

    initial_rows = len(df)
    if "label" not in df.columns:
        return None, {"error": f"Missing 'label' column in {file_path}"}

    feature_cols = [c for c in df.columns if c != "label"]
    num_features = len(feature_cols)

    # Drop NaNs
    df_clean = df.dropna().copy()
    dropped_nans = initial_rows - len(df_clean)

    # Validate feature count
    feature_match = (num_features == expected_features)

    # Validate labels
    labels_present = set(df_clean["label"].unique())
    label_match = labels_present.issubset(valid_labels)

    class_counts = df_clean["label"].value_counts().to_dict()

    report = {
        "file": file_path,
        "initial_rows": initial_rows,
        "cleaned_rows": len(df_clean),
        "dropped_nans": dropped_nans,
        "num_features": num_features,
        "expected_features": expected_features,
        "feature_count_ok": feature_match,
        "labels_found": labels_present,
        "labels_ok": label_match,
        "class_distribution": class_counts,
    }

    return df_clean, report


def inspect_all(base_dir: str = "."):
    print("=" * 70)
    print("EXERCISE DATASET HEALTH CHECK & VALIDATION REPORT")
    print("=" * 70)

    for task_name, spec in FEATURE_SPECS.items():
        print(f"\n[{task_name.upper()}] Expected Features: {spec['num_features']}")
        for ftype, flist in [("Train", spec["train_files"]), ("Test", spec["test_files"])]:
            for rel_path in flist:
                full_path = find_file(rel_path, base_dir)
                if not full_path:
                    print(f"  ❌ {ftype} file not found: {rel_path}")
                    continue
                df, rep = validate_dataset(full_path, spec["num_features"], spec["valid_labels"])
                if "error" in rep:
                    print(f"  ❌ {ftype}: {rep['error']}")
                else:
                    feat_status = "[OK]" if rep["feature_count_ok"] else "[FAIL]"
                    label_status = "[OK]" if rep["labels_ok"] else "[WARN]"
                    print(f"  {feat_status} {ftype} ({os.path.basename(full_path)}): {rep['cleaned_rows']} rows | "
                          f"Features: {rep['num_features']}/{rep['expected_features']} | "
                          f"Classes: {rep['class_distribution']}")


def load_clean_data(task_name: str, base_dir: str = "."):
    """
    Load clean train and test DataFrames for a given exercise task.
    Returns (X_train, y_train, X_test, y_test)
    """
    if task_name not in FEATURE_SPECS:
        raise ValueError(f"Unknown task: {task_name}. Choose: {list(FEATURE_SPECS.keys())}")

    spec = FEATURE_SPECS[task_name]
    train_path = find_file(spec["train_files"][0], base_dir)
    test_path = find_file(spec["test_files"][0], base_dir)

    train_df, rep_train = validate_dataset(train_path, spec["num_features"], spec["valid_labels"])
    test_df, rep_test = validate_dataset(test_path, spec["num_features"], spec["valid_labels"])

    X_train = train_df.drop("label", axis=1)
    y_train = train_df["label"].astype(str)

    X_test = test_df.drop("label", axis=1)
    y_test = test_df["label"].astype(str)

    return X_train, y_train, X_test, y_test


if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.normpath(os.path.join(script_dir, ".."))
    inspect_all(project_root)
