require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  try {
    console.log("Testing Gemini API Key...");
    if (!process.env.GEMINI_API_KEY) {
      console.error("No API key found in .env");
      return;
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    
    const result = await model.generateContent("Say 'Hello, I am Coach Jack!'");
    console.log("Response:", result.response.text());
  } catch (error) {
    console.error("Gemini Error:", error);
  }
}

testGemini();
