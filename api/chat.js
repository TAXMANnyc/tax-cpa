export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  
  const { message } = req.body;
  
  try {
    // 1. Gemini primary (fast)
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Tax/Crypto CPA: ${message}` }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 800 }
      })
    });
    
    const geminiData = await geminiRes.json();
    const geminiReply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!geminiReply) throw new Error('Gemini failed');
    
    let reply = geminiReply;
    
    // 2. OpenAI quality check (cheap model)
    try {
      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Verify tax/crypto accuracy. Respond ONLY: "✅ Verified" or "⚠️ Check with CPA"' },
            { role: 'user', content: geminiReply }
          ],
          max_tokens: 20
        })
      });
      
      const openaiData = await openaiRes.json();
      const verification = openaiData.choices[0].message.content.trim();
      reply += `\n\n${verification}`;
      
    } catch (e) {
      reply += '\n\n⚠️ OpenAI check failed';
    }
    
    res.json({ reply });
    
  } catch (e) {
    res.status(500).json({ error: 'API error' });
  }
}
