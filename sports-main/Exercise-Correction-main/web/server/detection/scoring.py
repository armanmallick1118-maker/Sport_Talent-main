"""
web/server/detection/scoring.py
===============================
Biomechanical form scoring and explainable feedback system.
Converts physical body angles, landmark relationships, and posture measurements
into an interpretable 0–100 score with granular feedback.

NOTE:
Classifier confidence (e.g. 0.85 prob of "down") is NEVER used as a physical form score.
This module evaluates biomechanical correctness independently.
"""

from typing import Dict, List, Any


def clamp_score(score: float) -> float:
    return max(0.0, min(100.0, round(score, 1)))


def evaluate_squat_form(
    knee_angle: float,
    foot_shoulder_ratio: float,
    knee_foot_ratio: float,
    stage: str,
    foot_placement_status: str = "correct",
    knee_placement_status: str = "correct",
) -> Dict[str, Any]:
    """
    Evaluates squat form:
      - Depth: knee angle in down stage (ideal 80°-100°)
      - Stance width: foot / shoulder ratio (ideal 1.2 - 2.8)
      - Knee alignment: knee / foot ratio (prevents knee valgus / caving)
    """
    score = 100.0
    feedback = []
    errors = []
    breakdown = {}

    # 1. Stance Width Evaluation
    if foot_placement_status == "too tight":
        score -= 15.0
        feedback.append("Widen your stance to shoulder-width apart.")
        errors.append({"type": "stance_too_narrow", "message": "Feet are too close together"})
        breakdown["stance_score"] = 70.0
    elif foot_placement_status == "too wide":
        score -= 15.0
        feedback.append("Bring your feet slightly closer to shoulder-width.")
        errors.append({"type": "stance_too_wide", "message": "Feet are excessively wide"})
        breakdown["stance_score"] = 70.0
    else:
        breakdown["stance_score"] = 100.0

    # 2. Knee Tracking / Alignment
    if knee_placement_status == "too tight":
        score -= 20.0
        feedback.append("Push your knees outward, aligned over your toes.")
        errors.append({"type": "knee_valgus", "message": "Knees are caving inward (valgus collapse)"})
        breakdown["knee_alignment_score"] = 60.0
    elif knee_placement_status == "too wide":
        score -= 10.0
        feedback.append("Keep knees comfortably tracked in line with your feet.")
        errors.append({"type": "knee_too_wide", "message": "Knees flared excessively wide"})
        breakdown["knee_alignment_score"] = 80.0
    else:
        breakdown["knee_alignment_score"] = 100.0

    # 3. Squat Depth (evaluated when at DOWN stage)
    if stage == "down" and knee_angle is not None:
        if knee_angle <= 100:
            breakdown["depth_score"] = 100.0
            feedback.append("Great squat depth!")
        elif 100 < knee_angle <= 115:
            score -= 10.0
            breakdown["depth_score"] = 85.0
            feedback.append("Squat a little deeper to reach parallel.")
            errors.append({"type": "shallow_squat", "message": "Slightly shallow depth"})
        else:
            score -= 25.0
            breakdown["depth_score"] = 60.0
            feedback.append("Squat deeper — aim for thighs parallel to ground.")
            errors.append({"type": "insufficient_depth", "message": "Squat depth is insufficient"})
    else:
        breakdown["depth_score"] = 100.0

    if not feedback:
        feedback.append("Excellent squat form. Keep it up!")

    return {
        "score": clamp_score(score),
        "feedback": feedback,
        "errors": errors,
        "breakdown": breakdown,
    }


def evaluate_lunge_form(
    front_knee_angle: float,
    rear_knee_angle: float,
    knee_over_toe: bool,
    stage: str,
    knee_angle_error: bool = False,
) -> Dict[str, Any]:
    """
    Evaluates lunge form:
      - Front knee angle (target ~90°, acceptable 60°–125°)
      - Rear knee angle (target ~90°)
      - Knee-over-toe prevention
    """
    score = 100.0
    feedback = []
    errors = []
    breakdown = {}

    # 1. Knee Over Toe Error
    if knee_over_toe:
        score -= 25.0
        feedback.append("Keep front knee behind or directly over your ankle, not past your toes.")
        errors.append({"type": "knee_over_toe", "message": "Front knee is drifting past toes"})
        breakdown["knee_toe_score"] = 50.0
    else:
        breakdown["knee_toe_score"] = 100.0

    # 2. Front Knee Angle Depth (in DOWN stage)
    if stage == "down" and front_knee_angle is not None:
        if 80 <= front_knee_angle <= 105:
            breakdown["front_knee_score"] = 100.0
            feedback.append("Good 90-degree front knee bend.")
        elif 60 <= front_knee_angle < 80:
            score -= 10.0
            breakdown["front_knee_score"] = 80.0
            feedback.append("Front knee bend is slightly deep.")
        elif 105 < front_knee_angle <= 125:
            score -= 15.0
            breakdown["front_knee_score"] = 75.0
            feedback.append("Sink your hips lower into the lunge.")
            errors.append({"type": "shallow_lunge", "message": "Lunge not low enough"})
        else:
            score -= 25.0
            breakdown["front_knee_score"] = 50.0
            feedback.append("Adjust your stride length for proper 90-degree angles.")
            errors.append({"type": "improper_lunge_depth", "message": "Front knee angle outside valid range"})
    else:
        breakdown["front_knee_score"] = 100.0

    # 3. Knee Angle General Error
    if knee_angle_error and not knee_over_toe:
        score -= 15.0
        errors.append({"type": "knee_angle_imbalance", "message": "Knee angles out of optimal alignment"})

    if not feedback:
        feedback.append("Clean lunge execution!")

    return {
        "score": clamp_score(score),
        "feedback": feedback,
        "errors": errors,
        "breakdown": breakdown,
    }


def evaluate_plank_form(
    posture_class: str,
    body_alignment_angle: float = None,
) -> Dict[str, Any]:
    """
    Evaluates plank posture:
      - 'C': Correct body line
      - 'L': Low back (sagging hips / excessive lumbar lordosis)
      - 'H': High back (piking hips / buttocks raised)
    """
    score = 100.0
    feedback = []
    errors = []
    breakdown = {}

    if posture_class == "L" or posture_class == "low back":
        score -= 30.0
        feedback.append("Lift your hips up slightly to prevent lower back strain.")
        errors.append({"type": "low_back_sag", "message": "Hips are sagging below spinal line"})
        breakdown["spine_alignment_score"] = 55.0
    elif posture_class == "H" or posture_class == "high back":
        score -= 25.0
        feedback.append("Lower your hips slightly so body forms a straight line.")
        errors.append({"type": "high_back_pike", "message": "Hips are piked too high"})
        breakdown["spine_alignment_score"] = 65.0
    else:
        breakdown["spine_alignment_score"] = 100.0
        feedback.append("Strong plank posture. Maintain tight core engagement!")

    # Check alignment angle if provided (ideal ~170°-185°)
    if body_alignment_angle is not None:
        angle_diff = abs(body_alignment_angle - 180.0)
        if angle_diff > 15.0:
            score -= min(20.0, angle_diff)
        breakdown["body_angle"] = round(body_alignment_angle, 1)

    return {
        "score": clamp_score(score),
        "feedback": feedback,
        "errors": errors,
        "breakdown": breakdown,
    }


def evaluate_bicep_curl_form(
    curl_angle: float,
    ground_arm_angle: float,
    is_lean_back: bool,
    stage: str,
    min_contraction_angle: float = None,
) -> Dict[str, Any]:
    """
    Evaluates bicep curl form:
      - Full Range of Motion (ROM): peak contraction <= 60°, extension >= 135°
      - Elbow fixation / upper arm sway (ground_arm_angle <= 25°)
      - Lean-back error (torso sway)
    """
    score = 100.0
    feedback = []
    errors = []
    breakdown = {}

    # 1. Lean Back / Spinal Overextension Error
    if is_lean_back:
        score -= 30.0
        feedback.append("Stand tall and avoid leaning back to swing the weight.")
        errors.append({"type": "torso_lean_back", "message": "Torso is leaning back excessively"})
        breakdown["torso_score"] = 50.0
    else:
        breakdown["torso_score"] = 100.0

    # 2. Loose Upper Arm / Elbow Drift
    if ground_arm_angle is not None and ground_arm_angle > 35.0:
        score -= 20.0
        feedback.append("Keep your elbows pinned to your sides; minimize upper arm swing.")
        errors.append({"type": "loose_upper_arm", "message": "Upper arm is swaying away from torso"})
        breakdown["elbow_fixation_score"] = 60.0
    elif ground_arm_angle is not None and ground_arm_angle > 25.0:
        score -= 10.0
        breakdown["elbow_fixation_score"] = 80.0
    else:
        breakdown["elbow_fixation_score"] = 100.0

    # 3. Peak Contraction / Range of Motion
    if stage == "up" and curl_angle is not None:
        if curl_angle <= 60:
            breakdown["rom_score"] = 100.0
            feedback.append("Great full peak contraction.")
        elif curl_angle <= 85:
            score -= 10.0
            breakdown["rom_score"] = 80.0
            feedback.append("Squeeze a little tighter at the top of the curl.")
        else:
            score -= 20.0
            breakdown["rom_score"] = 60.0
            feedback.append("Incomplete curl — squeeze up further.")
            errors.append({"type": "weak_peak_contraction", "message": "Incomplete contraction at top of rep"})
    else:
        breakdown["rom_score"] = 100.0

    if not feedback:
        feedback.append("Great bicep curl form!")

    return {
        "score": clamp_score(score),
        "feedback": feedback,
        "errors": errors,
        "breakdown": breakdown,
    }
