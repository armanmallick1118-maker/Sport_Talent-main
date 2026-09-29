const express = require('express');
const Groq = require('groq-sdk');
const router = express.Router();

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
};

// Fallback dictionary for common foods
const FOOD_DICTIONARY = [
  { keywords: ['roti', 'chapati', 'phulka'], name: 'Whole Wheat Roti', cal: 85, p: 3, c: 18, f: 0.5, fib: 2.5, unit: 'piece' },
  { keywords: ['dal', 'daal', 'lentil'], name: 'Cooked Lentil Dal', cal: 140, p: 8.5, c: 20, f: 3.2, fib: 4.5, unit: 'bowl' },
  { keywords: ['sabzi', 'sabji', 'vegetable', 'veggie'], name: 'Mixed Vegetable Sabzi', cal: 120, p: 3.5, c: 14, f: 5.5, fib: 4.0, unit: 'bowl' },
  { keywords: ['curd', 'dahi', 'yogurt'], name: 'Plain Curd / Dahi', cal: 95, p: 4.5, c: 6, f: 5.0, fib: 0, unit: 'cup' },
  { keywords: ['idli'], name: 'Steamed Idli', cal: 65, p: 2, c: 13, f: 0.2, fib: 0.5, unit: 'piece' },
  { keywords: ['sambar'], name: 'Vegetable Sambar', cal: 90, p: 3.5, c: 14, f: 2.5, fib: 3, unit: 'bowl' },
  { keywords: ['chutney'], name: 'Coconut Chutney', cal: 75, p: 1, c: 3, f: 7, fib: 1.5, unit: 'tbsp' },
  { keywords: ['khichdi'], name: 'Moong Dal Khichdi', cal: 220, p: 7.5, c: 38, f: 4.5, fib: 4, unit: 'bowl' },
  { keywords: ['paneer paratha'], name: 'Paneer Paratha', cal: 280, p: 10, c: 32, f: 12, fib: 3, unit: 'piece' },
  { keywords: ['paratha', 'parantha'], name: 'Plain Paratha', cal: 210, p: 4, c: 28, f: 9, fib: 2, unit: 'piece' },
  { keywords: ['paneer'], name: 'Fresh Paneer (100g)', cal: 265, p: 18, c: 3.5, f: 20, fib: 0, unit: '100g' },
  { keywords: ['chicken breast', 'chicken curry', 'chicken'], name: 'Cooked Chicken Breast / Curry', cal: 220, p: 32, c: 3, f: 8, fib: 0.5, unit: 'serving' },
  { keywords: ['egg', 'eggs'], name: 'Whole Egg', cal: 72, p: 6.3, c: 0.4, f: 4.8, fib: 0, unit: 'egg' },
  { keywords: ['egg white', 'egg whites'], name: 'Egg White', cal: 17, p: 3.6, c: 0.2, f: 0.1, fib: 0, unit: 'white' },
  { keywords: ['rice', 'white rice', 'brown rice'], name: 'Steamed Rice', cal: 190, p: 4, c: 42, f: 0.5, fib: 1.0, unit: 'cup' },
  { keywords: ['banana', 'bananas'], name: 'Fresh Banana', cal: 105, p: 1.3, c: 27, f: 0.3, fib: 3.1, unit: 'banana' },
  { keywords: ['apple', 'apples'], name: 'Apple', cal: 95, p: 0.5, c: 25, f: 0.3, fib: 4.4, unit: 'apple' },
  { keywords: ['oats', 'oatmeal'], name: 'Rolled Oats (50g)', cal: 190, p: 6.5, c: 34, f: 3.5, fib: 5.0, unit: 'serving' },
  { keywords: ['whey', 'protein powder', 'shake'], name: 'Whey Protein Isolate (1 scoop)', cal: 120, p: 25, c: 2, f: 1, fib: 0, unit: 'scoop' },
  { keywords: ['milk'], name: 'Cow Milk (250ml)', cal: 150, p: 8, c: 12, f: 7.5, fib: 0, unit: 'glass' },
  { keywords: ['salad'], name: 'Fresh Garden Salad', cal: 45, p: 1.5, c: 8, f: 0.5, fib: 3.5, unit: 'bowl' },
  { keywords: ['peanut butter'], name: 'Peanut Butter (2 tbsp)', cal: 190, p: 8, c: 7, f: 16, fib: 2, unit: 'serving' },
  { keywords: ['almonds', 'nuts'], name: 'Almonds (28g / 1 handful)', cal: 160, p: 6, c: 6, f: 14, fib: 3.5, unit: 'handful' }
];

function ruleBasedParser(rawText) {
  const lower = rawText.toLowerCase();
  const items = [];
  
  // Split by common delimiters +, and, comma
  const parts = lower.split(/[\+,\n]| and /gi).map(p => p.trim()).filter(Boolean);

  parts.forEach(part => {
    // Extract quantity if leading number exists (e.g. "2 roti", "300ml milk", "1.5 cup rice")
    const qtyMatch = part.match(/^([\d\.]+)\s*(g|gm|grams|ml|cup|bowl|scoop|piece|slice|plate)?\s*(.*)$/i);
    let qty = 1;
    let foodQuery = part;
    if (qtyMatch) {
      const parsedNum = parseFloat(qtyMatch[1]);
      if (!isNaN(parsedNum) && parsedNum > 0) {
        qty = parsedNum;
        foodQuery = qtyMatch[3] || part;
      }
    }

    // Match against dictionary
    const match = FOOD_DICTIONARY.find(f => 
      f.keywords.some(k => foodQuery.includes(k))
    );

    if (match) {
      // Avoid duplicate matching if already in list
      if (!items.some(i => i.item_name === match.name)) {
        items.push({
          item_name: match.name,
          quantity: qty,
          calories: Math.round(match.cal * qty),
          protein: +(match.p * qty).toFixed(1),
          carbs: +(match.c * qty).toFixed(1),
          fat: +(match.f * qty).toFixed(1),
          fiber: +(match.fib * qty).toFixed(1)
        });
      }
    } else {
      // Generic item estimation if unlisted
      items.push({
        item_name: foodQuery.charAt(0).toUpperCase() + foodQuery.slice(1),
        quantity: qty,
        calories: Math.round(130 * qty),
        protein: +(5 * qty).toFixed(1),
        carbs: +(18 * qty).toFixed(1),
        fat: +(4 * qty).toFixed(1),
        fiber: +(2 * qty).toFixed(1)
      });
    }
  });

  const totals = items.reduce(
    (acc, cur) => ({
      calories: acc.calories + cur.calories,
      protein_g: +(acc.protein_g + cur.protein).toFixed(1),
      carbs_g: +(acc.carbs_g + cur.carbs).toFixed(1),
      fat_g: +(acc.fat_g + cur.fat).toFixed(1),
      fiber_g: +(acc.fiber_g + cur.fiber).toFixed(1),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
  );

  return {
    raw_input: rawText,
    items,
    totals,
    is_estimated: true,
    estimation_label: "Portion-calibrated macronutrient estimation"
  };
}

router.post('/parse', async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Text query is required.' });
  }

  const groq = getGroqClient();

  if (groq) {
    const models = [
      process.env.GROQ_PRIMARY_MODEL || 'openai/gpt-oss-120b',
      process.env.GROQ_FALLBACK_MODEL || 'qwen/qwen3.8-27b',
      'qwen/qwen3.6-27b',
      'openai/gpt-oss-20b',
      'llama3-8b-8192'
    ];

    const prompt = `You are a clinical sports dietitian and precise calorie nutrition analysis engine.
Parse the following meal description into its itemized food components and exact macronutrient counts.
Meal description: "${text}"

Return ONLY a valid JSON object strictly matching this schema with NO extra commentary or formatting:
{
  "raw_input": "${text}",
  "items": [
    {
      "item_name": "string",
      "quantity": number,
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "fiber": number
    }
  ],
  "totals": {
    "calories": number,
    "protein_g": number,
    "carbs_g": number,
    "fat_g": number,
    "fiber_g": number
  },
  "is_estimated": true,
  "estimation_label": "High-precision Groq AI Nutritional Decomposition"
}`;

    for (const model of models) {
      try {
        const completion = await groq.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        });

        const responseText = completion.choices[0]?.message?.content;
        if (responseText) {
          const parsed = JSON.parse(responseText);
          if (parsed && Array.isArray(parsed.items) && parsed.totals) {
            return res.json(parsed);
          }
        }
      } catch (err) {
        // Try next model
      }
    }
  }

  // Fallback to local rule engine
  const fallbackResult = ruleBasedParser(text);
  return res.json(fallbackResult);
});

module.exports = router;
