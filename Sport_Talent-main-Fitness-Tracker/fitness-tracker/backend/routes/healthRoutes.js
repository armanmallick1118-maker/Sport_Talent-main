const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

// USER
router.post('/users', healthController.createUser);
router.get('/users/:id', healthController.getUser);

// WORKOUT (Pillar 1)
router.post('/workout', healthController.logWorkout);
router.get('/workout/:userId', healthController.getWorkouts);
router.delete('/workout/:id', healthController.deleteWorkout);

// NUTRITION (Pillar 2)
router.post('/nutrition', healthController.logNutrition);
router.get('/nutrition/:userId', healthController.getNutrition);
router.delete('/nutrition/:id', healthController.deleteNutrition);

// LAB REPORTS (Pillar 3)
router.post('/lab-report', healthController.submitLabReport);
router.get('/lab-report/:userId', healthController.getLabReports);
router.delete('/lab-report/:id', healthController.deleteLabReport);

// VITALS
router.post('/vitals', healthController.logVitals);
router.get('/vitals/:userId', healthController.getVitals);

// FITNESS SCORE (AI)
router.get('/score/:userId', healthController.getCurrentScore);
router.post('/score/generate/:userId', healthController.generateScore);

// GOALS
router.post('/goals/track', healthController.trackGoal);
router.get('/goals/:userId', healthController.getGoals);

module.exports = router;
