"""
ATHENA-MOTION: Temporal Kinematics and Repetition State Machine.
Tracks repetition lifecycle (eccentric/concentric phases), rep counts,
cadence/tempo, and movement consistency across athletic cycles.
"""

from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
import time
import numpy as np

from athena_motion.dataset.schema import RepPhase, ExerciseType

@dataclass
class RepetitionStats:
    """Detailed analytics for a completed athletic repetition."""
    rep_number: int
    duration_sec: float
    min_angle: float
    max_angle: float
    eccentric_duration_sec: float
    concentric_duration_sec: float
    form_issues_detected: List[str] = field(default_factory=list)


Tuple_RepUpdate = tuple[int, RepPhase, bool]


class RepetitionCounter:
    """
    Hysteresis-based repetition state machine with phase tracking and cadence monitoring.
    Works dynamically across squats, pushups, bicep curls, deadlifts, and lunges.
    """
    def __init__(
        self,
        exercise_type: ExerciseType = ExerciseType.SQUAT,
        start_threshold: float = 160.0,  # Extended/Standing angle
        inflection_threshold: float = 100.0, # Depth / turnaround angle
        hysteresis_margin: float = 8.0,
        min_rep_duration_sec: float = 0.6 # Filter out accidental micro-twitches
    ):
        self.exercise_type = exercise_type
        self.start_threshold = start_threshold
        self.inflection_threshold = inflection_threshold
        self.hysteresis = hysteresis_margin
        self.min_rep_duration = min_rep_duration_sec

        self.rep_count: int = 0
        self.current_phase: RepPhase = RepPhase.IDLE
        self.rep_history: List[RepetitionStats] = []

        # State timestamps & kinematics
        self._rep_start_time: Optional[float] = None
        self._inflection_time: Optional[float] = None
        self._current_min_angle: float = 999.0
        self._current_max_angle: float = -999.0
        self._last_angle: float = 180.0
        self._last_time: float = time.time()
        self._current_rep_issues: List[str] = []

    def set_exercise(self, exercise_type: ExerciseType) -> None:
        """Configures threshold parameters for the selected exercise."""
        self.exercise_type = exercise_type
        if exercise_type == ExerciseType.SQUAT:
            self.start_threshold = 160.0
            self.inflection_threshold = 95.0
        elif exercise_type == ExerciseType.PUSHUP:
            self.start_threshold = 155.0
            self.inflection_threshold = 90.0
        elif exercise_type == ExerciseType.BICEP_CURL:
            # For curl: standing arm is 160, top inflection is < 50
            self.start_threshold = 150.0
            self.inflection_threshold = 55.0
        elif exercise_type == ExerciseType.DEADLIFT:
            self.start_threshold = 165.0
            self.inflection_threshold = 100.0
        elif exercise_type == ExerciseType.LUNGE:
            self.start_threshold = 155.0
            self.inflection_threshold = 95.0
        else:
            self.start_threshold = 160.0
            self.inflection_threshold = 100.0

    def update(
        self,
        current_angle: float,
        timestamp: Optional[float] = None,
        form_fault: Optional[str] = None
    ) -> Tuple_RepUpdate:
        """
        Updates rep state machine with latest primary joint angle.
        Returns: (rep_count, current_phase, is_new_rep_completed)
        """
        now = timestamp if timestamp is not None else time.time()
        new_rep_completed = False

        if form_fault and form_fault not in self._current_rep_issues:
            self._current_rep_issues.append(form_fault)

        # Track min/max angle within the movement cycle
        self._current_min_angle = min(self._current_min_angle, current_angle)
        self._current_max_angle = max(self._current_max_angle, current_angle)

        # State transitions
        if self.current_phase == RepPhase.IDLE:
            # Movement initiated: angle starts descending past threshold
            if current_angle < (self.start_threshold - self.hysteresis):
                self.current_phase = RepPhase.ECCENTRIC
                self._rep_start_time = now
                self._current_min_angle = current_angle
                self._current_max_angle = current_angle
                self._current_rep_issues = []

        elif self.current_phase == RepPhase.ECCENTRIC:
            # Continuing downward toward inflection
            if current_angle <= self.inflection_threshold:
                self.current_phase = RepPhase.INFLECTION
                self._inflection_time = now
            elif current_angle > (self.start_threshold - 2.0):
                # User aborted rep before reaching depth
                self.current_phase = RepPhase.IDLE

        elif self.current_phase == RepPhase.INFLECTION:
            # Turnaround point: user begins ascending
            if current_angle > (self._current_min_angle + self.hysteresis):
                self.current_phase = RepPhase.CONCENTRIC

        elif self.current_phase == RepPhase.CONCENTRIC:
            # Ascending back to starting extension
            if current_angle >= (self.start_threshold - self.hysteresis):
                rep_duration = now - (self._rep_start_time or now)
                if rep_duration >= self.min_rep_duration:
                    self.rep_count += 1
                    new_rep_completed = True

                    ecc_dur = (self._inflection_time - self._rep_start_time) if self._inflection_time and self._rep_start_time else (rep_duration / 2)
                    con_dur = (now - self._inflection_time) if self._inflection_time else (rep_duration / 2)

                    stat = RepetitionStats(
                        rep_number=self.rep_count,
                        duration_sec=round(rep_duration, 2),
                        min_angle=round(self._current_min_angle, 1),
                        max_angle=round(self._current_max_angle, 1),
                        eccentric_duration_sec=round(max(ecc_dur, 0.1), 2),
                        concentric_duration_sec=round(max(con_dur, 0.1), 2),
                        form_issues_detected=list(self._current_rep_issues)
                    )
                    self.rep_history.append(stat)

                # Reset for next repetition
                self.current_phase = RepPhase.IDLE
                self._rep_start_time = None
                self._inflection_time = None
                self._current_min_angle = 999.0
                self._current_max_angle = -999.0
                self._current_rep_issues = []

        self._last_angle = current_angle
        self._last_time = now
        return (self.rep_count, self.current_phase, new_rep_completed)

    def get_consistency_score(self) -> float:
        """
        Calculates consistency percentage (0-100%) based on tempo & depth stability.
        """
        if len(self.rep_history) < 2:
            return 100.0

        durations = [r.duration_sec for r in self.rep_history]
        min_angles = [r.min_angle for r in self.rep_history]

        dur_std = np.std(durations)
        dur_mean = np.mean(durations) + 1e-4
        cv_dur = min(dur_std / dur_mean, 1.0) # Coefficient of variation

        ang_std = np.std(min_angles)
        cv_ang = min(ang_std / 45.0, 1.0)

        # Consistency = 100 - weighted CV penalty
        score = 100.0 * (1.0 - 0.5 * cv_dur - 0.5 * cv_ang)
        return float(np.clip(score, 20.0, 100.0))

    def reset(self) -> None:
        """Resets rep counts and history."""
        self.rep_count = 0
        self.current_phase = RepPhase.IDLE
        self.rep_history.clear()
        self._rep_start_time = None
        self._inflection_time = None
        self._current_min_angle = 999.0
        self._current_max_angle = -999.0
        self._current_rep_issues = []
