export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  
  const { message } = req.body;
  
  // Quad AI Fallback: Fast/Cheap → Reliable → FREE → Expensive
  const apis = [
    // 1. Gemini (fastest, $0.075/1M)
    async () => {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: message }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
        })
      });
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text;
    },
    // 2. OpenAI (reliable, $0.15/1M)
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
    },
    // 3. FREE Llama 3.1 (Groq - 500+ tokens/sec)
    async () => {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-405b-reasoning',
          messages: [{ role: 'user', content: message }]
        })
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content;
    },
    // 4. Grok (expensive last resort)
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
    }
  ];
  
  try {
    for (let i = 0; i < apis.length; i++) {
      try {
        console.log(`Trying API ${i + 1}/${apis.length}`);
        const reply = await apis[i]();
        if (reply) {
          console.log(`Success: API ${i + 1}`);
          return res.json({ reply });
        }
      } catch (e) {
        console.log(`API ${i + 1} failed:`, e.message);
      }
    }
    res.status(500).json({ reply: 'All APIs busy. Try again in 30 seconds.' });
  } catch (e) {
    console.error('Fatal error:', e);
    res.status(500).json({ reply: 'Service temporarily unavailable.' });
  }
}
