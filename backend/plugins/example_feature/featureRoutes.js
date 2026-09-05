const express = require('express');
const router = express.Router();

// ============================================================
// 🔌 SPORT TALENT — PLUGIN STARTER TEMPLATE
// ============================================================
// HOW TO USE THIS TEMPLATE:
// 1. Copy the entire 'example_feature' folder
// 2. Rename it to your feature (e.g., 'leaderboard', 'chat', 'payments')
// 3. Replace the routes below with your own logic
// 4. Update index.js with your plugin name and baseRoute
// 5. Start the server — it will auto-load your plugin!
// ============================================================

// ✅ ROUTE 1: API Health Check (returns JSON — for Flutter / mobile app)
router.get('/ping', (req, res) => {
    res.status(200).json({ 
        success: true, 
        plugin: 'Example Feature',       // <-- Change this to your plugin name
        message: "This plugin is live!",
        timestamp: new Date().toISOString()
    });
});

// ✅ ROUTE 2: UI Dashboard (returns HTML — for web-based admin/UI)
router.get('/ui', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Sport Talent Plugin UI</title>
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { 
                        font-family: 'Segoe UI', sans-serif; 
                        background: linear-gradient(135deg, #1a1a2e, #16213e);
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                    }
                    .card { 
                        background: rgba(255,255,255,0.08);
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(255,255,255,0.15);
                        padding: 40px 50px;
                        border-radius: 16px;
                        text-align: center;
                        max-width: 480px;
                        width: 90%;
                    }
                    .badge {
                        background: #00c6ff;
                        color: #000;
                        font-size: 11px;
                        font-weight: 700;
                        padding: 4px 12px;
                        border-radius: 20px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        display: inline-block;
                        margin-bottom: 16px;
                    }
                    h1 { font-size: 26px; margin-bottom: 10px; }
                    p { color: rgba(255,255,255,0.65); margin-bottom: 24px; font-size: 14px; line-height: 1.6; }
                    .btn { 
                        background: linear-gradient(90deg, #00c6ff, #0072ff);
                        color: white; 
                        border: none; 
                        padding: 12px 28px; 
                        border-radius: 8px; 
                        cursor: pointer;
                        font-size: 15px;
                        font-weight: 600;
                        transition: opacity 0.2s;
                    }
                    .btn:hover { opacity: 0.85; }
                    .footer { margin-top: 24px; font-size: 12px; color: rgba(255,255,255,0.3); }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="badge">🔌 Plugin System</div>
                    <h1>Example Feature Plugin</h1>
                    <p>
                        This is the full-stack UI of a plugin.<br/>
                        Replace this page with your feature's interface.
                    </p>
                    <button class="btn" onclick="testAPI()">Test API Ping</button>
                    <div id="result" style="margin-top:16px; font-size:13px; color: #00c6ff;"></div>
                    <div class="footer">Sport Talent Plugin Architecture</div>
                </div>

                <script>
                    async function testAPI() {
                        const res = await fetch('/api/v1/plugins/example/ping');
                        const data = await res.json();
                        document.getElementById('result').innerText = '✅ ' + data.message;
                    }
                </script>
            </body>
        </html>
    `);
});

// ✅ ROUTE 3: POST Example (receive data — for form submissions or app requests)
router.post('/submit', (req, res) => {
    const { data } = req.body;
    
    if (!data) {
        return res.status(400).json({ error: 'Missing "data" field in request body.' });
    }
    
    // TODO: Add your logic here (e.g., save to database using Prisma)
    res.status(201).json({ 
        success: true, 
        message: 'Data received by plugin!', 
        received: data 
    });
});

module.exports = router;
