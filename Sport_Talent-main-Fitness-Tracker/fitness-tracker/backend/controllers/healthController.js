const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// We'll import fitnessAgent later for the score generation
// const fitnessAgent = require('../ai/fitnessAgent');

exports.createUser = async (req, res, next) => {
  try {
    const { email } = req.body;
    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      user = await prisma.user.update({ where: { email }, data: req.body });
    } else {
      user = await prisma.user.create({ data: req.body });
    }
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

exports.logWorkout = async (req, res, next) => {
  try {
    const log = await prisma.workoutLog.create({ data: req.body });
    res.json({ success: true, log });
  } catch (err) { next(err); }
};

exports.getWorkouts = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const where = { user_id: req.params.userId };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }
    const logs = await prisma.workoutLog.findMany({ where, orderBy: { date: 'desc' } });
    res.json({ success: true, logs });
  } catch (err) { next(err); }
};

exports.deleteWorkout = async (req, res, next) => {
  try {
    await prisma.workoutLog.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.logNutrition = async (req, res, next) => {
  try {
    const log = await prisma.nutritionLog.create({ data: req.body });
    res.json({ success: true, log });
  } catch (err) { next(err); }
};

exports.getNutrition = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const where = { user_id: req.params.userId };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }
    const logs = await prisma.nutritionLog.findMany({ where, orderBy: { date: 'desc' } });
    res.json({ success: true, logs });
  } catch (err) { next(err); }
};

exports.deleteNutrition = async (req, res, next) => {
  try {
    await prisma.nutritionLog.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.submitLabReport = async (req, res, next) => {
  try {
    const { biomarkers, test_date, ...rest } = req.body;
    const report = await prisma.labReport.create({
      data: {
        ...rest,
        test_date: test_date ? new Date(test_date) : new Date(),
        biomarkers: typeof biomarkers === 'string' ? biomarkers : JSON.stringify(biomarkers)
      }
    });
    res.json({ success: true, report });
  } catch (err) { next(err); }
};

exports.getLabReports = async (req, res, next) => {
  try {
    const reports = await prisma.labReport.findMany({ 
      where: { user_id: req.params.userId },
      orderBy: { test_date: 'desc' }
    });
    res.json({ success: true, reports });
  } catch (err) { next(err); }
};

exports.deleteLabReport = async (req, res, next) => {
  try {
    await prisma.labReport.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.logVitals = async (req, res, next) => {
  try {
    const vitals = await prisma.healthVital.create({ data: req.body });
    res.json({ success: true, vitals });
  } catch (err) { next(err); }
};

exports.getVitals = async (req, res, next) => {
  try {
    const vitals = await prisma.healthVital.findMany({ 
      where: { user_id: req.params.userId },
      orderBy: { date: 'desc' }
    });
    res.json({ success: true, vitals });
  } catch (err) { next(err); }
};

exports.getCurrentScore = async (req, res, next) => {
  try {
    const score = await prisma.fitnessScore.findUnique({ where: { user_id: req.params.userId } });
    res.json({ success: true, score });
  } catch (err) { next(err); }
};

exports.generateScore = async (req, res, next) => {
  try {
    const fitnessAgent = require('../ai/fitnessAgent');
    const result = await fitnessAgent.runFitnessAgent(req.params.userId);
    res.json({ success: true, score: result });
  } catch (err) { next(err); }
};

exports.trackGoal = async (req, res, next) => {
  try {
    const { user_id, date, workout_completed, nutrition_completed } = req.body;
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    // Upsert tracking for the day
    const tracking = await prisma.goalTracking.upsert({
      where: {
        user_id_date: {
          user_id,
          date: startOfDay
        }
      },
      update: {
        workout_completed,
        nutrition_completed
      },
      create: {
        user_id,
        date: startOfDay,
        workout_completed,
        nutrition_completed
      }
    });

    res.json({ success: true, tracking });
  } catch (err) { next(err); }
};

exports.getGoals = async (req, res, next) => {
  try {
    const { date } = req.query; // optional specific date
    let whereClause = { user_id: req.params.userId };
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      whereClause.date = startOfDay;
    }

    const goals = await prisma.goalTracking.findMany({
      where: whereClause,
      orderBy: { date: 'desc' }
    });
    res.json({ success: true, goals });
  } catch (err) { next(err); }
};
