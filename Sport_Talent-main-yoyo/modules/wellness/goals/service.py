"""
ATHENA Goal Engine.
Manages:
- CURRENT STATE -> TARGET -> MILESTONES -> WEEKLY ACTIONS -> TRACKING -> ADAPTATION
"""
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from shared.database.models import Goal
import json

def create_adaptive_goal(
    db: Session,
    user_id: int,
    title: str,
    category: str,
    target_metric: float,
    current_metric: float,
    unit: str,
    timeline_weeks: int = 8
) -> Goal:
    """
    Creates goal with calculated milestones and actionable weekly habits.
    """
    delta_total = target_metric - current_metric
    step = delta_total / 4.0

    milestones = [
        {"week": int(timeline_weeks * 0.25), "target": round(current_metric + step, 1), "label": "Baseline Habit Formation"},
        {"week": int(timeline_weeks * 0.50), "target": round(current_metric + step * 2, 1), "label": "Progressive Adaptation"},
        {"week": int(timeline_weeks * 0.75), "target": round(current_metric + step * 3, 1), "label": "Consolidation Phase"},
        {"week": timeline_weeks, "target": round(target_metric, 1), "label": "Target Achievement"}
    ]

    weekly_actions = [
        f"Complete 3 dedicated {category.lower()} training sessions per week",
        "Record recovery and sleep logs consistently 5+ days per week",
        "Perform a weekly self-check milestone review"
    ]

    goal = Goal(
        user_id=user_id,
        title=title,
        category=category,
        target_metric=target_metric,
        current_metric=current_metric,
        baseline_metric=current_metric,
        unit=unit,
        timeline_weeks=timeline_weeks,
        milestones_json=json.dumps(milestones),
        weekly_actions_json=json.dumps(weekly_actions),
        status="ACTIVE"
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal
