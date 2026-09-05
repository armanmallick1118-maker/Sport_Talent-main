"""
ATHENA Sedentary Activity Intelligence & Healthy Competition Services.
- Sedentary: Tracks inactivity periods, gentle non-guilt movement breaks, mobility routines.
- Healthy Competition: Improvement-focused challenges and personal bests (never appearance/weight based).
"""
from typing import Dict, Any, List

SEDENTARY_BREAKS = [
    {
        "id": "desk_mobility",
        "title": "2-Minute Desk Mobility Break",
        "duration_minutes": 2,
        "cues": [
            "10 slow shoulder rolls backward",
            "5 gentle neck tilts side-to-side",
            "Standing hip circles (5 clockwise, 5 counterclockwise)"
        ]
    },
    {
        "id": "water_stride",
        "title": "Hydration & Corridor Stride",
        "duration_minutes": 4,
        "cues": [
            "Walk briskly to refill your water glass (250ml)",
            "10 calf raises while waiting",
            "3 deep diaphragmatic nasal breaths"
        ]
    },
    {
        "id": "hip_opener",
        "title": "Hip Flexor & Thoracic Opener",
        "duration_minutes": 3,
        "cues": [
            "Supported lunge stretch holding a doorway (30 sec each side)",
            "Standing chest-to-sky stretch with hands clasped behind back"
        ]
    }
]

def check_inactivity_status(inactive_minutes: int) -> Dict[str, Any]:
    """
    Evaluates sedentary duration. Delivers supportive, non-guilt encouragement.
    """
    if inactive_minutes >= 120:
        message = f"You've been focused at your desk for approximately {inactive_minutes // 60} hours. Want to take a short, refreshing movement break?"
        break_recommended = SEDENTARY_BREAKS[0]
    elif inactive_minutes >= 60:
        message = "About an hour of sitting logged. A gentle 2-minute posture refresh can restore circulation and mental clarity."
        break_recommended = SEDENTARY_BREAKS[1]
    else:
        message = "Activity cadence is balanced. Keep moving when natural opportunities arise."
        break_recommended = None

    return {
        "inactive_minutes": inactive_minutes,
        "message": message,
        "recommended_break": break_recommended
    }

HEALTHY_CHALLENGES = [
    {
        "id": "challenge_1",
        "title": "100 Minutes of Weekly Aerobic Movement",
        "description": "Accumulate 100 total minutes of walking, jogging, cycling, or swimming this week.",
        "category": "CONSISTENCY",
        "target_value": 100.0,
        "unit": "minutes",
        "participants_count": 284,
        "focus_note": "Focused on cardiovascular habit, not calorie burning."
    },
    {
        "id": "challenge_2",
        "title": "30-Day Mobility & Posture Continuity",
        "description": "Complete at least 5 minutes of targeted mobility work every day for 30 days.",
        "category": "MOBILITY",
        "target_value": 30.0,
        "unit": "days",
        "participants_count": 196,
        "focus_note": "Joint health and freedom of movement."
    },
    {
        "id": "challenge_3",
        "title": "Improve Push-Up Technique & Reps by 20%",
        "description": "Progressively develop upper-body pressing stamina and core stability over 6 weeks.",
        "category": "STRENGTH",
        "target_value": 20.0,
        "unit": "percent",
        "participants_count": 145,
        "focus_note": "Functional mastery, strictly avoiding body shape comparisons."
    }
]

def get_community_challenges() -> List[Dict[str, Any]]:
    return HEALTHY_CHALLENGES
