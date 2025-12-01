require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const Groq = require('groq-sdk'); // npm install groq-sdk
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'No message' });
    
    // Try Groq first (10x faster inference) [web:12][web:16]
    try {
      const groqCompletion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile", // Fastest Groq model [web:16]
        messages: [{ role: "user", content: message }],
        max_tokens: 1000,
        temperature: 0.7
      });
      return res.json({ reply: groqCompletion.choices[0].message.content });
    } catch (groqError) {
      console.log('Groq failed, falling back to OpenAI:', groqError.message);
    }
    
    // Fallback to OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }],
      max_tokens: 1000,
      temperature: 0.7
    });
    
    res.json({ reply: completion.choices[0].message.content });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: 'AI error: ' + e.message });
  }
};
