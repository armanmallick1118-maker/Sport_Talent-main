const express = require('express');
const router = express.Router();
const scoutController = require('./scoutController');

// GET /api/v1/scouts
router.get('/', scoutController.getScouts);

// GET /api/v1/scouts/:id
router.get('/:id', scoutController.getScoutById);

module.exports = router;
