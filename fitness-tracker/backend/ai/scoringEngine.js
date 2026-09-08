// backend/ai/scoringEngine.js
function calculateWorkoutScore(workouts30days) {
  if (!workouts30days || workouts30days.length === 0) return 0;
  
  // Frequency Score (40 pts max)
  const sessionsPerWeek = workouts30days.length / (30 / 7);
  let freqScore = 0;
  if (sessionsPerWeek >= 5) freqScore = 40;
  else if (sessionsPerWeek >= 3) freqScore = 25;
  else if (sessionsPerWeek >= 1) freqScore = 10;

  // Variety Score (30 pts max)
  const categories = new Set(workouts30days.map(w => w.category));
  let varScore = 0;
  if (categories.size >= 4) varScore = 30;
  else if (categories.size === 3) varScore = 22;
  else if (categories.size === 2) varScore = 14;
  else varScore = 6;

  // Intensity Score (30 pts max)
  const highInt = workouts30days.filter(w => w.intensity === 'high').length;
  const medInt = workouts30days.filter(w => w.intensity === 'medium').length;
  const lowInt = workouts30days.filter(w => w.intensity === 'low').length;
  let intScore = 0;
  if (highInt > medInt + lowInt) intScore = 30;
  else if (medInt > lowInt) intScore = 20;
  else intScore = 10;

  return Math.min(100, freqScore + varScore + intScore);
}

function calculateNutritionScore(nutrition14days, user) {
  if (!nutrition14days || nutrition14days.length === 0) return 0;
  
  // A simplified nutrition score based on protein hits and hydration if provided
  let proteinHits = 0;
  let totalCalories = 0;
  let daysLogged = new Set(nutrition14days.map(n => n.date.toISOString().split('T')[0])).size;
  
  nutrition14days.forEach(n => {
    if (n.protein_g && user.daily_protein_target && n.protein_g > (user.daily_protein_target / 4)) {
      proteinHits++;
    }
    totalCalories += n.calories;
  });

  const avgCals = totalCalories / daysLogged;
  
  let calScore = 0;
  if (user.daily_cal_target) {
    const calDiff = Math.abs(avgCals - user.daily_cal_target) / user.daily_cal_target;
    if (calDiff <= 0.1) calScore = 35;
    else if (calDiff <= 0.2) calScore = 25;
    else calScore = 10;
  } else {
    calScore = 20; // Default
  }

  let macroScore = 0;
  if (proteinHits >= daysLogged * 2) macroScore = 35; // At least 2 good protein meals a day
  else if (proteinHits >= daysLogged) macroScore = 20;
  else macroScore = 10;

  return Math.min(100, calScore + macroScore + 20); // 20 default for hydration/other
}

function calculateHealthScore(labReports, vitals30days) {
  let score = 70; // Baseline
  if (vitals30days && vitals30days.length > 0) {
    const avgSleep = vitals30days.reduce((acc, v) => acc + (v.sleep_hrs || 0), 0) / vitals30days.length;
    if (avgSleep >= 7) score += 10;
    else if (avgSleep < 6) score -= 10;
  }
  return Math.max(0, Math.min(100, score));
}

function computeOverallScore(w, n, h) {
  return Math.round((w * 0.40) + (n * 0.35) + (h * 0.25));
}

module.exports = { calculateWorkoutScore, calculateNutritionScore, calculateHealthScore, computeOverallScore };
