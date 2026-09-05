require('dotenv').config({ path: '../backend/.env' }); // load main .env if needed
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Configure multer for video upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing.');
  }
  return {
    genAI: new GoogleGenerativeAI(apiKey),
    fileManager: new GoogleAIFileManager(apiKey)
  };
}

// Emulate old Python pipeline /upload + /process flow in one step
app.post('/api/v1/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided.' });
    }

    const videoPath = req.file.path;
    const { genAI, fileManager } = getGenAI();

    console.log(`Uploading video to Gemini: ${videoPath}`);
    // 1. Upload to Gemini File API
    const uploadResponse = await fileManager.uploadFile(videoPath, {
      mimeType: req.file.mimetype || 'video/mp4',
      displayName: req.file.originalname,
    });
    
    const file = uploadResponse.file;
    console.log(`Uploaded file ${file.displayName} as: ${file.name}`);

    // Wait for the video to be processed by Gemini
    let fileState = await fileManager.getFile(file.name);
    while (fileState.state === 'PROCESSING') {
      console.log('Gemini is processing the video...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
      fileState = await fileManager.getFile(file.name);
    }

    if (fileState.state === 'FAILED') {
      throw new Error('Gemini failed to process the uploaded video.');
    }

    // 2. Prompt Gemini
    console.log('Video processed. Analyzing biomechanics...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `
      You are an elite AI sports biomechanics evaluator and performance coach.
      Watch this video of an athlete and assess their physical performance in extreme detail.
      Analyze their speed, technique, agility, endurance, and strength based on their movements.
      
      CRITICAL INSTRUCTION: If the video does NOT show a clear sports movement or full body (for example, if it's just a face or a blank screen), you MUST STILL RETURN a valid JSON object. Give low scores (e.g., 0-10) and explain in the feedback that you need a full body view.
      
      If the video DOES show movement, provide highly technical feedback. Address specific biomechanical problems (e.g., "arm drive is too low causing kinetic energy loss", "stride length is over-extended leading to heel strike", "core instability visible during deceleration"). Tell them exactly how to fix their movement patterns to improve.
      
      Return a JSON object EXACTLY in this format with NO markdown blocks and NO extra text:
      {
        "speed": 85,
        "technique": 78,
        "agility": 90,
        "endurance": 80,
        "strength": 82,
        "overall_score": 83,
        "qualitative_grade": "A-",
        "feedback": "Deeply technical feedback addressing their specific problems and movement patterns goes here..."
      }
    `;

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: file.mimeType,
          fileUri: file.uri
        }
      },
      { text: prompt },
    ]);

    let responseText = result.response.text().trim();
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    
    const scores = JSON.parse(responseText);
    console.log('Gemini Analysis Complete:', scores);

    // Cleanup local file immediately
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }
    
    // Cleanup remote file from Gemini API so it is NOT saved
    try {
      await fileManager.deleteFile(file.name);
      console.log(`Deleted remote file ${file.name} from Google servers.`);
    } catch (cleanupError) {
      console.error('Failed to delete remote file from Gemini:', cleanupError);
    }

    return res.status(200).json({
      success: true,
      message: 'Video analyzed successfully by Gemini Vision',
      data: scores
    });

  } catch (error) {
    console.error('AI Vision Pipeline Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error during analysis' });
  }
});

const PORT = 8001;
app.listen(PORT, () => {
  console.log(`Node.js Gemini AI Pipeline running on http://localhost:${PORT}`);
});
