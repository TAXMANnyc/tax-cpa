// BETTER API ROTATION - Backend (chat.taxcpa.com)
const APIs = [
  { name: 'Groq', endpoint: 'https://api.groq.com/...', key: process.env.GROQ_KEY, rpm: 30 },
  { name: 'Gemini', endpoint: 'https://generativelanguage.googleapis.com/...', key: process.env.GEMINI_KEY, rpm: 5 },
  { name: 'OpenAI', endpoint: 'https://api.openai.com/v1/chat/completions', key: process.env.OPENAI_KEY, rpm: 10 }
];

let lastUsedIndex = 0;
let requestCounts = { groq: 0, gemini: 0, openai: 0 };
const RESET_WINDOW = 60 * 1000; // 1 minute

async function smartAPIrotate(message) {
  // Find least used API with capacity
  let bestAPI = null;
  let bestScore = Infinity;
  
  for (let i = 0; i < APIs.length; i++) {
    const api = APIs[i];
    const count = requestCounts[api.name.toLowerCase()];
    const score = count / api.rpm; // Load factor
    
    if (score < bestScore && count < api.rpm * 0.8) { // Use <80% capacity
      bestScore = score;
      bestAPI = api;
    }
  }
  
  // Fallback to round-robin
  if (!bestAPI) bestAPI = APIs[lastUsedIndex];
  
  try {
    console.log(`Using ${bestAPI.name} (load: ${requestCounts[bestAPI.name.toLowerCase()]}/${bestAPI.rpm})`);
    
    const response = await fetch(bestAPI.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bestAPI.key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: bestAPI.name === 'Groq' ? 'llama3-8b-8192' : 
               bestAPI.name === 'Gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini',
        messages: [{ role: 'user', content: message }],
        max_tokens: 1000
      })
    });
    
    if (response.status === 429) {
      requestCounts[bestAPI.name.toLowerCase()]++;
      throw new Error('Rate limited');
    }
    
    requestCounts[bestAPI.name.toLowerCase()]++;
    lastUsedIndex = (lastUsedIndex + 1) % APIs.length;
    
    return await response.json();
  } catch (e) {
    console.log(`${bestAPI.name} failed: ${e.message}`);
    // Try next API
    return smartAPIrotate(message); // Recursive fallback
  }
}

// Reset counters every minute
setInterval(() => {
  Object.keys(requestCounts).forEach(key => requestCounts[key] = 0);
}, RESET_WINDOW);

// Your /api/chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const result = await smartAPIrotate(message);
    res.json({ reply: result.choices[0].message.content });
  } catch (e) {
    res.status(429).json({ error: 'All APIs busy. Try again in 1 minute.' });
  }
});
