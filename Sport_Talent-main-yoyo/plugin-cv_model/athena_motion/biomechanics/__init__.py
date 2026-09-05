"""
ATHENA-MOTION: Biomechanical Calculations Subsystem.
"""

from athena_motion.biomechanics.kinematics import (
    calculate_angle_2d,
    calculate_angle_3d,
    calculate_trunk_inclination,
    calculate_segment_tilt,
    calculate_euclidean_distance,
    calculate_midpoint
)
from athena_motion.biomechanics.metrics import (
    BiomechanicalMetrics,
    compute_biomechanical_metrics
)
from athena_motion.biomechanics.temporal import (
    RepetitionCounter,
    RepetitionStats
)
from athena_motion.biomechanics.features import (
    BiomechanicalFeatureExtractor
)
from athena_motion.biomechanics.posture_events import (
    PostureEventDetector,
    PostureEvent,
    PostureState
)
from athena_motion.biomechanics.event_logger import (
    MotionEventLogger,
    MotionEvent
)

__all__ = [
    "calculate_angle_2d",
    "calculate_angle_3d",
    "calculate_trunk_inclination",
    "calculate_segment_tilt",
    "calculate_euclidean_distance",
    "calculate_midpoint",
    "BiomechanicalMetrics",
    "compute_biomechanical_metrics",
    "RepetitionCounter",
    "RepetitionStats",
    "BiomechanicalFeatureExtractor",
    "PostureEventDetector",
    "PostureEvent",
    "PostureState",
    "MotionEventLogger",
    "MotionEvent"
]
