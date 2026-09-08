// backend/ai/fitnessAgent.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const scoringEngine = require('./scoringEngine');
const alertSystem = require('./alertSystem');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runFitnessAgent(userId) {
  // 1. COLLECT ALL DATA
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const [user, workouts, nutrition, labReports, vitals, goalTracking] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.workoutLog.findMany({
      where: { user_id: userId, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'desc' }
    }),
    prisma.nutritionLog.findMany({
      where: { user_id: userId, date: { gte: fourteenDaysAgo } }
    }),
    prisma.labReport.findMany({
      where: { user_id: userId },
      orderBy: { test_date: 'desc' },
      take: 3
    }),
    prisma.healthVital.findMany({
      where: { user_id: userId, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'desc' }
    }),
    prisma.goalTracking.findMany({
      where: { user_id: userId, date: { gte: fourteenDaysAgo } },
      orderBy: { date: 'desc' }
    })
  ]);

  if (!user) throw new Error("User not found");

  // 2. DETERMINISTIC PRE-SCORING
  const workoutScore = scoringEngine.calculateWorkoutScore(workouts);
  const nutritionScore = scoringEngine.calculateNutritionScore(nutrition, user);
  const healthScore = scoringEngine.calculateHealthScore(labReports, vitals);
  const overallScore = scoringEngine.computeOverallScore(workoutScore, nutritionScore, healthScore);

  // 3. DETECT CRITICAL ALERTS
  const alerts = alertSystem.detectAlerts(labReports, vitals, user);

  // 4. CALL GEMINI API
  let aiResult = {
    overall_score: overallScore,
    workout_score: workoutScore,
    nutrition_score: nutritionScore,
    health_score: healthScore,
    grade: "B",
    strengths: ["Workout consistency", "Healthy BMI"],
    weaknesses: ["Increase protein intake", "Optimize sleep"],
    seven_day_plan: {
      day1: { title: "Day 1", workout: "Strength training", nutrition: "Hit protein target", health: "Sleep 8 hours" }
    },
    critical_alerts: alerts.map(a => a.message),
    full_analysis: "## AI Assessment\nYour health is good but can be optimized."
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
      const prompt = `You are a certified fitness and health AI agent acting like a professional, caring father. Speak directly to the user offering firm but encouraging meal and workout suggestions for the next day, setting clear goals. Make sure the seven_day_plan is written with a structured, professional fatherly tone.
Analyze this user's data and generate a JSON response.
User: ${JSON.stringify(user)}
Workouts (30 days): ${workouts.length} total, avg intensity: ${workoutScore}/100
Nutrition (14 days): ${nutrition.length} entries, score: ${nutritionScore}/100
Goal Tracking (14 days): ${goalTracking.filter(g => g.workout_completed).length} workouts completed, ${goalTracking.filter(g => g.nutrition_completed).length} nutrition goals met. Use this completion rate to adjust tomorrow's assigned goals.
Lab Reports: ${JSON.stringify(labReports.map(l => l.biomarkers))}
Alerts: ${JSON.stringify(alerts)}

Return ONLY valid JSON:
{
  "overall_score": ${overallScore},
  "workout_score": ${workoutScore},
  "nutrition_score": ${nutritionScore},
  "health_score": ${healthScore},
  "grade": "B+",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "seven_day_plan": { "day1": {"title": "...", "workout": "...", "nutrition": "...", "health": "..."} },
  "critical_alerts": ["..."],
  "full_analysis": "## Full Markdown Report..."
}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const match = responseText.match(/```json\n?([\s\S]*?)\n?```/);
      aiResult = JSON.parse(match ? match[1] : responseText);
    } catch (e) {
      console.error("Gemini API error:", e);
    }
  }

  // 5. SAVE TO DB
  const existing = await prisma.fitnessScore.findUnique({ where: { user_id: userId } });
  const history = JSON.parse(existing?.score_history || '[]');
  history.push({ date: new Date().toISOString(), overall: overallScore, workout: workoutScore, nutrition: nutritionScore, health: healthScore });
  if (history.length > 365) history.shift();

  const saved = await prisma.fitnessScore.upsert({
    where: { user_id: userId },
    create: {
      user_id: userId,
      overall_score: aiResult.overall_score || overallScore,
      workout_score: aiResult.workout_score || workoutScore,
      nutrition_score: aiResult.nutrition_score || nutritionScore,
      health_score: aiResult.health_score || healthScore,
      grade: aiResult.grade,
      strengths: JSON.stringify(aiResult.strengths),
      weaknesses: JSON.stringify(aiResult.weaknesses),
      seven_day_plan: JSON.stringify(aiResult.seven_day_plan),
      critical_alerts: JSON.stringify(aiResult.critical_alerts || alerts),
      full_analysis: aiResult.full_analysis,
      score_history: JSON.stringify(history),
    },
    update: {
      overall_score: aiResult.overall_score || overallScore,
      workout_score: aiResult.workout_score || workoutScore,
      nutrition_score: aiResult.nutrition_score || nutritionScore,
      health_score: aiResult.health_score || healthScore,
      grade: aiResult.grade,
      strengths: JSON.stringify(aiResult.strengths),
      weaknesses: JSON.stringify(aiResult.weaknesses),
      seven_day_plan: JSON.stringify(aiResult.seven_day_plan),
      critical_alerts: JSON.stringify(aiResult.critical_alerts || alerts),
      full_analysis: aiResult.full_analysis,
      score_history: JSON.stringify(history),
    }
  });

  return saved;
}

module.exports = { runFitnessAgent };
