const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); 
export default async function handler(req, res) { 
  const completion = await openai.chat.completions.create({ model: 'gpt-3.5-turbo', messages: [{ role: 'user', content: message }] }); 
  res.json({ reply: completion.choices[0].message.content }); } 
