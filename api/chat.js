export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  
  const { message } = req.body;
  
  try {
    // BOTH AIs in parallel
    const [geminiRes, openaiRes] = await Promise.allSettled([
      fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Tax/Crypto CPA: ${message}` }] }]
        })
      }),
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: `Tax/Crypto CPA: ${message}` }]
        })
      })
    ]);

    let reply = '';
    
    // Gemini primary
    if (geminiRes.status === 'fulfilled' && geminiRes.value?.ok) {
      const data = await geminiRes.value.json();
      reply = data.candidates[0].content.parts[0].text;
    }
    
    // OpenAI confirmation
    if (openaiRes.status === 'fulfilled' && openaiRes.value?.ok) {
      const data = await openaiRes.value.json();
      const openaiReply = data.choices[0].message.content;
      reply += `\n\n**OpenAI confirms:** ${openaiReply.substring(0, 120)}...`;
    }

    res.json({ reply: reply || 'Both AIs analyzing...' });
    
  } catch (e) {
    res.status(500).json({ error: 'API error' });
  }
}
