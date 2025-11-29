export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'No message' });
    
    // ECHO MODE - WORKS 100%
    res.json({ reply: `AI: "${message}" - Chatbot fixed! Add real AI keys later.` });
    
  } catch(e) {
    res.status(500).json({ error: 'Server error' });
  }
}
