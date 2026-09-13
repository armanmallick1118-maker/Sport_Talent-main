require('dotenv').config();
const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function test() {
  try {
    console.log("Testing Groq...");
    console.log("API Key:", process.env.GROQ_API_KEY ? "Present" : "Missing");
    console.log("Model:", process.env.GROQ_CHAT_MODEL);
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_CHAT_MODEL || "llama3-8b-8192",
      messages: [{ role: "user", content: "Say 'Hello, I am Coach Jack!'" }],
    });
    console.log("Response:", completion.choices[0].message.content);
  } catch (err) {
    console.error("Groq Error:", err.message);
  }
}
test();
