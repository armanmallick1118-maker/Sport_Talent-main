# MediaPipeline — Athlete Motion Tracking API

An end-to-end athlete tracking pipeline that ingests video, extracts frames, detects persons using YOLOv8, estimates 33-landmark poses using MediaPipe, checks quality, cleans data, exports motion JSON, and overlays skeletons.

## Quick Start (Docker)
Get the API up and running locally in 5 lines:
```bash
git clone <repository_url>
cd MEDIAPIPELINE
make build
make up
```
The API is now running at `http://localhost:8000`.

## API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/upload` | POST | Upload a video file to create a processing session |
| `/api/v1/process` | POST | Trigger background pipeline processing for a session |
| `/api/v1/process/{id}/status` | GET | Check the status/progress of a processing job |
| `/api/v1/results/{id}/motion` | GET | Get the generated `motion_data.json` |
| `/api/v1/visualize/{id}/preview` | GET | Get a GIF preview of the skeleton tracking |
| `/api/v1/visualize/{id}/video` | GET | Download the full skeleton overlay MP4 |
| `/api/v1/export/batch` | GET | Batch export data for multiple sessions |
| `/api/v1/results/{id}/tensor` | GET | ML-ready flat array export (Phase 5) |
| `/api/v1/results/{id}/stream` | GET | SSE stream of frame pose data (Phase 5) |

*Full OpenAPI documentation is available at `http://localhost:8000/docs` or `http://localhost:8000/redoc` once running.*

## Motion JSON Schema

The `/api/v1/results/{id}/motion` endpoint returns the motion data matching the following schema:
```json
{
  "session_id": "string",
  "athlete_id": "string (optional)",
  "video_metadata": { "fps": 30, "width": 1920, "height": 1080 },
  "total_frames": 100,
  "processed_frames": 100,
  "dropped_frames": [],
  "frames": [
    {
      "frame_number": 0,
      "timestamp_ms": 0.0,
      "pose": {
        "landmarks": {
          "nose": {
            "x": 0.5, "y": 0.5, "z": 0.0, "visibility": 0.9,
            "world_x": 0.0, "world_y": 0.0, "world_z": 0.0
          }
        },
        "joint_angles": { "left_knee_angle": 170.0 }
      },
      "quality": {
        "is_valid": true,
        "issues": []
      }
    }
  ],
  "summary_stats": {}
}
```

## 33 Landmark Reference
The 33 MediaPipe pose landmarks provided:
1. `nose` (0)
2. `left_eye_inner` (1)
3. `left_eye` (2)
4. `left_eye_outer` (3)
5. `right_eye_inner` (4)
6. `right_eye` (5)
7. `right_eye_outer` (6)
8. `left_ear` (7)
9. `right_ear` (8)
10. `mouth_left` (9)
11. `mouth_right` (10)
12. `left_shoulder` (11)
13. `right_shoulder` (12)
14. `left_elbow` (13)
15. `right_elbow` (14)
16. `left_wrist` (15)
17. `right_wrist` (16)
18. `left_pinky` (17)
19. `right_pinky` (18)
20. `left_index` (19)
21. `right_index` (20)
22. `left_thumb` (21)
23. `right_thumb` (22)
24. `left_hip` (23)
25. `right_hip` (24)
26. `left_knee` (25)
27. `right_knee` (26)
28. `left_ankle` (27)
29. `right_ankle` (28)
30. `left_heel` (29)
31. `right_heel` (30)
32. `left_foot_index` (31)
33. `right_foot_index` (32)

## Phase 5 Integration Guide
Downstream ML pipelines (Phase 5) can consume the data via dedicated export hooks:
- **Batch Retrieval:** `/api/v1/export/batch?session_ids=id1,id2` will bundle outputs together.
- **ML Tensor Endpoint:** `/api/v1/results/{id}/tensor` exposes the data in a NumPy-friendly structure with shape `[num_frames, 33, 7]` (where 7 represents `x, y, z, vis, world_x, world_y, world_z`).
- **Server-Sent Events (SSE):** `/api/v1/results/{id}/stream` streams frame data as it's being generated.

> Note: Real-time SSE and webhook implementations can be added to the `/api/routes/results.py` module extending the mock templates.
