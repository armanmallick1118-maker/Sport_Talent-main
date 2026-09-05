"""
ATHENA Women's Wellness Module.
Provides:
- Cycle tracking (Menstrual, Follicular, Ovulatory, Luteal, Irregular)
- Symptom logs & energy correlation
- Phase-aware training & nutrition adaptations
- Non-prescriptive, supportive, non-diagnostic guidance
"""
from typing import Dict, Any, List

PHASE_GUIDES = {
    "MENSTRUAL": {
        "title": "Menstrual Phase (Days 1–5)",
        "physiological_context": "Hormone levels (estrogen and progesterone) are at their lowest baseline.",
        "exercise_focus": "Gentle restorative movement, light walking, yoga, dynamic stretching. Listen to somatic cues.",
        "nutrition_focus": "Iron-rich foods, warm stews/soups, hydration, magnesium-rich leafy greens and seeds.",
        "recovery_cue": "Prioritize extra sleep and lower central nervous system training loads."
    },
    "FOLLICULAR": {
        "title": "Follicular Phase (Days 6–13)",
        "physiological_context": "Rising estrogen levels often correlate with increased energy and higher neuromuscular resilience.",
        "exercise_focus": "Optimal window for progressive strength training, learning new movement skills, or tempo runs.",
        "nutrition_focus": "Lean proteins, complex carbohydrates to fuel rising workout capacity.",
        "recovery_cue": "Muscular recovery is generally faster; good time for strength adaptations."
    },
    "OVULATORY": {
        "title": "Ovulatory Phase (Days 14–16)",
        "physiological_context": "Peak estrogen and brief testosterone surge. High systemic energy.",
        "exercise_focus": "Peak strength efforts, high-intensity intervals or sporting events.",
        "nutrition_focus": "Hydration, fiber-rich vegetables, antioxidant-rich fruits.",
        "recovery_cue": "Maintain thorough warm-ups as joint laxity can slightly increase with peak estrogen."
    },
    "LUTEAL": {
        "title": "Luteal Phase (Days 17–28)",
        "physiological_context": "Progesterone dominates; resting metabolic rate and body temperature are slightly elevated.",
        "exercise_focus": "Moderate aerobic work, steady resistance training, reducing all-out anaerobic intervals.",
        "nutrition_focus": "Complex low-glycemic carbohydrates (oats, sweet potato, lentils) to stabilize energy.",
        "recovery_cue": "Sleep requirement may increase; cooling bedroom environment supports deeper sleep."
    },
    "IRREGULAR": {
        "title": "Adaptive Cycle Support (Variable Cadence)",
        "physiological_context": "Cycle length or timing is variable. Focus on daily somatic cues rather than calendar days.",
        "exercise_focus": "Auto-regulated training: push when perceived energy is high, recover when fatigued.",
        "nutrition_focus": "Nutrient-dense whole foods, steady protein intake, hydration.",
        "recovery_cue": "Track patterns over 60–90 days to identify personal baseline rhythms."
    }
}

def get_cycle_guidance(cycle_day: int, is_irregular: bool = False) -> Dict[str, Any]:
    """
    Computes phase approximation and supportive non-diagnostic lifestyle recommendations.
    """
    if is_irregular:
        phase_key = "IRREGULAR"
    elif cycle_day <= 5:
        phase_key = "MENSTRUAL"
    elif cycle_day <= 13:
        phase_key = "FOLLICULAR"
    elif cycle_day <= 16:
        phase_key = "OVULATORY"
    else:
        phase_key = "LUTEAL"

    guide = PHASE_GUIDES[phase_key]
    return {
        "cycle_day": cycle_day,
        "phase": phase_key,
        "is_irregular": is_irregular,
        "guidance": guide,
        "disclaimer": "ATHENA Women's Wellness provides educational lifestyle suggestions. It does not replace medical consultation."
    }
