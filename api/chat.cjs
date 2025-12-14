// chat.cjs

const fs = require('fs'); // <--- 1. IMPORT FS

// Load environment variables from .env file
require('dotenv').config();

// --- API Client Setup ---
const Groq = require('groq-sdk');
const OpenAI = require('openai');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY }); 
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// --------------------------

// --- Data Loading Block ---
let pub17Content = "";
try {
    // Load file content. The replace() call safely escapes backticks
    // to prevent issues when embedding the content in the systemPrompt template literal.
    pub17Content = fs.readFileSync('data/pub17_raw.html', 'utf8').replace(/`/g, '\\`');
    console.log("Successfully loaded IRS Publication 17 content.");
} catch (error) {
    console.error("Error loading IRS Publication 17 data:", error.message);
    // If the file is critical, you might want to uncomment the line below to stop execution
    // process.exit(1); 
}
// --------------------------

// --- Define the System Prompt with Injected Data ---
const systemPrompt = `
You are an expert tax advisor specializing in U.S. Federal Income Tax. 
Your primary source of truth is the content provided below, which is the full text of IRS Publication 17, "Your Federal Income Tax."
**Strictly answer questions based only on the information contained in the IRS Publication 17 content provided below.** If the answer is not in the text, state clearly that you cannot find the answer in the provided document.

--- IRS PUBLICATION 17 CONTENT START ---

${pub17Content}

--- IRS PUBLICATION 17 CONTENT END ---
`;
// --------------------------


// --- Main Chat Function ---
async function main(message) {
  // --- Groq Call Example ---
  try {
    const chatCompletion = await groq.chat.completions.create({
      // Use one of the Groq-supported models that supports large contexts
      // The Llama 3.1 8B model on Groq supports a 131,072 token context window.
      model: "llama-3.1-8b-instant", 
      messages: [
        { role: "system", content: systemPrompt }, // <--- INJECTED SYSTEM PROMPT
        { role: "user", content: message }
      ],
      temperature: 0.5,
      max_tokens: 1024,
    });

    console.log("Groq Response:");
    console.log(chatCompletion.choices[0].message.content);
  } catch (error) {
    console.error("Groq API Error:", error.message);
  }

  console.log('---');

  // --- OpenAI Call Example ---
  try {
    const chatCompletion = await openai.chat.completions.create({
      // Use an OpenAI model that supports a large context window, such as GPT-4o, 
      // which has a context window of 128,000 tokens.
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt }, // <--- INJECTED SYSTEM PROMPT
        { role: "user", content: message }
      ],
      temperature: 0.5,
      max_tokens: 1024,
    });

    console.log("OpenAI Response:");
    console.log(chatCompletion.choices[0].message.content);
  } catch (error) {
    console.error("OpenAI API Error:", error.message);
  }
}

// Example usage
main("What are the key requirements for claiming the Child Tax Credit?");

// --------------------------
