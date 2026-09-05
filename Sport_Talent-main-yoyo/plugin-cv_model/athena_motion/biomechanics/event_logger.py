"""
ATHENA-MOTION: Motion Event Logger.
Logs kinematic transitions, posture holds, arm folds, and rep states with timestamps
both to disk (text & JSONL) and for live on-screen HUD terminal display.
"""

import os
import time
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict

from athena_motion.biomechanics.posture_events import PostureEvent, PostureState

@dataclass
class MotionEvent:
    """Structured kinematic log event."""
    timestamp: str            # ISO formatted timestamp
    elapsed_sec: float        # Session elapsed seconds
    event_type: str           # "STATE_ENTER", "STATE_HOLD", "STATE_EXIT"
    posture: str              # e.g. "ARMS_FOLDED_CROSSED"
    description: str
    duration_held_sec: float
    details: Dict[str, Any]

    def to_log_line(self) -> str:
        """Formats compact log line for display and file logging."""
        dur_str = f" | Held: {self.duration_held_sec:.1f}s" if self.duration_held_sec > 0 else ""
        return f"[{self.timestamp[11:19]}] [{self.event_type}] {self.description}{dur_str}"


class MotionEventLogger:
    """
    Stateful kinematic event logger tracking posture transitions and durations.
    """
    def __init__(
        self,
        log_dir: str = "logs",
        max_hud_events: int = 5,
        min_hold_duration_sec: float = 0.4
    ):
        self.log_dir = log_dir
        self.max_hud_events = max_hud_events
        self.min_hold_duration = min_hold_duration_sec

        self.start_time = time.time()
        self.active_posture = PostureEvent.NORMAL
        self.posture_start_time: Optional[float] = None
        self.recent_events: List[MotionEvent] = []

        # Ensure logs directory exists
        os.makedirs(self.log_dir, exist_ok=True)
        self.txt_log_path = os.path.join(self.log_dir, "motion_events.log")
        self.jsonl_log_path = os.path.join(self.log_dir, "motion_events.jsonl")

    def update(self, posture_state: PostureState) -> Optional[MotionEvent]:
        """
        Processes new posture state and logs transitions (ENTER, HOLD, EXIT).
        """
        now = time.time()
        elapsed = now - self.start_time
        detected = posture_state.active_posture

        event_to_record: Optional[MotionEvent] = None

        # State transition: User changed posture
        if detected != self.active_posture:
            prev_posture = self.active_posture
            duration_held = (now - self.posture_start_time) if self.posture_start_time else 0.0

            # Log exit of previous non-normal posture if held long enough
            if prev_posture != PostureEvent.NORMAL and duration_held >= self.min_hold_duration:
                exit_event = MotionEvent(
                    timestamp=datetime.now().isoformat(),
                    elapsed_sec=round(elapsed, 2),
                    event_type="RELEASE",
                    posture=prev_posture.value,
                    description=f"UN-FOLDED / RELEASED {prev_posture.value.replace('_', ' ').upper()}",
                    duration_held_sec=round(duration_held, 2),
                    details={"final_duration_sec": round(duration_held, 2)}
                )
                self._record_event(exit_event)

            # Start new posture
            self.active_posture = detected
            self.posture_start_time = now

            # If entered a notable posture (like arms folded)
            if detected != PostureEvent.NORMAL:
                enter_event = MotionEvent(
                    timestamp=datetime.now().isoformat(),
                    elapsed_sec=round(elapsed, 2),
                    event_type="TRIGGER",
                    posture=detected.value,
                    description=posture_state.description,
                    duration_held_sec=0.0,
                    details={
                        "left_elbow_angle": posture_state.left_elbow_angle,
                        "right_elbow_angle": posture_state.right_elbow_angle,
                        "wrist_distance": posture_state.wrist_distance,
                        "confidence": posture_state.confidence
                    }
                )
                self._record_event(enter_event)
                event_to_record = enter_event

        return event_to_record

    def _record_event(self, event: MotionEvent):
        """Appends event to HUD buffer and writes to persistent files."""
        self.recent_events.append(event)
        if len(self.recent_events) > self.max_hud_events:
            self.recent_events.pop(0)

        # Print to console
        print(f"[ATHENA-MOTION LOG] {event.to_log_line()}")

        # Append to txt log
        try:
            with open(self.txt_log_path, "a", encoding="utf-8") as f:
                f.write(event.to_log_line() + "\n")
        except Exception:
            pass

        # Append to JSONL log
        try:
            with open(self.jsonl_log_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(asdict(event)) + "\n")
        except Exception:
            pass

    def get_hud_log_lines(self) -> List[str]:
        """Returns the last N events formatted for the on-screen terminal box."""
        return [e.to_log_line() for e in self.recent_events]
