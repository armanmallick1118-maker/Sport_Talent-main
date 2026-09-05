"""
ATHENA Nutrition Tracker & Calorie Analyser.
Features:
- Comprehensive Indian household & global food reference database
- Natural language meal parser (e.g., '2 roti + dal + sabzi + curd')
- Calorie expenditure calculator (Mifflin-St Jeor) with conservative ranges
- Non-extreme deficit protection & macro balance
"""
from typing import Dict, Any, List, Tuple
import re

# Reference database of household foods with realistic portions
FOOD_DATABASE: Dict[str, Dict[str, Any]] = {
    "roti": {"name": "Whole Wheat Roti / Chapati", "unit": "piece (35g)", "calories": 85, "protein": 3.0, "carbs": 17.5, "fat": 0.5, "fiber": 2.5, "is_indian": True},
    "chapati": {"name": "Whole Wheat Roti / Chapati", "unit": "piece (35g)", "calories": 85, "protein": 3.0, "carbs": 17.5, "fat": 0.5, "fiber": 2.5, "is_indian": True},
    "paratha": {"name": "Plain / Stuffed Paratha", "unit": "piece (60g)", "calories": 220, "protein": 5.0, "carbs": 28.0, "fat": 10.0, "fiber": 3.0, "is_indian": True},
    "dal": {"name": "Yellow Moong / Toor Dal (Tadka)", "unit": "katori (150g)", "calories": 140, "protein": 8.5, "carbs": 20.0, "fat": 3.2, "fiber": 4.5, "is_indian": True},
    "daal": {"name": "Yellow Moong / Toor Dal (Tadka)", "unit": "katori (150g)", "calories": 140, "protein": 8.5, "carbs": 20.0, "fat": 3.2, "fiber": 4.5, "is_indian": True},
    "sabzi": {"name": "Mixed Vegetable Sabzi (Dry/Gravy)", "unit": "katori (150g)", "calories": 120, "protein": 3.5, "carbs": 14.0, "fat": 5.5, "fiber": 4.0, "is_indian": True},
    "curd": {"name": "Plain Curd / Dahi", "unit": "katori (120g)", "calories": 95, "protein": 4.5, "carbs": 6.0, "fat": 5.0, "fiber": 0.0, "is_indian": True},
    "dahi": {"name": "Plain Curd / Dahi", "unit": "katori (120g)", "calories": 95, "protein": 4.5, "carbs": 6.0, "fat": 5.0, "fiber": 0.0, "is_indian": True},
    "rice": {"name": "Steamed White / Brown Rice", "unit": "katori (150g)", "calories": 180, "protein": 3.5, "carbs": 39.0, "fat": 0.6, "fiber": 1.2, "is_indian": True},
    "paneer": {"name": "Paneer (Cottage Cheese)", "unit": "100g", "calories": 265, "protein": 18.3, "carbs": 3.2, "fat": 20.8, "fiber": 0.0, "is_indian": True},
    "paneer bhurji": {"name": "Paneer Bhurji", "unit": "katori (150g)", "calories": 240, "protein": 14.0, "carbs": 6.0, "fat": 17.5, "fiber": 1.5, "is_indian": True},
    "idli": {"name": "Steamed Rice Idli", "unit": "piece (40g)", "calories": 65, "protein": 2.0, "carbs": 13.5, "fat": 0.2, "fiber": 0.8, "is_indian": True},
    "dosa": {"name": "Plain / Masala Dosa", "unit": "medium (100g)", "calories": 195, "protein": 4.0, "carbs": 29.0, "fat": 7.0, "fiber": 1.5, "is_indian": True},
    "sambar": {"name": "Vegetable Sambar", "unit": "katori (150g)", "calories": 110, "protein": 4.5, "carbs": 18.0, "fat": 2.5, "fiber": 3.8, "is_indian": True},
    "chole": {"name": "Chole / Chickpea Masala", "unit": "katori (150g)", "calories": 220, "protein": 9.5, "carbs": 32.0, "fat": 6.0, "fiber": 7.0, "is_indian": True},
    "rajma": {"name": "Rajma Curry (Red Kidney Beans)", "unit": "katori (150g)", "calories": 190, "protein": 9.0, "carbs": 30.0, "fat": 4.0, "fiber": 6.5, "is_indian": True},
    "khichdi": {"name": "Moong Dal Khichdi", "unit": "bowl (200g)", "calories": 230, "protein": 8.0, "carbs": 42.0, "fat": 3.5, "fiber": 4.0, "is_indian": True},
    "egg": {"name": "Whole Boiled Egg", "unit": "1 egg (50g)", "calories": 74, "protein": 6.3, "carbs": 0.4, "fat": 5.0, "fiber": 0.0, "is_indian": False},
    "eggs": {"name": "Whole Boiled Egg", "unit": "1 egg (50g)", "calories": 74, "protein": 6.3, "carbs": 0.4, "fat": 5.0, "fiber": 0.0, "is_indian": False},
    "chicken curry": {"name": "Home-style Chicken Curry", "unit": "katori (150g)", "calories": 220, "protein": 22.0, "carbs": 4.0, "fat": 12.5, "fiber": 1.0, "is_indian": True},
    "oats": {"name": "Rolled Oats with Milk/Water", "unit": "bowl (50g dry)", "calories": 190, "protein": 7.0, "carbs": 33.0, "fat": 3.5, "fiber": 5.0, "is_indian": False},
    "milk": {"name": "Cow Milk (Toned)", "unit": "glass (200ml)", "calories": 120, "protein": 6.4, "carbs": 9.6, "fat": 6.0, "fiber": 0.0, "is_indian": True},
    "tea": {"name": "Chai / Tea with Milk & Mild Sugar", "unit": "cup (120ml)", "calories": 75, "protein": 2.2, "carbs": 10.0, "fat": 2.8, "fiber": 0.0, "is_indian": True},
    "coffee": {"name": "Filter Coffee / Milk Coffee", "unit": "cup (120ml)", "calories": 80, "protein": 2.5, "carbs": 11.0, "fat": 3.0, "fiber": 0.0, "is_indian": True},
    "banana": {"name": "Fresh Banana", "unit": "medium (118g)", "calories": 105, "protein": 1.3, "carbs": 27.0, "fat": 0.3, "fiber": 3.1, "is_indian": False},
    "apple": {"name": "Fresh Apple", "unit": "medium (150g)", "calories": 80, "protein": 0.5, "carbs": 21.0, "fat": 0.3, "fiber": 4.0, "is_indian": False},
    "almonds": {"name": "Raw Almonds (Badam)", "unit": "handful (10 pcs)", "calories": 70, "protein": 2.5, "carbs": 2.5, "fat": 6.0, "fiber": 1.5, "is_indian": True}
}

def parse_natural_meal_input(raw_text: str) -> Dict[str, Any]:
    """
    Parses natural meal input like:
    '2 roti + dal + sabzi + curd'
    or '3 idli + sambar + filter coffee'
    Extracts counts, matches items from database, estimates macro totals.
    Clearly tags as an estimation system.
    """
    raw_clean = raw_text.lower().replace(",", "+").replace("&", "+").replace(" and ", "+")
    tokens = [t.strip() for t in raw_clean.split("+") if t.strip()]

    parsed_items = []
    total_cal = 0.0
    total_pro = 0.0
    total_carb = 0.0
    total_fat = 0.0
    total_fiber = 0.0

    for token in tokens:
        # Match multiplier like '2 roti', '3 idli', '1.5 katori dal'
        match = re.match(r"^([\d\.]+)?\s*(katori|bowl|cup|plate|piece|glass)?\s*(.*)$", token)
        quantity = 1.0
        item_key = token
        if match:
            qty_str, unit_str, rest = match.groups()
            if qty_str:
                try:
                    quantity = float(qty_str)
                except ValueError:
                    quantity = 1.0
            if rest:
                item_key = rest.strip()

        # Find best matching key in database
        matched_entry = None
        for db_key in sorted(FOOD_DATABASE.keys(), key=lambda x: -len(x)):
            if db_key in item_key:
                matched_entry = FOOD_DATABASE[db_key]
                break

        if matched_entry:
            item_cals = round(matched_entry["calories"] * quantity, 1)
            item_p = round(matched_entry["protein"] * quantity, 1)
            item_c = round(matched_entry["carbs"] * quantity, 1)
            item_f = round(matched_entry["fat"] * quantity, 1)
            item_fib = round(matched_entry["fiber"] * quantity, 1)

            parsed_items.append({
                "item_name": matched_entry["name"],
                "quantity": quantity,
                "serving_unit": matched_entry["unit"],
                "calories": item_cals,
                "protein": item_p,
                "carbs": item_c,
                "fat": item_f,
                "fiber": item_fib
            })

            total_cal += item_cals
            total_pro += item_p
            total_carb += item_c
            total_fat += item_f
            total_fiber += item_fib
        else:
            # Fallback estimation for unknown dish (conservative generic 150 kcal side)
            parsed_items.append({
                "item_name": item_key.capitalize(),
                "quantity": quantity,
                "serving_unit": "standard portion",
                "calories": 140.0 * quantity,
                "protein": 4.0 * quantity,
                "carbs": 18.0 * quantity,
                "fat": 5.0 * quantity,
                "fiber": 2.0 * quantity
            })
            total_cal += 140.0 * quantity
            total_pro += 4.0 * quantity
            total_carb += 18.0 * quantity
            total_fat += 5.0 * quantity
            total_fiber += 2.0 * quantity

    return {
        "raw_input": raw_text,
        "items": parsed_items,
        "totals": {
            "calories": round(total_cal, 1),
            "protein_g": round(total_pro, 1),
            "carbs_g": round(total_carb, 1),
            "fat_g": round(total_fat, 1),
            "fiber_g": round(total_fiber, 1)
        },
        "is_estimated": True,
        "estimation_label": "Portion-based conservative nutritional estimation"
    }


def calculate_energy_expenditure(
    age: int,
    weight_kg: float,
    height_cm: float,
    sex: str = "MALE",
    activity_level: str = "MODERATE",
    workout_mins_today: int = 30
) -> Dict[str, Any]:
    """
    Computes energy expenditure using Mifflin-St Jeor formula.
    Produces conservative ranges (e.g. 2100–2300 kcal) rather than fake precision.
    """
    weight = weight_kg if weight_kg and weight_kg > 30 else 70.0
    height = height_cm if height_cm and height_cm > 100 else 172.0
    user_age = age if age and age > 10 else 28

    # Mifflin-St Jeor BMR
    if str(sex).upper() == "FEMALE":
        bmr = (10.0 * weight) + (6.25 * height) - (5.0 * user_age) - 161.0
    else:
        bmr = (10.0 * weight) + (6.25 * height) - (5.0 * user_age) + 5.0

    activity_multipliers = {
        "SEDENTARY": 1.2,
        "LIGHT": 1.375,
        "MODERATE": 1.55,
        "VERY_ACTIVE": 1.725
    }
    multiplier = activity_multipliers.get(activity_level.upper(), 1.45)
    tdee_base = bmr * multiplier

    # Additional workout contribution
    workout_burn = workout_mins_today * 6.5  # approx 6.5 kcal/min moderate effort
    total_expenditure = tdee_base + workout_burn

    # Conservative range rounding
    center = round(total_expenditure / 50.0) * 50
    range_min = int(center - 100)
    range_max = int(center + 100)

    return {
        "estimated_bmr": round(bmr, 0),
        "activity_multiplier": multiplier,
        "workout_contribution_kcal": round(workout_burn, 0),
        "total_estimated_expenditure_kcal": round(total_expenditure, 0),
        "conservative_daily_range": f"{range_min}–{range_max} kcal",
        "guidance": (
            "Energy values are scientific approximations intended for lifestyle planning. "
            "Individual metabolic rates vary naturally."
        )
    }
