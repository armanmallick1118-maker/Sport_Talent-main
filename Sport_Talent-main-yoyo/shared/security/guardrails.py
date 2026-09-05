"""
ATHENA Safety & Recommendation Guardrails Pipeline.
Ensures:
- Conservative wellness guidance
- No unsupported medical diagnosis (mental, metabolic, musculoskeletal)
- Non-extreme caloric recommendations (healthy ranges, never extreme deficit)
- Safe training intensity adjustment based on fatigue/sleep signals
- Automatic professional consultation recommendations
"""
from typing import Dict, Any, List, Tuple
import re

MEDICAL_PROHIBITED_TERMS = [
    r"\byou have pcos\b",
    r"\byou have depression\b",
    r"\byou have anxiety disorder\b",
    r"\byou have diabetes\b",
    r"\bdiagnosed with\b",
    r"\btorn acl\b",
    r"\bherniated disc\b",
    r"\bmedical cure\b",
    r"\bprescription\b"
]

CRISIS_SIGNALS = [
    r"\bkill myself\b",
    r"\bsuicide\b",
    r"\bwant to die\b",
    r"\bself harm\b",
    r"\bend my life\b"
]

def check_safety_guardrails(recommendation_data: Dict[str, Any]) -> Tuple[bool, List[str], Dict[str, Any]]:
    """
    Validates any recommendation before user delivery.
    Returns:
    (is_safe, list_of_flags, sanitized_data)
    """
    flags = []
    sanitized = dict(recommendation_data)
    summary = sanitized.get("summary", "")
    reasoning = sanitized.get("reasoning_why", "")
    text_corpus = f"{summary} {reasoning}".lower()

    # 1. Check for crisis signals
    for pattern in CRISIS_SIGNALS:
        if re.search(pattern, text_corpus):
            flags.append("CRISIS_SIGNAL_DETECTED")
            sanitized["is_crisis"] = True
            sanitized["summary"] = (
                "Support is available. If you are experiencing overwhelming distress, "
                "please connect with a mental health professional or contact your local crisis line (e.g., 988 or 112)."
            )
            sanitized["reasoning_why"] = "Urgent safety guardrail triggered."
            sanitized["safety_approved"] = False
            return False, flags, sanitized

    # 2. Check for prohibited medical diagnosis statements
    for pattern in MEDICAL_PROHIBITED_TERMS:
        if re.search(pattern, text_corpus):
            flags.append("MEDICAL_DIAGNOSIS_CLAIM_SUPPRESSED")
            # Sanitize language to supportive non-diagnostic guidance
            sanitized["summary"] = re.sub(pattern, "observed patterns may warrant clinical evaluation", sanitized["summary"], flags=re.IGNORECASE)
            sanitized["reasoning_why"] += " [ATHENA is an educational wellness tool and does not provide medical diagnoses. Consult a licensed healthcare provider for medical evaluations.]"

    # 3. Check for extreme calorie restrictions
    calories = sanitized.get("calories")
    if calories is not None:
        if isinstance(calories, (int, float)) and calories < 1200:
            flags.append("EXTREME_CALORIC_RESTRICTION_BLOCKED")
            sanitized["calories_range"] = "1350–1550 kcal (Safe minimum threshold)"
            sanitized["reasoning_why"] += " Calorie recommendation adjusted upward to preserve metabolic and physiological safety."

    # 4. Check for high fatigue overtraining risk
    perceived_fatigue = sanitized.get("perceived_fatigue", 0)
    sleep_hours = sanitized.get("sleep_hours", 8)
    if perceived_fatigue >= 8 or sleep_hours < 5.0:
        if sanitized.get("intensity") in ["HIGH", "MAXIMAL"]:
            flags.append("INTENSITY_DOWNSCALED_FOR_RECOVERY")
            sanitized["intensity"] = "LOW_TO_MODERATE"
            sanitized["title"] = "Active Recovery & Mobility Session"
            sanitized["reasoning_why"] += " High fatigue and suboptimal sleep detected; intensity downscaled to protect joints and immune readiness."

    is_safe = len([f for f in flags if f == "CRISIS_SIGNAL_DETECTED"]) == 0
    return is_safe, flags, sanitized


def format_conservative_energy_range(expenditure_kcal: float) -> str:
    """
    Avoids fake precision. Emits ranges (e.g., 2100–2300 kcal).
    """
    rounded_base = round(expenditure_kcal / 50.0) * 50
    lower = int(rounded_base - 100)
    upper = int(rounded_base + 100)
    return f"{lower}–{upper} kcal"
