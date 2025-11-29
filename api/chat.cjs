require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'No message' });
    
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
