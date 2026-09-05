const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for all origins (Sensei's frontend)
app.use(cors());

// Middleware to parse incoming JSON data from Flutter, Sensei!
app.use(express.json());

// Serve static files for the frontend, Sensei!
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

// Mount Routes, Sensei!
const authRoutes = require('./routes/auth');
const athleteRoutes = require('./routes/athlete');
const assessmentRoutes = require('./routes/assessmentRoutes');
const feedRoutes = require('./routes/feedRoutes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/athletes', athleteRoutes);
app.use('/api/v1/assessments', assessmentRoutes);
app.use('/api/v1/feed', feedRoutes);


// Test route for Pritha to hit, Sensei!
app.get('/api/ping', (req, res) => {
  console.log("🟢 PING RECEIVED FROM PRITHA'S FLUTTER APP, SENSEI!");
  res.status(200).json({ 
    success: true, 
    message: "Backend is locked, loaded, and talking to Flutter, Sensei!" 
  });
});

// Start the server on port 8000 (or Railway PORT), Sensei!
const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is locked, loaded, and permanently awake on port ${PORT}, Sensei!`);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...', err);
  process.exit(1);
});