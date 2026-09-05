from setuptools import setup, find_packages

setup(
    name="athena-motion",
    version="0.1.0",
    description="Modular and reusable computer vision biomechanics & CPU-trained ML pipeline",
    packages=find_packages(),
    include_package_data=True,
    package_data={
        "athena_motion": ["assets/models/*"]
    },
    install_requires=[
        "opencv-python>=4.10.0",
        "mediapipe>=1.0.0",
        "numpy>=1.24.0",
        "scikit-learn>=1.3.0",
        "scipy>=1.10.0",
        "joblib>=1.3.0",
        "onnx>=1.16.0",
        "onnxruntime>=1.18.0",
        "pandas>=2.0.0",
        "tqdm>=4.65.0"
    ],
    entry_points={
        "console_scripts": [
            "athena-motion=athena_motion.cli:main"
        ]
    },
    python_requires=">=3.10"
)
