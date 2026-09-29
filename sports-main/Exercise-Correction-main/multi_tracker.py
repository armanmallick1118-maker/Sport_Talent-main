"""
Multi-Exercise AI Workout Tracker
==================================
Uses MediaPipe Pose + OpenCV to count reps (or track hold-time for planks)
across six exercises:

    1) Bicep Curl   - left / right / both arms
    2) Squat        - both legs (average knee angle)
    3) Push-up      - both arms (average elbow angle)
    4) Lunge        - left / right / both legs
    5) Plank        - hold-timer (not rep based)
    6) Glute Bridge - both hips (average hip angle)

ADDED:
    - Exercise-specific joint-angle target ranges
    - 0-100 live form-accuracy score
    - Separate left/right lunge and curl scores
    - Basic form feedback
    - Scores are based on the current visible pose and are NOT a medical
      assessment.

CONTROLS (press while the video window is focused):
    1 / 2 / 3 / 4 / 5 / 6   -> switch exercise
    b                        -> side mode = BOTH   (curl & lunge only)
    l                        -> side mode = LEFT   (curl & lunge only)
    r                        -> side mode = RIGHT  (curl & lunge only)
    c                        -> reset counters/timer for current exercise
    q                        -> quit

CAMERA POSITIONING TIPS:
    - Curl, Squat, Lunge : front-facing or 3/4 view works best.
    - Push-up, Plank, Glute Bridge : side-on view works best.

IMPORTANT:
    These angle ranges are practical computer-vision targets, not universal
    anatomical "exact" values. Camera perspective, body proportions,
    mobility, and exercise style can change measured angles. Tune them after
    testing on real videos.
"""

import time
import cv2
import mediapipe as mp
import numpy as np

mp_drawing = mp.solutions.drawing_utils
mp_pose = mp.solutions.pose


# ---------------------------------------------------------------------------
# Joint-angle ranges (degrees)
#
# "REST" is the starting/extended position.
# "PEAK" is the deep/contracted position used for rep counting.
# Target ranges are also used by the scoring system.
# ---------------------------------------------------------------------------

# BICEP CURL
CURL_REST_RANGE = (150, 180)       # elbow: arm mostly straight
CURL_PEAK_RANGE = (30, 45)         # elbow: strong curl
CURL_SCORE_RANGE = (30, 180)

# SQUAT
SQUAT_REST_RANGE = (160, 180)      # knee: standing
SQUAT_PEAK_RANGE = (80, 100)       # knee: approximately 90 degrees
SQUAT_HIP_RANGE = (70, 110)        # hip angle at the bottom

# PUSH-UP
PUSHUP_REST_RANGE = (160, 180)     # elbow: arms extended
PUSHUP_PEAK_RANGE = (80, 100)      # elbow: approximately 90 degrees
PUSHUP_BODY_RANGE = (160, 180)     # shoulder-hip-ankle alignment

# LUNGE
LUNGE_REST_RANGE = (160, 180)      # straight/standing leg
LUNGE_FRONT_KNEE_RANGE = (80, 100) # front knee at bottom
LUNGE_FRONT_HIP_RANGE = (80, 110)  # front hip at bottom
LUNGE_REAR_KNEE_RANGE = (80, 120)  # rear knee at bottom
LUNGE_TORSO_RANGE = (0, 15)        # degrees away from vertical

# PLANK
PLANK_BODY_RANGE = (160, 180)      # shoulder-hip-ankle alignment

# GLUTE BRIDGE
BRIDGE_REST_RANGE = (80, 120)      # hip angle when hips are down
BRIDGE_PEAK_RANGE = (160, 180)     # hip angle when hips are lifted


EXERCISE_NAMES = {
    "curl": "Bicep Curl",
    "squat": "Squat",
    "pushup": "Push-up",
    "lunge": "Lunge",
    "plank": "Plank",
    "bridge": "Glute Bridge",
}


# ---------------------------------------------------------------------------
# Utility functions
# ---------------------------------------------------------------------------

def calculate_angle(a, b, c):
    """Angle (degrees) at point b, formed by points a-b-c."""
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)

    radians = (
        np.arctan2(c[1] - b[1], c[0] - b[0])
        - np.arctan2(a[1] - b[1], a[0] - b[0])
    )
    angle = np.abs(radians * 180.0 / np.pi)

    if angle > 180.0:
        angle = 360 - angle

    return angle


def lm(landmarks, name):
    """Return normalized [x, y] for a named PoseLandmark."""
    point = landmarks[mp_pose.PoseLandmark[name].value]
    return [point.x, point.y]


def to_pixel(point, width, height):
    return tuple(np.multiply(point, [width, height]).astype(int))


def put_angle_text(image, angle, pixel_point, label=""):
    text = f"{label}{angle:.1f}" if label else f"{angle:.1f}"
    cv2.putText(
        image,
        text,
        pixel_point,
        cv2.FONT_HERSHEY_SIMPLEX,
        0.5,
        (255, 255, 255),
        2,
        cv2.LINE_AA,
    )


def clamp(value, low, high):
    return max(low, min(high, value))


def range_score(angle, low, high):
    """
    Return 100 when angle is inside [low, high].
    The score decreases smoothly outside the target range.
    """
    if low <= angle <= high:
        return 100.0

    distance = low - angle if angle < low else angle - high

    # 1 degree outside = small penalty; 30+ degrees outside = 0.
    return clamp(100.0 - (distance / 30.0) * 100.0, 0.0, 100.0)


def centered_range_score(angle, low, high):
    """Same idea as range_score, kept as a named helper for readability."""
    return range_score(angle, low, high)


def vertical_torso_angle(shoulder, hip):
    """
    Angle of the torso from vertical.
    0 degrees = perfectly vertical.
    """
    dx = shoulder[0] - hip[0]
    dy = shoulder[1] - hip[1]

    # Image y increases downwards, but absolute angle from vertical is enough.
    return abs(np.degrees(np.arctan2(dx, -dy)))


def put_score(image, score, x, y, label="Accuracy"):
    cv2.putText(
        image,
        f"{label}: {score:.0f}%",
        (x, y),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255, 255, 255),
        2,
        cv2.LINE_AA,
    )


def put_feedback(image, feedback, x, y):
    cv2.putText(
        image,
        feedback[:48],
        (x, y),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.5,
        (255, 255, 255),
        1,
        cv2.LINE_AA,
    )


# ---------------------------------------------------------------------------
# Central mutable state for all exercises
# ---------------------------------------------------------------------------

class State:
    def __init__(self):
        self.exercise = "curl"
        self.side_mode = "both"

        self.counters = {
            "curl_left": 0,
            "curl_right": 0,
            "squat": 0,
            "pushup": 0,
            "lunge_left": 0,
            "lunge_right": 0,
            "bridge": 0,
        }

        self.stages = {
            "curl_left": None,
            "curl_right": None,
            "squat": None,
            "pushup": None,
            "lunge_left": None,
            "lunge_right": None,
            "bridge": None,
        }

        # Live accuracy scores.
        self.scores = {
            "curl_left": 0.0,
            "curl_right": 0.0,
            "squat": 0.0,
            "pushup": 0.0,
            "lunge_left": 0.0,
            "lunge_right": 0.0,
            "bridge": 0.0,
            "plank": 0.0,
        }

        self.feedback = "Waiting for pose..."

        # Plank is time-based rather than rep-based.
        self.plank_in_position = False
        self.plank_segment_start = None
        self.plank_current_hold = 0.0
        self.plank_best_hold = 0.0

    def reset_current(self):
        """Reset counters/timer for whichever exercise is active."""
        if self.exercise == "curl":
            self.counters["curl_left"] = 0
            self.counters["curl_right"] = 0
            self.stages["curl_left"] = None
            self.stages["curl_right"] = None
            self.scores["curl_left"] = 0
            self.scores["curl_right"] = 0

        elif self.exercise == "squat":
            self.counters["squat"] = 0
            self.stages["squat"] = None
            self.scores["squat"] = 0

        elif self.exercise == "pushup":
            self.counters["pushup"] = 0
            self.stages["pushup"] = None
            self.scores["pushup"] = 0

        elif self.exercise == "lunge":
            self.counters["lunge_left"] = 0
            self.counters["lunge_right"] = 0
            self.stages["lunge_left"] = None
            self.stages["lunge_right"] = None
            self.scores["lunge_left"] = 0
            self.scores["lunge_right"] = 0

        elif self.exercise == "plank":
            self.plank_in_position = False
            self.plank_segment_start = None
            self.plank_current_hold = 0.0
            self.plank_best_hold = 0.0
            self.scores["plank"] = 0

        elif self.exercise == "bridge":
            self.counters["bridge"] = 0
            self.stages["bridge"] = None
            self.scores["bridge"] = 0


# ---------------------------------------------------------------------------
# Per-exercise processing functions
# ---------------------------------------------------------------------------

def process_curl(landmarks, state, image, w, h):
    sides = []
    if state.side_mode in ("both", "left"):
        sides.append("L")
    if state.side_mode in ("both", "right"):
        sides.append("R")

    side_scores = []

    for side in sides:
        prefix = "LEFT" if side == "L" else "RIGHT"
        key = "curl_left" if side == "L" else "curl_right"

        shoulder = lm(landmarks, f"{prefix}_SHOULDER")
        elbow = lm(landmarks, f"{prefix}_ELBOW")
        wrist = lm(landmarks, f"{prefix}_WRIST")

        angle = calculate_angle(shoulder, elbow, wrist)
        put_angle_text(image, angle, to_pixel(elbow, w, h), "E:")

        # Score is strongest when the elbow is near either the correct
        # extended or correctly curled position.
        rest_score = range_score(angle, *CURL_REST_RANGE)
        peak_score = range_score(angle, *CURL_PEAK_RANGE)
        score = max(rest_score, peak_score)

        state.scores[key] = score
        side_scores.append(score)

        if angle >= CURL_REST_RANGE[0]:
            state.stages[key] = "down"

        if angle <= CURL_PEAK_RANGE[1] and state.stages[key] == "down":
            state.stages[key] = "up"
            state.counters[key] += 1

    if side_scores:
        state.feedback = (
            "Good curl range"
            if sum(side_scores) / len(side_scores) >= 80
            else "Keep elbow controlled and reach the target range"
        )


def process_squat(landmarks, state, image, w, h):
    hip_l = lm(landmarks, "LEFT_HIP")
    knee_l = lm(landmarks, "LEFT_KNEE")
    ankle_l = lm(landmarks, "LEFT_ANKLE")

    hip_r = lm(landmarks, "RIGHT_HIP")
    knee_r = lm(landmarks, "RIGHT_KNEE")
    ankle_r = lm(landmarks, "RIGHT_ANKLE")

    angle_l = calculate_angle(hip_l, knee_l, ankle_l)
    angle_r = calculate_angle(hip_r, knee_r, ankle_r)

    hip_angle_l = calculate_angle(
        lm(landmarks, "LEFT_SHOULDER"), hip_l, knee_l
    )
    hip_angle_r = calculate_angle(
        lm(landmarks, "RIGHT_SHOULDER"), hip_r, knee_r
    )

    avg_knee = (angle_l + angle_r) / 2.0
    avg_hip = (hip_angle_l + hip_angle_r) / 2.0

    put_angle_text(image, angle_l, to_pixel(knee_l, w, h), "K:")
    put_angle_text(image, angle_r, to_pixel(knee_r, w, h), "K:")

    knee_score = max(
        range_score(avg_knee, *SQUAT_REST_RANGE),
        range_score(avg_knee, *SQUAT_PEAK_RANGE),
    )
    hip_score = range_score(avg_hip, *SQUAT_HIP_RANGE)

    state.scores["squat"] = 0.75 * knee_score + 0.25 * hip_score

    key = "squat"

    if avg_knee >= SQUAT_REST_RANGE[0]:
        state.stages[key] = "up"

    if avg_knee <= SQUAT_PEAK_RANGE[1] and state.stages[key] == "up":
        state.stages[key] = "down"
        state.counters[key] += 1

    if state.scores[key] >= 80:
        state.feedback = "Good squat depth and hip position"
    elif avg_knee > 100:
        state.feedback = "Go a little deeper: aim for 80-100° knee angle"
    else:
        state.feedback = "Keep knees and hips controlled"


def process_pushup(landmarks, state, image, w, h):
    shoulder_l = lm(landmarks, "LEFT_SHOULDER")
    elbow_l = lm(landmarks, "LEFT_ELBOW")
    wrist_l = lm(landmarks, "LEFT_WRIST")

    shoulder_r = lm(landmarks, "RIGHT_SHOULDER")
    elbow_r = lm(landmarks, "RIGHT_ELBOW")
    wrist_r = lm(landmarks, "RIGHT_WRIST")

    angle_l = calculate_angle(shoulder_l, elbow_l, wrist_l)
    angle_r = calculate_angle(shoulder_r, elbow_r, wrist_r)

    hip_l = lm(landmarks, "LEFT_HIP")
    ankle_l = lm(landmarks, "LEFT_ANKLE")
    hip_r = lm(landmarks, "RIGHT_HIP")
    ankle_r = lm(landmarks, "RIGHT_ANKLE")

    body_l = calculate_angle(shoulder_l, hip_l, ankle_l)
    body_r = calculate_angle(shoulder_r, hip_r, ankle_r)

    avg_elbow = (angle_l + angle_r) / 2.0
    avg_body = (body_l + body_r) / 2.0

    put_angle_text(image, angle_l, to_pixel(elbow_l, w, h), "E:")
    put_angle_text(image, angle_r, to_pixel(elbow_r, w, h), "E:")

    elbow_score = max(
        range_score(avg_elbow, *PUSHUP_REST_RANGE),
        range_score(avg_elbow, *PUSHUP_PEAK_RANGE),
    )
    body_score = range_score(avg_body, *PUSHUP_BODY_RANGE)

    state.scores["pushup"] = 0.70 * elbow_score + 0.30 * body_score

    key = "pushup"

    if avg_elbow >= PUSHUP_REST_RANGE[0]:
        state.stages[key] = "up"

    if avg_elbow <= PUSHUP_PEAK_RANGE[1] and state.stages[key] == "up":
        state.stages[key] = "down"
        state.counters[key] += 1

    if state.scores[key] >= 80:
        state.feedback = "Good push-up depth and body alignment"
    elif avg_elbow > 100:
        state.feedback = "Lower further: aim for 80-100° elbow angle"
    else:
        state.feedback = "Keep your body in a straight line"


def process_lunge(landmarks, state, image, w, h):
    sides = []
    if state.side_mode in ("both", "left"):
        sides.append("L")
    if state.side_mode in ("both", "right"):
        sides.append("R")

    side_scores = []

    for side in sides:
        # The selected side is the FRONT leg.
        prefix = "LEFT" if side == "L" else "RIGHT"
        other = "RIGHT" if side == "L" else "LEFT"
        key = "lunge_left" if side == "L" else "lunge_right"

        front_hip = lm(landmarks, f"{prefix}_HIP")
        front_knee = lm(landmarks, f"{prefix}_KNEE")
        front_ankle = lm(landmarks, f"{prefix}_ANKLE")

        rear_hip = lm(landmarks, f"{other}_HIP")
        rear_knee = lm(landmarks, f"{other}_KNEE")
        rear_ankle = lm(landmarks, f"{other}_ANKLE")

        front_knee_angle = calculate_angle(
            front_hip, front_knee, front_ankle
        )

        front_hip_angle = calculate_angle(
            lm(landmarks, f"{prefix}_SHOULDER"),
            front_hip,
            front_knee,
        )

        rear_knee_angle = calculate_angle(
            rear_hip, rear_knee, rear_ankle
        )

        torso_angle = vertical_torso_angle(
            lm(landmarks, f"{prefix}_SHOULDER"),
            front_hip,
        )

        put_angle_text(
            image,
            front_knee_angle,
            to_pixel(front_knee, w, h),
            "FK:",
        )

        # Score the current pose against all important lunge angles.
        knee_score = max(
            range_score(front_knee_angle, *LUNGE_REST_RANGE),
            range_score(front_knee_angle, *LUNGE_FRONT_KNEE_RANGE),
        )
        front_hip_score = max(
            range_score(front_hip_angle, *LUNGE_REST_RANGE),
            range_score(front_hip_angle, *LUNGE_FRONT_HIP_RANGE),
        )
        rear_knee_score = max(
            range_score(rear_knee_angle, *LUNGE_REST_RANGE),
            range_score(rear_knee_angle, *LUNGE_REAR_KNEE_RANGE),
        )

        # Torso is expected to stay close to vertical.
        torso_score = range_score(torso_angle, *LUNGE_TORSO_RANGE)

        # Front-leg form gets the highest weight.
        score = (
            0.45 * knee_score
            + 0.20 * front_hip_score
            + 0.20 * rear_knee_score
            + 0.15 * torso_score
        )

        state.scores[key] = score
        side_scores.append(score)

        # Rep counting: start standing, then reach a genuine lunge depth.
        if front_knee_angle >= LUNGE_REST_RANGE[0]:
            state.stages[key] = "up"

        if (
            front_knee_angle <= LUNGE_FRONT_KNEE_RANGE[1]
            and state.stages[key] == "up"
        ):
            state.stages[key] = "down"
            state.counters[key] += 1

    if side_scores:
        average = sum(side_scores) / len(side_scores)

        if average >= 85:
            state.feedback = (
                "Excellent lunge form: front knee near 90°"
            )
        elif average >= 70:
            state.feedback = (
                "Good lunge; refine knee/hip angles for higher accuracy"
            )
        else:
            state.feedback = (
                "Aim: front knee 80-100°, front hip 80-110°, rear knee 80-120°"
            )


def process_plank(landmarks, state, image, w, h):
    shoulder_l = lm(landmarks, "LEFT_SHOULDER")
    hip_l = lm(landmarks, "LEFT_HIP")
    ankle_l = lm(landmarks, "LEFT_ANKLE")

    shoulder_r = lm(landmarks, "RIGHT_SHOULDER")
    hip_r = lm(landmarks, "RIGHT_HIP")
    ankle_r = lm(landmarks, "RIGHT_ANKLE")

    angle_l = calculate_angle(shoulder_l, hip_l, ankle_l)
    angle_r = calculate_angle(shoulder_r, hip_r, ankle_r)

    avg_angle = (angle_l + angle_r) / 2.0

    put_angle_text(image, avg_angle, to_pixel(hip_l, w, h), "B:")

    state.scores["plank"] = range_score(avg_angle, *PLANK_BODY_RANGE)

    in_position_now = (
        PLANK_BODY_RANGE[0] <= avg_angle <= PLANK_BODY_RANGE[1]
    )

    if in_position_now and not state.plank_in_position:
        state.plank_segment_start = time.time()
        state.plank_in_position = True

    elif in_position_now and state.plank_in_position:
        state.plank_current_hold = (
            time.time() - state.plank_segment_start
        )
        state.plank_best_hold = max(
            state.plank_best_hold,
            state.plank_current_hold,
        )

    elif not in_position_now and state.plank_in_position:
        state.plank_in_position = False
        state.plank_segment_start = None

    if state.scores["plank"] >= 85:
        state.feedback = "Excellent plank alignment"
    else:
        state.feedback = "Keep shoulder-hip-ankle angle between 160-180°"


def process_bridge(landmarks, state, image, w, h):
    shoulder_l = lm(landmarks, "LEFT_SHOULDER")
    hip_l = lm(landmarks, "LEFT_HIP")
    knee_l = lm(landmarks, "LEFT_KNEE")

    shoulder_r = lm(landmarks, "RIGHT_SHOULDER")
    hip_r = lm(landmarks, "RIGHT_HIP")
    knee_r = lm(landmarks, "RIGHT_KNEE")

    angle_l = calculate_angle(shoulder_l, hip_l, knee_l)
    angle_r = calculate_angle(shoulder_r, hip_r, knee_r)

    avg_angle = (angle_l + angle_r) / 2.0

    put_angle_text(image, avg_angle, to_pixel(hip_l, w, h), "H:")

    score = max(
        range_score(avg_angle, *BRIDGE_REST_RANGE),
        range_score(avg_angle, *BRIDGE_PEAK_RANGE),
    )
    state.scores["bridge"] = score

    key = "bridge"

    if avg_angle <= BRIDGE_REST_RANGE[1]:
        state.stages[key] = "down"

    if avg_angle >= BRIDGE_PEAK_RANGE[0] and state.stages[key] == "down":
        state.stages[key] = "up"
        state.counters[key] += 1

    if score >= 80:
        state.feedback = "Good bridge hip range"
    elif avg_angle < 160:
        state.feedback = "Lift hips higher: aim for 160-180° at the top"
    else:
        state.feedback = "Control the movement on the way down"


PROCESSORS = {
    "curl": process_curl,
    "squat": process_squat,
    "pushup": process_pushup,
    "lunge": process_lunge,
    "plank": process_plank,
    "bridge": process_bridge,
}


# ---------------------------------------------------------------------------
# On-screen overlay
# ---------------------------------------------------------------------------

def draw_overlay(image, state, w, h):
    cv2.rectangle(image, (0, 0), (390, 165), (245, 117, 16), -1)

    ex_label = EXERCISE_NAMES[state.exercise]

    cv2.putText(
        image,
        ex_label,
        (10, 22),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        (0, 0, 0),
        2,
        cv2.LINE_AA,
    )

    if state.exercise in ("curl", "lunge"):
        left_key = f"{state.exercise}_left"
        right_key = f"{state.exercise}_right"

        cv2.putText(
            image,
            f"MODE: {state.side_mode.upper()}",
            (10, 45),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (0, 0, 0),
            1,
            cv2.LINE_AA,
        )

        cv2.putText(
            image,
            f"L reps: {state.counters[left_key]}  Score: {state.scores[left_key]:.0f}%",
            (10, 72),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (255, 255, 255),
            2,
            cv2.LINE_AA,
        )

        cv2.putText(
            image,
            f"R reps: {state.counters[right_key]}  Score: {state.scores[right_key]:.0f}%",
            (10, 98),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (255, 255, 255),
            2,
            cv2.LINE_AA,
        )

        # Show the relevant target ranges for the selected exercise.
        if state.exercise == "lunge":
            target = "Front K:80-100  Hip:80-110"
        else:
            target = "Elbow: 30-45° peak / 150-180° rest"

        cv2.putText(
            image,
            target,
            (10, 122),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.40,
            (0, 0, 0),
            1,
            cv2.LINE_AA,
        )

    elif state.exercise == "plank":
        cv2.putText(
            image,
            f"Accuracy: {state.scores['plank']:.0f}%",
            (10, 55),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2,
            cv2.LINE_AA,
        )

        cv2.putText(
            image,
            f"Hold: {state.plank_current_hold:0.1f}s",
            (10, 82),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 255, 255),
            2,
            cv2.LINE_AA,
        )

        cv2.putText(
            image,
            f"Best: {state.plank_best_hold:0.1f}s",
            (10, 108),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (255, 255, 255),
            2,
            cv2.LINE_AA,
        )

        status = "HOLDING" if state.plank_in_position else "NOT IN POSITION"
        cv2.putText(
            image,
            status,
            (10, 132),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.45,
            (0, 0, 0),
            1,
            cv2.LINE_AA,
        )

        cv2.putText(
            image,
            "Body angle target: 160-180°",
            (10, 153),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.40,
            (0, 0, 0),
            1,
            cv2.LINE_AA,
        )

    else:
        key = state.exercise

        cv2.putText(
            image,
            f"Reps: {state.counters[key]}",
            (10, 58),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.75,
            (255, 255, 255),
            2,
            cv2.LINE_AA,
        )

        cv2.putText(
            image,
            f"Accuracy: {state.scores[key]:.0f}%",
            (10, 87),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.65,
            (255, 255, 255),
            2,
            cv2.LINE_AA,
        )

        cv2.putText(
            image,
            f"Stage: {state.stages[key]}",
            (10, 114),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (0, 0, 0),
            1,
            cv2.LINE_AA,
        )

        if state.exercise == "squat":
            target = "Knee: 80-100° bottom / 160-180° standing"
        elif state.exercise == "pushup":
            target = "Elbow: 80-100° bottom / 160-180° top"
        else:
            target = "Hip: 160-180° top / 80-120° down"

        cv2.putText(
            image,
            target,
            (10, 140),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.39,
            (0, 0, 0),
            1,
            cv2.LINE_AA,
        )

    # Form feedback.
    put_feedback(image, state.feedback, 10, 190)

    # Control hints, bottom of frame.
    hint = (
        "[1]Curl [2]Squat [3]Pushup [4]Lunge [5]Plank [6]Bridge  "
        "[b/l/r]side [c]reset [q]quit"
    )
    cv2.putText(
        image,
        hint,
        (10, h - 10),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.45,
        (255, 255, 255),
        1,
        cv2.LINE_AA,
    )


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------

def main():
    state = State()
    cap = cv2.VideoCapture(0)

    with mp_pose.Pose(
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    ) as pose:

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            h, w = frame.shape[:2]

            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False
            results = pose.process(image)
            image.flags.writeable = True
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

            try:
                landmarks = results.pose_landmarks.landmark
                PROCESSORS[state.exercise](
                    landmarks, state, image, w, h
                )
            except AttributeError:
                state.feedback = "No pose detected"
                pass

            draw_overlay(image, state, w, h)

            if results.pose_landmarks:
                mp_drawing.draw_landmarks(
                    image,
                    results.pose_landmarks,
                    mp_pose.POSE_CONNECTIONS,
                    mp_drawing.DrawingSpec(
                        color=(245, 117, 66),
                        thickness=2,
                        circle_radius=2,
                    ),
                    mp_drawing.DrawingSpec(
                        color=(245, 66, 230),
                        thickness=2,
                        circle_radius=2,
                    ),
                )

            cv2.imshow("Mediapipe Feed", image)

            key = cv2.waitKey(10) & 0xFF

            if key == ord("q"):
                break

            elif key == ord("1"):
                state.exercise = "curl"
                state.stages["curl_left"] = None
                state.stages["curl_right"] = None

            elif key == ord("2"):
                state.exercise = "squat"
                state.stages["squat"] = None

            elif key == ord("3"):
                state.exercise = "pushup"
                state.stages["pushup"] = None

            elif key == ord("4"):
                state.exercise = "lunge"
                state.stages["lunge_left"] = None
                state.stages["lunge_right"] = None

            elif key == ord("5"):
                state.exercise = "plank"
                state.plank_in_position = False
                state.plank_segment_start = None
                state.plank_current_hold = 0.0

            elif key == ord("6"):
                state.exercise = "bridge"
                state.stages["bridge"] = None

            elif key == ord("b"):
                state.side_mode = "both"

            elif key == ord("l"):
                state.side_mode = "left"

            elif key == ord("r"):
                state.side_mode = "right"

            elif key == ord("c"):
                state.reset_current()

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
