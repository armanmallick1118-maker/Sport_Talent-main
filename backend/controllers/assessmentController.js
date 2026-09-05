const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @desc    Start a new assessment
const startAssessment = async (req, res) => {
  try {
    const { sport, testType } = req.body;
    const athleteId = req.user ? req.user.uid : "test-athlete-123";

    // Create a dummy AssessmentType if it doesn't exist just for the demo
    let assessmentType = await prisma.assessmentType.findFirst({ where: { name: testType } });
    if (!assessmentType) {
      assessmentType = await prisma.assessmentType.create({
        data: { name: testType || 'Unknown Test', measurement_unit: 'units' }
      });
    }

    const assessment = await prisma.userAssessment.create({
      data: {
        user_id: athleteId,
        assessment_type_id: assessmentType.id,
        score: 0,
        status: 'STARTED',
      }
    });

    res.status(201).json({
      message: 'Assessment started successfully, Sensei!',
      assessmentId: assessment.id,
      ...assessment
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start assessment: ' + error.message });
  }
};

// @desc    Upload assessment media
const uploadAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.body;

    if (!assessmentId) {
      return res.status(400).json({ error: 'Missing assessmentId in the body, Sensei!' });
    }

    if (!req.file && !req.body.mediaUrl) {
       return res.status(400).json({ error: 'No video file or mediaUrl received, Sensei!' });
    }

    const mediaUrl = req.file
      ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      : req.body.mediaUrl;

    await prisma.userAssessment.update({
      where: { id: assessmentId },
      data: {
        status: 'UPLOADED',
        mediaUrl: mediaUrl,
      }
    });

    res.status(200).json({
      message: 'Media uploaded successfully, Sensei!',
      mediaUrl: mediaUrl
    });
  } catch (error) {
    console.error("Upload Error, Sensei:", error);
    res.status(500).json({ error: 'Failed to upload: ' + error.message });
  }
};

// @desc    Analyze the assessment using Python AI
// @route   POST /api/assessment/analyze
const analyzeAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.body;

    // 1. Fetch the document to find the video URL, Sensei
    const assessmentData = await prisma.userAssessment.findUnique({
      where: { id: assessmentId }
    });

    if (!assessmentData) {
      return res.status(404).json({ error: 'Assessment not found, Sensei!' });
    }

    if (!assessmentData.mediaUrl) {
      return res.status(400).json({ error: 'No video uploaded to analyze, Sensei!' });
    }

    // 2. Safely find the physical file on your hard drive, Sensei
    const filename = assessmentData.mediaUrl.split('/').pop();
    
    // 3. Automatically choose 'python' for Windows, and 'python3' for Render/Linux, Sensei!
    const pythonCommand = os.platform() === 'win32' ? 'python' : 'python3';

    // 4. Use path.join to build safe paths that work on both Windows and Linux, Sensei!
    const scriptPath = path.join(__dirname, '..', 'ai', 'analyzer.py'); 
    const videoPath = path.join(__dirname, '..', 'uploads', filename);

    console.log(`Starting AI Analysis with command: ${pythonCommand}, Sensei!`);
    console.log(`Target Video: ${videoPath}, Sensei!`);

    // 5. Launch the AI engine, Sensei!
    const python = spawn(pythonCommand, [scriptPath, videoPath]);

    let aiResult = '';

    // 6. Force any hidden Python errors to print to the Render logs, Sensei!
    python.stderr.on('data', (data) => {
      console.error(`PYTHON SYSTEM ERROR, SENSEI: ${data.toString()}`);
    });

    // 7. Capture the success output from Python, Sensei!
    python.stdout.on('data', (data) => {
      aiResult += data.toString();
      console.log(`PYTHON PROGRESS, SENSEI: ${data.toString()}`);
    });

    // 8. Handle the script finishing, Sensei!
    python.on('close', async (code) => {
      if (code !== 0) {
        return res.status(500).json({ error: "Python AI script crashed, Sensei! Check Render logs." });
      }
      
      // 9. If successful, update the database with the new data, Sensei!
      await prisma.userAssessment.update({
        where: { id: assessmentId },
        data: {
          status: 'completed',
          aiMetrics: aiResult,
        }
      });

      return res.status(200).json({ 
        message: "AI Analysis Complete, Sensei!",
        result: aiResult
      });
    });

  } catch (error) {
    console.error("Analysis Error, Sensei:", error);
    return res.status(500).json({ error: 'Failed to analyze: ' + error.message });
  }
}; // This closes the analyzeAssessment function, Sensei!

const getAssessment = async (req, res) => {
  try {
    const assessment = await prisma.userAssessment.findFirst({
      where: {
        id: req.params.id,
        user_id: req.user.uid,
      },
      include: {
        assessment_type: true,
      },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found, Sensei!' });
    }

    res.status(200).json({
      success: true,
      assessment,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assessment: ' + error.message });
  }
};

// This exports everything properly to the router, Sensei!
module.exports = { startAssessment, uploadAssessment, analyzeAssessment, getAssessment };
