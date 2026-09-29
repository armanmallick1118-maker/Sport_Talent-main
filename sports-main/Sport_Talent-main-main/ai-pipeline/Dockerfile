FROM python:3.9-slim

# Install system dependencies for OpenCV, MediaPipe, etc.
RUN apt-get update && apt-get install -y \
    build-essential \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install Python dependencies
COPY requirements.txt .

# Pre-install CPU-only PyTorch to prevent Railway from running out of memory downloading the 2GB GPU version
RUN pip install --no-cache-dir torch torchvision --extra-index-url https://download.pytorch.org/whl/cpu

RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Ensure storage directories exist
RUN mkdir -p storage/uploads storage/frames storage/results storage/visualizations

# Expose API port
EXPOSE 8000

# Start FastAPI application using dynamic port for Railway
CMD uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}
