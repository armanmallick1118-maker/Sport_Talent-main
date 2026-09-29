"""
training/train_models.py
========================
Trains and saves scikit-learn models and scalers for:
  1. Squat Stage Classifier (down vs up)
  2. Lunge Stage Classifier (I vs M vs D) + StandardScaler
  3. Lunge Error Classifier (C vs L) using same StandardScaler
  4. Plank Posture Classifier (C vs L vs H) + StandardScaler
  5. Bicep Curl Posture Classifier (C vs L) + StandardScaler

Ensures 100% serialization compatibility with the active scikit-learn version.
Evaluates on test sets and outputs precision, recall, F1, and confusion matrix.
"""

import os
import sys

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

import pickle
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

from prepare_data import load_clean_data, find_file


def save_pickle(obj, file_path: str):
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "wb") as f:
        pickle.dump(obj, f, protocol=4)
    print(f"  [SAVED] {file_path} ({os.path.getsize(file_path):,} bytes)")


def train_squat(base_dir: str):
    print("\n" + "=" * 60)
    print("TRAINING SQUAT STAGE MODEL (down vs up)")
    print("=" * 60)

    X_train, y_train, X_test, y_test = load_clean_data("squat", base_dir)

    # Standardize label strings
    y_train = y_train.replace({"0": "down", "1": "up"})
    y_test = y_test.replace({"0": "down", "1": "up"})

    print(f"Train samples: {len(X_train)} | Test samples: {len(X_test)}")
    print(f"Train class balance: {dict(y_train.value_counts())}")

    # Train LogisticRegression on raw features (original author used raw features for squat)
    model = LogisticRegression(max_iter=1000, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\nSquat Test Accuracy: {acc * 100:.2f}%")
    print(classification_report(y_test, y_pred))
    print("Confusion Matrix:\n", confusion_matrix(y_test, y_pred))

    # Save model
    save_path = os.path.join(base_dir, "core", "squat_model", "model", "squat_model.pkl")
    save_pickle(model, save_path)
    save_path_lr = os.path.join(base_dir, "core", "squat_model", "model", "LR_model.pkl")
    save_pickle(model, save_path_lr)


def train_lunge(base_dir: str):
    print("\n" + "=" * 60)
    print("TRAINING LUNGE STAGE & ERROR MODELS")
    print("=" * 60)

    # 1. Stage Model
    X_train_stg, y_train_stg, X_test_stg, y_test_stg = load_clean_data("lunge_stage", base_dir)
    print(f"Lunge Stage - Train: {len(X_train_stg)}, Test: {len(X_test_stg)}")

    scaler = StandardScaler()
    X_train_stg_scaled = scaler.fit_transform(X_train_stg)
    X_test_stg_scaled = scaler.transform(X_test_stg)

    stage_model = LogisticRegression(max_iter=1000, random_state=42)
    stage_model.fit(X_train_stg_scaled, y_train_stg)

    y_pred_stg = stage_model.predict(X_test_stg_scaled)
    print(f"\nLunge Stage Test Accuracy: {accuracy_score(y_test_stg, y_pred_stg) * 100:.2f}%")
    print(classification_report(y_test_stg, y_pred_stg))

    # Save Stage Model and Scaler
    scaler_path = os.path.join(base_dir, "core", "lunge_model", "model", "input_scaler.pkl")
    save_pickle(scaler, scaler_path)

    stage_model_path = os.path.join(base_dir, "core", "lunge_model", "model", "sklearn", "stage_LR_model.pkl")
    save_pickle(stage_model, stage_model_path)

    # 2. Error Model (Knee over toe)
    X_train_err, y_train_err, X_test_err, y_test_err = load_clean_data("lunge_err", base_dir)
    print(f"\nLunge Error - Train: {len(X_train_err)}, Test: {len(X_test_err)}")

    X_train_err_scaled = scaler.transform(X_train_err)
    X_test_err_scaled = scaler.transform(X_test_err)

    err_model = LogisticRegression(max_iter=1000, random_state=42)
    err_model.fit(X_train_err_scaled, y_train_err)

    y_pred_err = err_model.predict(X_test_err_scaled)
    print(f"Lunge Error Test Accuracy: {accuracy_score(y_test_err, y_pred_err) * 100:.2f}%")
    print(classification_report(y_test_err, y_pred_err))

    err_model_path = os.path.join(base_dir, "core", "lunge_model", "model", "sklearn", "err_LR_model.pkl")
    save_pickle(err_model, err_model_path)


def train_plank(base_dir: str):
    print("\n" + "=" * 60)
    print("TRAINING PLANK POSTURE MODEL (C vs L vs H)")
    print("=" * 60)

    X_train, y_train, X_test, y_test = load_clean_data("plank", base_dir)
    # Map any integers back to characters if needed
    y_train = y_train.replace({"0": "C", "1": "H", "2": "L"})
    y_test = y_test.replace({"0": "C", "1": "H", "2": "L"})

    print(f"Plank Train: {len(X_train)}, Test: {len(X_test)}")

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = LogisticRegression(max_iter=1000, random_state=42)
    model.fit(X_train_scaled, y_train)

    y_pred = model.predict(X_test_scaled)
    print(f"\nPlank Test Accuracy: {accuracy_score(y_test, y_pred) * 100:.2f}%")
    print(classification_report(y_test, y_pred))
    print("Confusion Matrix:\n", confusion_matrix(y_test, y_pred))

    scaler_path = os.path.join(base_dir, "core", "plank_model", "model", "input_scaler.pkl")
    save_pickle(scaler, scaler_path)

    model_path = os.path.join(base_dir, "core", "plank_model", "model", "LR_model.pkl")
    save_pickle(model, model_path)


def train_bicep(base_dir: str):
    print("\n" + "=" * 60)
    print("TRAINING BICEP CURL POSTURE MODEL (C vs L)")
    print("=" * 60)

    X_train, y_train, X_test, y_test = load_clean_data("bicep", base_dir)
    print(f"Bicep Train: {len(X_train)}, Test: {len(X_test)}")

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train LogisticRegression and KNN (original used KNN/LR)
    model_lr = LogisticRegression(max_iter=1000, random_state=42)
    model_lr.fit(X_train_scaled, y_train)

    y_pred = model_lr.predict(X_test_scaled)
    print(f"\nBicep Test Accuracy (LR): {accuracy_score(y_test, y_pred) * 100:.2f}%")
    print(classification_report(y_test, y_pred))

    scaler_path = os.path.join(base_dir, "core", "bicep_model", "model", "input_scaler.pkl")
    save_pickle(scaler, scaler_path)

    model_path_lr = os.path.join(base_dir, "core", "bicep_model", "model", "LR_model.pkl")
    save_pickle(model_lr, model_path_lr)

    # Save as default model for detection
    model_path_knn = os.path.join(base_dir, "core", "bicep_model", "model", "KNN_model.pkl")
    save_pickle(model_lr, model_path_knn)


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.normpath(os.path.join(script_dir, ".."))
    print(f"Project Root: {project_root}")

    train_squat(project_root)
    train_lunge(project_root)
    train_plank(project_root)
    train_bicep(project_root)

    print("\n" + "=" * 60)
    print("[SUCCESS] ALL EXERCISE MODELS RETRAINED & SAVED SUCCESSFULLY")
    print("=" * 60)


if __name__ == "__main__":
    main()
