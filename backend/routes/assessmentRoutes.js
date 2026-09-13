const upload = require('../middleware/upload');
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const {
  startAssessment,
  uploadAssessment,
  analyzeAssessment,
  getAssessment,
} = require('../controllers/assessmentController');

router.post('/start', verifyToken, startAssessment);
router.post('/upload', verifyToken, upload.single('video'), uploadAssessment);
router.post('/analyze', verifyToken, analyzeAssessment);
router.get('/:id', verifyToken, getAssessment);

module.exports = router;
