const upload = require('../middleware/upload');
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const {
  startAssessment,
  uploadAssessment,
  analyzeAssessment,
} = require('../controllers/assessmentController');

router.post('/start', verifyToken, startAssessment);
router.post('/upload', verifyToken, upload.single('video'), uploadAssessment);
router.post('/analyze', verifyToken, analyzeAssessment);

module.exports = router;