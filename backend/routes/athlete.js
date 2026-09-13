// routes/athlete.js, Sensei
const express = require('express');
const router = express.Router();
const { getAthleteProfile, updateAthleteProfile } = require('../controllers/athleteController');
const verifyToken = require('../middleware/auth');

// The real security lock is now back in place, Sensei!
router.use(verifyToken);

router.get('/profile', getAthleteProfile);
router.post('/profile', updateAthleteProfile);
router.put('/profile', updateAthleteProfile);

module.exports = router;