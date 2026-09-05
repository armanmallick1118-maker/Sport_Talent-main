"""
ATHENA PCOS / PCOD Wellness Support Module.
IMPORTANT:
- This is a WELLNESS SUPPORT system, NOT a diagnostic engine.
- Never diagnoses PCOS or any hormonal pathology.
- Provides conservative lifestyle, dietary, and physical activity support.
- Recommends clinical consultation for evaluation.
"""
from typing import Dict, Any, List

def analyze_pcos_support_patterns(
    cycle_regularity: str,
    symptoms: List[str],
    activity_minutes_avg: int,
    stress_level: int,
    sleep_quality: str
) -> Dict[str, Any]:
    """
    Evaluates lifestyle factors and provides conservative supportive wellness guidance.
    """
    lifestyle_tips = []

    # Metabolic & physical activity supportive cues
    if activity_minutes_avg < 30:
        lifestyle_tips.append("Aim for 20–30 minutes of low-impact walking daily, particularly 10–15 minutes after main meals to assist glycemic regulation.")
    else:
        lifestyle_tips.append("Your consistent daily movement is a strong asset for metabolic stability and cellular insulin signaling.")

    # Stress and cortisol cues
    if stress_level >= 6:
        lifestyle_tips.append("Sustained high stress can influence endocrine equilibrium. Incorporate gentle parasympathetic breathwork or restorative yoga.")

    # Dietary supportive notes
    lifestyle_tips.append("Emphasize meals combining dietary protein, fiber-rich whole grains (like oats or millets), and healthy fats to maintain steady energy.")

    return {
        "title": "ATHENA PCOS / PCOD Wellness Lifestyle Support",
        "cycle_pattern_logged": cycle_regularity,
        "symptoms_noted": symptoms,
        "supportive_insights": lifestyle_tips,
        "recommended_focus": "Insulin sensitivity support, progressive low-stress movement, and restorative sleep hygiene.",
        "professional_advisory": (
            "ATHENA does not diagnose PCOS, PCOD, or endocrine disorders. "
            "If you experience irregular cycles, unusual hair changes, or persistent metabolic symptoms, "
            "please consult a qualified gynecologist or endocrinologist for clinical diagnosis and care."
        )
    }
