const cron = require('node-cron');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. News bot cannot run.");
  }
  return new GoogleGenerativeAI(apiKey);
};

const NEWS_BOT_AUTHOR_ID = 'system-news-bot';

/**
 * Map a sport/topic keyword to a curated high-quality Pexels image URL.
 * All images are free to use (Pexels license).
 */
const SPORT_IMAGE_MAP = {
  cricket:    'https://images.pexels.com/photos/3628912/pexels-photo-3628912.jpeg?auto=compress&cs=tinysrgb&w=800',
  football:   'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=800',
  soccer:     'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=800',
  basketball: 'https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg?auto=compress&cs=tinysrgb&w=800',
  athletics:  'https://images.pexels.com/photos/3621104/pexels-photo-3621104.jpeg?auto=compress&cs=tinysrgb&w=800',
  running:    'https://images.pexels.com/photos/2803158/pexels-photo-2803158.jpeg?auto=compress&cs=tinysrgb&w=800',
  sprinting:  'https://images.pexels.com/photos/2803158/pexels-photo-2803158.jpeg?auto=compress&cs=tinysrgb&w=800',
  swimming:   'https://images.pexels.com/photos/261185/pexels-photo-261185.jpeg?auto=compress&cs=tinysrgb&w=800',
  tennis:     'https://images.pexels.com/photos/1103829/pexels-photo-1103829.jpeg?auto=compress&cs=tinysrgb&w=800',
  badminton:  'https://images.pexels.com/photos/3764007/pexels-photo-3764007.jpeg?auto=compress&cs=tinysrgb&w=800',
  boxing:     'https://images.pexels.com/photos/2881632/pexels-photo-2881632.jpeg?auto=compress&cs=tinysrgb&w=800',
  wrestling:  'https://images.pexels.com/photos/4754146/pexels-photo-4754146.jpeg?auto=compress&cs=tinysrgb&w=800',
  hockey:     'https://images.pexels.com/photos/6203496/pexels-photo-6203496.jpeg?auto=compress&cs=tinysrgb&w=800',
  gym:        'https://images.pexels.com/photos/1552249/pexels-photo-1552249.jpeg?auto=compress&cs=tinysrgb&w=800',
  fitness:    'https://images.pexels.com/photos/1552249/pexels-photo-1552249.jpeg?auto=compress&cs=tinysrgb&w=800',
  training:   'https://images.pexels.com/photos/1552249/pexels-photo-1552249.jpeg?auto=compress&cs=tinysrgb&w=800',
  nutrition:  'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
  diet:       'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
  volleyball: 'https://images.pexels.com/photos/2277981/pexels-photo-2277981.jpeg?auto=compress&cs=tinysrgb&w=800',
  cycling:    'https://images.pexels.com/photos/163407/cyclist-road-cyclist-cycling-tour-163407.jpeg?auto=compress&cs=tinysrgb&w=800',
  yoga:       'https://images.pexels.com/photos/317157/pexels-photo-317157.jpeg?auto=compress&cs=tinysrgb&w=800',
  weightlifting: 'https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg?auto=compress&cs=tinysrgb&w=800',
  default:    'https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg?auto=compress&cs=tinysrgb&w=800',
};

function getImageForKeyword(keyword = '') {
  const k = keyword.toLowerCase().trim();
  for (const [key, url] of Object.entries(SPORT_IMAGE_MAP)) {
    if (k.includes(key)) return url;
  }
  return SPORT_IMAGE_MAP.default;
}

const SPORT_URL_MAP = {
  cricket:       'https://www.bcci.tv',
  football:      'https://www.the-aiff.com',
  soccer:        'https://www.the-aiff.com',
  basketball:    'https://www.basketballfederation.in',
  athletics:     'https://www.atleticsindia.com',
  running:       'https://www.atleticsindia.com',
  sprinting:     'https://www.atleticsindia.com',
  swimming:      'https://www.swimmingindia.org',
  tennis:        'https://www.aitatenis.org',
  badminton:     'https://www.badmintonindia.org',
  boxing:        'https://www.boxingindia.co.in',
  wrestling:     'https://www.wrestlingindia.org',
  hockey:        'https://www.hockeyindia.org',
  gym:           'https://www.sports.gov.in',
  fitness:       'https://www.sports.gov.in',
  training:      'https://www.sports.gov.in',
  nutrition:     'https://www.fssai.gov.in',
  volleyball:    'https://www.volleyballindia.com',
  cycling:       'https://www.cyclingfederationofindia.org',
  yoga:          'https://www.ayush.gov.in',
  weightlifting: 'https://www.iwfindia.com',
  gymnastics:    'https://www.gymnasticsfederationofindia.org',
  default:       'https://www.sports.gov.in',
};

function getExternalUrl(keyword = '') {
  const k = keyword.toLowerCase().trim();
  for (const [key, url] of Object.entries(SPORT_URL_MAP)) {
    if (k.includes(key)) return url;
  }
  return SPORT_URL_MAP.default;
}

/**
 * Uses Gemini to generate 2 fresh sports news items for today.
 * Returns an array of { title, content, image_keyword } objects.
 */
async function generateSportsNews() {
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const prompt = `Today is ${today}. You are a sports journalist for a platform that helps young athletes and scouts discover emerging sports talent.

Generate exactly 2 short, realistic sports news articles for India or global sports. Focus on:
- Youth/junior selection trials or camp announcements
- Emerging athlete success stories
- Upcoming national/international competitions
- Fitness & training science updates for athletes
- Scout and talent hunt events

Return ONLY a valid JSON array with exactly 2 objects, no extra text:
[
  {
    "title": "Short punchy headline (max 15 words)",
    "content": "2-3 sentence news body. Factual sounding, motivating tone, relevant to aspiring athletes.",
    "image_keyword": "one sport or topic keyword (e.g. cricket, football, running, gym, nutrition)"
  },
  {
    "title": "Short punchy headline (max 15 words)",
    "content": "2-3 sentence news body. Factual sounding, motivating tone, relevant to aspiring athletes.",
    "image_keyword": "one sport or topic keyword"
  }
]`;

  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ 
    model: "gemini-3.5-flash",
    systemInstruction: "You are a sports journalist. Always respond with valid, complete JSON only. Never truncate your response."
  });
  
  const result = await model.generateContent(prompt);
  let raw = result.response.text().trim();

  if (raw.includes('```json')) raw = raw.split('```json')[1].split('```')[0].trim();
  else if (raw.includes('```')) raw = raw.split('```')[1].split('```')[0].trim();

  // Extract just the JSON array portion in case of extra text
  const arrayMatch = raw.match(/\[[\s\S]*\]/);
  if (arrayMatch) raw = arrayMatch[0];

  return JSON.parse(raw);
}

/**
 * Checks how many news posts were already created today.
 */
async function newsPostedTodayCount() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return prisma.feedPost.count({
    where: {
      type: 'news',
      authorId: NEWS_BOT_AUTHOR_ID,
      created_at: { gte: startOfDay },
    },
  });
}

/**
 * Main job: generates and saves sports news with photos to the feed.
 */
async function runNewsJob() {
  console.log('📰 [News Bot]: Running daily sports news generation...');
  try {
    const alreadyPosted = await newsPostedTodayCount();
    if (alreadyPosted >= 2) {
      console.log('📰 [News Bot]: News already posted today. Skipping.');
      return;
    }

    const newsItems = await generateSportsNews();

    for (const item of newsItems) {
      const mediaUrl    = getImageForKeyword(item.image_keyword || '');
      const externalUrl = getExternalUrl(item.image_keyword || '');
      await prisma.feedPost.create({
        data: {
          type: 'news',
          title: item.title,
          content: item.content,
          authorId: NEWS_BOT_AUTHOR_ID,
          mediaUrl,
          external_url: externalUrl,
        },
      });
      console.log(`📰 [News Bot]: Posted — "${item.title}" [img: ${item.image_keyword}] [link: ${externalUrl}]`);
    }
  } catch (err) {
    console.error('📰 [News Bot]: Error generating news:', err.message);
  }
}

/**
 * Registers the cron schedule and runs once immediately on boot.
 */
function startNewsCron() {
  cron.schedule('0 7 * * *', () => {
    runNewsJob();
  });
  console.log('📰 [News Bot]: Daily news cron scheduled at 7:00 AM.');
  runNewsJob();
}

module.exports = { startNewsCron, runNewsJob };
