"""
Unit Tests for ATHENA-MOTION Dataset Generation & Storage.
"""

import os
import pytest
import pandas as pd
import numpy as np

from athena_motion.dataset.generator import DatasetGenerator
from athena_motion.dataset.storage import save_dataset, load_dataset
from athena_motion.dataset.schema import TOTAL_FEATURE_COUNT, ALL_FEATURE_NAMES

def test_synthetic_dataset_generation():
    generator = DatasetGenerator()
    df = generator.generate_synthetic_exercise_dataset(n_samples_per_class=10, random_state=42)

    assert isinstance(df, pd.DataFrame)
    assert len(df) > 0
    assert "exercise" in df.columns
    assert "form_quality" in df.columns

    # Verify all 148 feature columns exist
    for col in ALL_FEATURE_NAMES:
        assert col in df.columns

    # Verify no NaN values
    assert not df.isnull().values.any()

def test_dataset_save_and_load(tmp_path):
    generator = DatasetGenerator()
    df = generator.generate_synthetic_exercise_dataset(n_samples_per_class=5, random_state=42)

    # Test CSV
    csv_path = str(tmp_path / "test_data.csv")
    save_dataset(df, csv_path)
    assert os.path.isfile(csv_path)

    X_csv, y_ex_csv, y_form_csv, loaded_df_csv = load_dataset(csv_path)
    assert X_csv.shape[1] == TOTAL_FEATURE_COUNT
    assert len(X_csv) == len(df)
    assert len(y_ex_csv) == len(df)

    # Test NPZ
    npz_path = str(tmp_path / "test_data.npz")
    save_dataset(df, npz_path)
    assert os.path.isfile(npz_path)

    X_npz, y_ex_npz, y_form_npz, loaded_df_npz = load_dataset(npz_path)
    assert X_npz.shape == X_csv.shape
