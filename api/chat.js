export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  
  const { message } = req.body;
  
  try {
    // Gemini first (cheaper/faster)
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Tax/Crypto CPA: ${message}` }] }]
      })
    });
    
    if (geminiRes.ok) {
      const data = await geminiRes.json();
      return res.json({ reply: data.candidates[0].content.parts[0].text });
    }
    
    // OpenAI fallback
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: `Tax/Crypto CPA: ${message}` }]
      })
    });
    
    const data = await openaiRes.json();
    res.json({ reply: data.choices[0].message.content });
  } catch (e) {
    res.status(500).json({ error: 'API error' });
  }
}
