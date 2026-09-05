require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const app = express();

// Secure HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Logging
app.use(morgan('dev'));


// CORS — allow frontend origins
const allowedOrigins = [
  'http://localhost:5173',   // local Vite dev server
  'http://127.0.0.1:5173',   // local Vite via IP
  'http://localhost:3000',
  process.env.FRONTEND_URL,  // set this on Railway/Render in production
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (e.g. mobile apps, Postman, curl)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS: origin not allowed — ' + origin));
  },
  credentials: true,
}));

// Parse incoming JSON
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount Routes, Sensei!
const authRoutes = require('./routes/auth');
const athleteRoutes = require('./routes/athlete');
const assessmentRoutes = require('./routes/assessmentRoutes');
const feedRoutes = require('./routes/feedRoutes');
const nutritionRoutes = require('./routes/nutritionRoutes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/athletes', athleteRoutes);
app.use('/api/v1/assessments', assessmentRoutes);
app.use('/api/v1/feed', feedRoutes);
app.use('/api/v1/nutrition', nutritionRoutes);

// --- DYNAMIC PLUGIN LOADER ---
const pluginsPath = path.join(__dirname, 'plugins');
if (fs.existsSync(pluginsPath)) {
    const pluginFolders = fs.readdirSync(pluginsPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    
    pluginFolders.forEach(folder => {
        const pluginModulePath = path.join(pluginsPath, folder, 'index.js');
        if (fs.existsSync(pluginModulePath)) {
            try {
                const plugin = require(pluginModulePath);
                if (plugin.baseRoute && plugin.router) {
                    app.use(plugin.baseRoute, plugin.router);
                    console.log(`🔌 [Plugin System]: Successfully loaded '${plugin.name}' at ${plugin.baseRoute}`);
                } else {
                    console.warn(`⚠️ [Plugin System]: Failed to load plugin in folder '${folder}'. Missing baseRoute or router.`);
                }
            } catch (err) {
                 console.error(`💥 [Plugin System]: Error loading plugin '${folder}':`, err.message);
            }
        }
    });
}

// Root API info — clean response instead of old HTML portal
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Sport Talent API',
    version: '1.0.0',
    status: '✅ running',
    endpoints: {
      health:      'GET  /api/ping',
      auth:        'POST /api/v1/auth/login | /register',
      athletes:    'GET  /api/v1/athletes/me',
      assessments: 'POST /api/v1/assessments/start',
      feed:        'GET  /api/v1/feed',
      plugins:     'GET  /api/v1/plugins/*',
    }
  });
});

// Health check
app.get('/api/ping', (req, res) => {
  res.status(200).json({ success: true, message: 'Sport Talent API is live.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 Global Error Handler:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Sport Talent API running on http://localhost:${PORT}`);
  console.log(`📡 Accepting requests from: ${allowedOrigins.join(', ')}\n`);

  // Start daily sports news cron job
  const { startNewsCron } = require('./jobs/newsCron');
  startNewsCron();
});


process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...', err);
  process.exit(1);
});
