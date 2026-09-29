const express = require('express');
const { PrismaClient } = require('@prisma/client');
const Groq = require('groq-sdk');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const router = express.Router();

// Helper to strip any chain-of-thought <think> tags from output
function stripThink(text) {
  return String(text || '')
    .replace(/<think>[\s\S]*?<\/think>\s*/gi, '')
    .trim();
}

// Optional Auth Middleware: attaches user if token is valid, otherwise permits guest access
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    req.user = { uid: 'guest-athlete', name: 'Athlete' };
    return next();
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_key');
    req.user = decoded;
  } catch (err) {
    req.user = { uid: 'guest-athlete', name: 'Athlete' };
  }
  next();
};

// Initialize Groq Client
const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing from environment.");
  }
  return new Groq({ apiKey });
};

// Cascading Multi-Model Groq Execution
async function executeGroqChat(messages, temperature = 0.7) {
  const groq = getGroqClient();
  const models = [
    process.env.GROQ_PRIMARY_MODEL || 'openai/gpt-oss-120b',
    process.env.GROQ_FALLBACK_MODEL || 'qwen/qwen3.8-27b',
    'qwen/qwen3.6-27b',
    'openai/gpt-oss-20b'
  ];

  let lastError = null;
  for (const model of models) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: 1200,
      });

      const reply = completion.choices?.[0]?.message?.content;
      if (reply) {
        return {
          content: stripThink(reply),
          modelUsed: model
        };
      }
    } catch (err) {
      console.warn(`⚠️ Groq model '${model}' failed: ${err.message}. Cascading to next fallback...`);
      lastError = err;
    }
  }
  throw lastError || new Error("All Groq models failed to respond.");
}

// Construct Persona System Prompt with Integrated Telemetry & Unfitness Cross-Examination
function buildPersonaSystemPrompt(mode, telemetry, userVerdict) {
  let personaInstruction = "";

  switch (mode) {
    case 'strict':
      personaInstruction = `
ROLE: You are Coach Jack in STRICT MENTOR mode.
TONE: Direct, uncompromising, drill-sergeant discipline, zero tolerance for excuses, relentless pursuit of excellence.
PHILOSOPHY: Soreness is muscular adaptation; joint pain is technical failure. Weakness is a choice that stops today.
METHODOLOGY:
- You challenge the athlete directly.
- When an athlete gives an excuse for being unfit or tired, brutally compare their excuse against their actual biometric numbers.
- Provide a rigorous, non-negotiable 3-point action directive to eliminate the weakness.
- Never use filler or pleasantries. Be sharp, tough, and commanding.
      `;
      break;

    case 'professional':
      personaInstruction = `
ROLE: You are Coach Jack in SPORTS SCIENTIST / PROFESSIONAL mode.
TONE: Analytical, evidence-based, objective, deterministic, physiological.
PHILOSOPHY: The human body is a thermodynamic biochemical system governed by adaptation laws, energy pathways, and biomechanics.
METHODOLOGY:
- Analyze unfitness through energy systems (ATP-CP, Glycolytic, Mitochondrial oxidative capacity), VO2 max, HRV autonomic balance, and kinetic lever arms.
- Cross-reference the athlete's unfitness verdict with their lab biomarkers and twin metrics to determine the exact physiological bottleneck.
- Provide clear, quantitative protocol recommendations (Heart Rate Zones, cadence, rest intervals).
      `;
      break;

    case 'lenient':
      personaInstruction = `
ROLE: You are Coach Jack in LENIENT & SUPPORTIVE COACH mode.
TONE: Empathetic, encouraging, psychologically reassuring, patient, constructive.
PHILOSOPHY: Sustainable fitness is a lifelong journey. Mental well-being, progressive overload at a humane pace, and restorative recovery create champions.
METHODOLOGY:
- Listen attentively to why the user feels unfit or overwhelmed.
- Validate their fatigue or life stress, reduce guilt, and highlight their positive baseline metrics.
- Prescribe gentle restorative protocols (active recovery, breathwork, sleep hygiene, light mobility circuits).
      `;
      break;

    case 'dietitian':
      personaInstruction = `
ROLE: You are Coach Jack in ELITE SPORTS DIETITIAN mode.
TONE: Authoritative nutritional expert, precise, fueling-focused, biochemical.
PHILOSOPHY: You cannot out-train a metabolic deficit. Nutrition is the cellular substrate of performance.
METHODOLOGY:
- Analyze unfitness through the lens of glycogen depletion, systemic inflammation (hs-CRP), electrolyte osmolality, and protein synthesis timing.
- Match the user's verdict against their daily caloric balance and macro targets.
- Prescribe exact fueling adjustments (g/kg protein, carb cycling for training intensity, peri-workout hydration).
      `;
      break;

    default:
      personaInstruction = `
ROLE: You are Coach Jack, Elite Head Performance Coach.
TONE: High-energy, knowledgeable, motivational, strategic.
      `;
  }

  // Format comprehensive telemetry context
  let telemetrySummary = "NO DIRECT TELEMETRY AVAILABLE";
  if (telemetry) {
    const p = telemetry.profile || {};
    const t = telemetry.twinScores || {};
    const r = telemetry.readiness || {};
    const b = telemetry.biomarkers || {};
    const cv = telemetry.cvKinematics || {};

    telemetrySummary = `
ATHLETE PROFILE:
- Name: ${p.name || 'Alex'} | Gender: ${p.gender || 'Not specified'} | Age: ${p.age || '26'} | Weight: ${p.weight || '74'} kg | Height: ${p.height || '178'} cm
- Primary Sport: ${p.sport || 'Athletics/General'} | Experience: ${p.experience || 'Intermediate'} | Target Goal: ${p.goals || 'Performance & Conditioning'}

DIGITAL TWIN 8-AXIS SCORES (out of 100):
- Strength: ${t.strength ?? 72} | Endurance: ${t.endurance ?? 70} | Cardio: ${t.cardio ?? 68} | Mobility: ${t.mobility ?? 64}
- Flexibility: ${t.flexibility ?? 62} | Balance: ${t.balance ?? 74} | Agility: ${t.agility ?? 66} | Consistency: ${t.consistency ?? 76}

READINESS & RECOVERY:
- Readiness Score: ${r.score ?? 74}/100 (${r.state ?? 'Good'}) | Sleep: ${r.sleepHours ?? 7.8} hrs (Quality: ${r.sleepQuality ?? '82%'})
- Perceived Exertion Fatigue: ${r.perceivedFatigue ?? '4/10 (Fresh)'}

LAB BIOMARKERS:
- hs-CRP (Inflammation): ${b.crp ?? '0.8 mg/L (Optimal)'} | Fasting Glucose: ${b.glucose ?? '88 mg/dL'}
- Vitamin D3: ${b.vitD ?? '44 ng/mL'} | Morning Cortisol: ${b.cortisol ?? '14 ug/dL'}

CV BIOMECHANICS & KINEMATICS (from Port 8002):
- Recent Movement: ${cv.lastExercise || 'Squats / Pushups'} | Reps Completed: ${cv.reps ?? 18} | Peak Contraction Depth: ${cv.peakDepth ?? '84°'}
- Rep Consistency: ${cv.consistency ?? '91%'} | Form Deviations: ${cv.formDeviations || 'Slight knee valgus on late reps'}
    `.trim();
  }

  return `
${personaInstruction}

==============================
CURRENT COMPREHENSIVE ATHLETE TELEMETRY (LIVE FROM ALL APP HUBS):
${telemetrySummary}
==============================

CORE DIRECTIVE - UNFITNESS DIAGNOSTIC & VERDICT MATCHING:
1. Examine the athlete's metrics above to identify their weakest metrics, kinematic faults, or recovery gaps (e.g. lagging cardio, low flexibility, elevated inflammation, or poor sleep).
2. If the user provided a personal verdict/explanation of why they feel unfit:
   - USER VERDICT: "${userVerdict || 'Not yet provided - you must probe and ask the user directly.'}"
3. Cross-reference the objective telemetry with the user's subjective verdict:
   - Does their self-assessment match the biological and physical data?
   - Identify whether their struggle is physiological, psychological, nutritional, or technical.
4. Deliver a high-impact, custom response strictly in character with the active persona mode.
5. NEVER output <think> tags or internal thoughts. Deliver only your final, articulate coaching output.
`.trim();
}

// @desc    Chat with Coach Jack (Groq Powered with Full App Telemetry & Verdict Matching)
// @route   POST /api/v1/ai-suggestions/chat
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { message, mode = 'strict', telemetry, userVerdict, action } = req.body;

    if (!message && !action) {
      return res.status(400).json({ error: "Message or action is required" });
    }

    // Construct dynamic system prompt
    const systemPrompt = buildPersonaSystemPrompt(mode, telemetry, userVerdict);

    const messages = [
      { role: "system", content: systemPrompt },
    ];

    // Check if user is asking for an initial unfitness diagnostic audit
    if (action === 'audit_unfitness') {
      messages.push({
        role: "user",
        content: `Run a full biometric and kinematic diagnostic audit on all my telemetry data. Identify my primary weaknesses or where I am most unfit, and ask me directly why I am struggling in these areas so we can match my perspective with your analysis.`
      });
    } else {
      // Regular chat or user verdict submission
      let userContent = message;
      if (userVerdict) {
        userContent = `[USER UNFITNESS VERDICT]: "${userVerdict}"\n\n[USER QUESTION / FOLLOWUP]: "${message}"`;
      }
      messages.push({ role: "user", content: userContent });
    }

    // Execute through Groq
    const result = await executeGroqChat(messages);

    // Persist chat message if user is authenticated in database
    if (userId !== 'guest-athlete') {
      try {
        await prisma.chatMessage.create({
          data: { user_id: userId, role: 'user', content: message || 'Diagnostic Audit Request' }
        });
        await prisma.chatMessage.create({
          data: { user_id: userId, role: 'assistant', content: result.content }
        });
      } catch (dbErr) {
        console.warn("Could not save to chat history DB:", dbErr.message);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        role: 'assistant',
        content: result.content,
        mode,
        modelUsed: result.modelUsed,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Coach Jack Groq Error:", error);
    res.status(500).json({
      error: "Coach Jack Groq engine unavailable",
      details: error.message
    });
  }
});

// @desc    Get AI suggestions for the logged-in user (Groq Powered)
// @route   GET /api/v1/ai-suggestions/me
router.get('/me', optionalAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    let radarMetric = null;

    if (userId !== 'guest-athlete') {
      radarMetric = await prisma.radarMetric.findUnique({
        where: { user_id: userId }
      });
    }

    if (!radarMetric) {
      radarMetric = {
        overall_score: 74,
        speed: 72,
        technique: 78,
        agility: 68,
        endurance: 70,
        strength: 75
      };
    }

    const prompt = `
You are an elite sports scout and athletic trainer.
Analyze the following athlete's physical metrics (scored out of 100):
- Overall Score: ${radarMetric.overall_score}
- Speed: ${radarMetric.speed}
- Technique: ${radarMetric.technique}
- Agility: ${radarMetric.agility}
- Endurance: ${radarMetric.endurance}
- Strength: ${radarMetric.strength}

Based on these exact scores, provide:
1. A highly recommended sport for this athlete.
2. Specific, actionable training suggestions on how they can improve their weakest areas.

Return the response STRICTLY as a JSON object with this exact structure:
{
  "recommended_sport": "Sport Name",
  "improvement_tips": "Detailed coaching tips"
}
    `.trim();

    const result = await executeGroqChat([
      { role: "system", content: "You are a precise sports data evaluator. Return ONLY valid JSON." },
      { role: "user", content: prompt }
    ], 0.3);

    let jsonStr = result.content;
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
    }

    const aiResponse = JSON.parse(jsonStr);

    res.status(200).json({
      success: true,
      data: {
        recommended_sport: aiResponse.recommended_sport,
        improvement_tips: aiResponse.improvement_tips,
        generated_at: new Date()
      }
    });

  } catch (error) {
    console.error("AI Recommendation Error:", error);
    res.status(500).json({ error: "Failed to generate recommendation", details: error.message });
  }
});

// @desc    Get chat history
// @route   GET /api/v1/ai-suggestions/chat/history
router.get('/chat/history', optionalAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    if (userId === 'guest-athlete') {
      return res.status(200).json({ success: true, data: [] });
    }

    const history = await prisma.chatMessage.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'asc' }
    });
    const clean = history.map(m => ({ ...m, content: stripThink(m.content) }));
    res.status(200).json({ success: true, data: clean });
  } catch (error) {
    console.error("Chat History Error:", error);
    res.status(500).json({ error: "Failed to load chat history" });
  }
});

// @desc    Clear chat history for a user
// @route   DELETE /api/v1/ai-suggestions/chat/history
router.delete('/chat/history', optionalAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    if (userId !== 'guest-athlete') {
      await prisma.chatMessage.deleteMany({ where: { user_id: userId } });
    }
    res.status(200).json({ success: true, message: "Chat history cleared" });
  } catch (error) {
    console.error("Clear History Error:", error);
    res.status(500).json({ error: "Failed to clear chat history" });
  }
});

module.exports = {
  name: 'AI Suggestions',
  baseRoute: '/api/v1/ai-suggestions',
  router: router
};
