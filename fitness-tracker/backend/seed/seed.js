const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  // Check if seeded
  const existingUser = await prisma.user.findUnique({ where: { email: 'john@example.com' } });
  if (existingUser) {
    console.log('Database already seeded!');
    return;
  }

  const user = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      age: 28,
      gender: 'male',
      height_cm: 178,
      weight_kg: 75,
      goal: 'build_muscle',
      activity_level: 'active',
      daily_cal_target: 2800,
      daily_protein_target: 160,
      daily_water_target: 2500,
      avatar_color: '#3B82F6',
    }
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Seed workouts
  for (let i = 0; i < 22; i++) {
    const wDate = new Date(thirtyDaysAgo);
    wDate.setDate(wDate.getDate() + i + Math.floor(i / 5)); // some skips
    await prisma.workoutLog.create({
      data: {
        user_id: user.id,
        date: wDate,
        exercise: i % 3 === 0 ? 'Push-ups' : (i % 3 === 1 ? 'Running' : 'Squats'),
        category: i % 3 === 0 ? 'strength' : (i % 3 === 1 ? 'cardio' : 'strength'),
        sets: 3,
        reps: 12,
        duration_min: 45,
        calories: 350,
        intensity: 'medium',
      }
    });
  }

  // Seed Nutrition
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  
  for (let i = 0; i < 14; i++) {
    const nDate = new Date(fourteenDaysAgo);
    nDate.setDate(nDate.getDate() + i);
    await prisma.nutritionLog.create({
      data: {
        user_id: user.id,
        date: nDate,
        meal_type: 'breakfast',
        food_name: 'Oats & Eggs',
        calories: 500,
        protein_g: 30,
        carbs_g: 50,
        fat_g: 15,
        water_ml: 500,
      }
    });
    await prisma.nutritionLog.create({
      data: {
        user_id: user.id,
        date: nDate,
        meal_type: 'lunch',
        food_name: 'Chicken Rice',
        calories: 700,
        protein_g: 40,
        carbs_g: 80,
        fat_g: 20,
        water_ml: 500,
      }
    });
    await prisma.nutritionLog.create({
      data: {
        user_id: user.id,
        date: nDate,
        meal_type: 'dinner',
        food_name: 'Salmon Salad',
        calories: 600,
        protein_g: 35,
        carbs_g: 20,
        fat_g: 30,
        water_ml: 500,
      }
    });
  }

  // Seed Lab Report
  await prisma.labReport.create({
    data: {
      user_id: user.id,
      test_date: new Date(),
      panel_name: 'CBC & Vitamins',
      biomarkers: JSON.stringify([
        { name: 'Hemoglobin', value: 14.2, unit: 'g/dL', ref_min: 13.5, ref_max: 17.5, status: 'normal' },
        { name: 'Vitamin D', value: 18, unit: 'ng/mL', ref_min: 30, ref_max: 100, status: 'low' },
        { name: 'LDL', value: 138, unit: 'mg/dL', ref_min: 0, ref_max: 100, status: 'high' }
      ]),
      lab_name: 'Health Labs Inc'
    }
  });

  // Seed Vitals
  for (let i = 0; i < 30; i++) {
    const vDate = new Date(thirtyDaysAgo);
    vDate.setDate(vDate.getDate() + i);
    await prisma.healthVital.create({
      data: {
        user_id: user.id,
        date: vDate,
        weight_kg: 75 + (Math.random() * 2 - 1),
        bmi: 23.7,
        resting_hr: 65 + Math.floor(Math.random() * 10),
        sleep_hrs: 6 + Math.random() * 2,
        stress_level: 4 + Math.floor(Math.random() * 3),
        steps: 5000 + Math.floor(Math.random() * 5000),
      }
    });
  }

  // Pre-calculate an AI score record
  await prisma.fitnessScore.create({
    data: {
      user_id: user.id,
      overall_score: 75,
      workout_score: 82,
      nutrition_score: 68,
      health_score: 74,
      grade: 'B',
      strengths: JSON.stringify([
        "Excellent workout frequency — 5+ sessions per week",
        "Good workout variety across 3 categories",
        "Healthy BMI (23.7) — ideal body composition"
      ]),
      weaknesses: JSON.stringify([
        "Protein intake at only 74% of target",
        "Vitamin D severely deficient",
        "Sleep averaging 6.8 hrs — recovery is compromised"
      ]),
      seven_day_plan: JSON.stringify({
        day1: { title: "Monday — Strength + Protein Push", workout: "Bench 4×8, Pull-ups 3×10", nutrition: "Hit 160g protein", health: "Take D3 2000IU" }
      }),
      critical_alerts: JSON.stringify([
        { type: "Vitamin D", message: "Vitamin D DEFICIENT (18 ng/mL)", severity: "critical" }
      ]),
      full_analysis: "## Your Health Assessment\n\nYou are doing well but your Vitamin D needs immediate attention.",
      score_history: JSON.stringify([{ date: new Date().toISOString(), overall: 75, workout: 82, nutrition: 68, health: 74 }])
    }
  });

  console.log('Seeding complete!');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
