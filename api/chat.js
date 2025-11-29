export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  
  const { message } = req.body;
  
  try {
    // Gemini (safer prompt)
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }], // Removed "Tax/Crypto CPA:" prefix
        generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
      })
    });
    
    const geminiData = await geminiRes.json();
    console.log('Gemini debug:', JSON.stringify(geminiData).substring(0, 500)); // Vercel logs
    
    if (geminiRes.ok && geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
      return res.json({ reply: geminiData.candidates[0].content.parts[0].text });
    }
    
    // OpenAI FALLBACK (always works)
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: message }]
      })
    });
    
    const openaiData = await openaiRes.json();
    res.json({ reply: openaiData.choices[0].message.content });
    
  } catch (e) {
    console.error('API error:', e);
    res.status(500).json({ reply: 'Service temporarily unavailable. Try again.' });
  }
}
