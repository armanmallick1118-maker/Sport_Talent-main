"""
ATHENA AGE+ Module.
Designed for older adults:
- Mobility, balance, flexibility, safe functional strength, daily walking
- Low-impact & chair exercises
- Safe movement cues and fall-prevention routines
- CAREGIVER / FAMILY MODE (activated strictly with explicit user consent)
"""
from typing import Dict, Any, List

CHAIR_AND_BALANCE_ROUTINES = [
    {
        "id": "chair_sit_to_stand",
        "name": "Chair Sit-to-Stand",
        "category": "Functional Strength",
        "reps": "8–10 reps",
        "safety_tip": "Use a sturdy armless chair against a wall. Press through whole feet with chest tall."
    },
    {
        "id": "seated_leg_extension",
        "name": "Seated Quad Extensions",
        "category": "Joint Mobility",
        "reps": "10 reps each side",
        "safety_tip": "Hold the side of chair for balance. Extend smoothly and hold for 1 second at top."
    },
    {
        "id": "standing_heel_raises",
        "name": "Supported Heel Raises",
        "category": "Calf & Ankle Stability",
        "reps": "10–12 reps",
        "safety_tip": "Rest hands lightly on the kitchen counter or back of chair for stability."
    },
    {
        "id": "tandem_balance_stance",
        "name": "Tandem Stance (Heel-to-Toe)",
        "category": "Balance & Fall Prevention",
        "reps": "15–20 seconds per side",
        "safety_tip": "Keep one hand near a supportive wall or sturdy counter."
    },
    {
        "id": "seated_torso_twist",
        "name": "Gentle Seated Spinal Rotation",
        "category": "Mobility & Comfort",
        "reps": "5 slow rotations each side",
        "safety_tip": "Breathe gently out as you rotate; never force into sharp discomfort."
    }
]

def get_age_plus_dashboard(mobility_tier: str = "CHAIR_ASSISTED", caregiver_consented: bool = False) -> Dict[str, Any]:
    """
    Returns age-appropriate exercise program and caregiver mode status.
    """
    return {
        "title": "ATHENA AGE+ Functional Mobility & Vitality",
        "mobility_tier": mobility_tier,
        "daily_movement_target": "20–30 minutes of distributed low-impact movement",
        "recommended_routines": CHAIR_AND_BALANCE_ROUTINES,
        "caregiver_mode": {
            "is_enabled": caregiver_consented,
            "permissions": "Activity completion and mobility check-ins only" if caregiver_consented else "Disabled (Requires explicit consent)",
            "consent_required_note": "Caregiver viewing requires explicit participant consent to protect personal autonomy and privacy."
        },
        "safety_guidelines": [
            "Always exercise in a well-lit space with clear floor paths.",
            "Wear supportive, non-slip footwear.",
            "Stop immediately if experiencing dizziness, pain, or shortness of breath."
        ]
    }
