export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  
  const { message } = req.body;
  
  // API order: Fastest → Cheapest → Most reliable
  const apis = [
    // 1. Grok (xAI - newest, tax/crypto strong)
    async () => {
      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: [{ role: 'user', content: message }],
          max_tokens: 1000
        })
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content;
    },
    // 2. Gemini (fast, cheap)
    async () => {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: message }] }] })
      });
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text;
    },
    // 3. OpenAI (reliable fallback)
    async () => {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
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
      const data = await res.json();
      return data.choices?.[0]?.message?.content;
    }
  ];
  
  try {
    for (const api of apis) {
      try {
        const reply = await api();
        if (reply) return res.json({ reply });
      } catch (e) {
        console.log('API failed:', e.message);
      }
    }
    res.status(500).json({ reply: 'All APIs busy. Try again.' });
  } catch (e) {
    res.status(500).json({ reply: 'Service unavailable.' });
  }
}
