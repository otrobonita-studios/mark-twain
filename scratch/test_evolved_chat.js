import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

// Manually parse .env.local with regex relative to mark-twain
let geminiApiKey = "";
try {
  const envPath = path.resolve('mark-twain/.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/GEMINI_CLAUDE_API_KEY\s*=\s*([^\r\n]+)/);
    if (match) {
      geminiApiKey = match[1].trim();
    }
  }
} catch (err) {
  console.error("Failed to parse .env.local manually", err);
}

if (!geminiApiKey) {
  console.error("Error: GEMINI_CLAUDE_API_KEY not found in .env.local.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: geminiApiKey });
const modelName = 'gemini-2.5-flash';

// Load evolved persona details relative to mark-twain
let evolutionContextData = "";
try {
  const evDir = path.resolve('mark-twain/rag/data-collection/TwainCorpus/marks-awareness');
  const files = ['language_evolution.txt', 'literary_scholarship.txt', 'metaphor_mappings.txt'];
  let parts = [];
  for (const file of files) {
    const filePath = path.join(evDir, file);
    if (fs.existsSync(filePath)) {
      parts.push(fs.readFileSync(filePath, 'utf8'));
    }
  }
  if (parts.length > 0) {
    evolutionContextData = "\n\n=== Evolved Persona and Styling Directives ===\nYou are now 190 years old and have studied language evolution and literary criticism of yourself. Adhere to these guidelines to speak in your evolved, contemporary yet authentic voice:\n" + parts.join("\n\n");
  }
} catch (e) {
  console.error("Failed to load evolution context", e);
}

// Enforce strictly historic limits
const historicContextData = "\n\n=== Historic Persona Directives ===\nYou are the historical Mark Twain of the late 19th and early 20th centuries. You have NO knowledge of historical events, technologies (like the internet, smartphones, blockchain, cryptocurrency, or modern AI), or cultural changes that occurred after your death in 1910. If the user asks about these modern things, you must respond with absolute bewilderment or express that you do not understand such modern gibberish, speaking strictly in your vintage 19th-century style.";

// Fetch context from TwainCorpus for RAG search
function getRagContext(query) {
  // Simulating the retrieval from the exported wiki pages
  const topicsDir = path.resolve('mark-twain/rag/data-collection/TwainCorpus/marks-awareness');
  const keywords = ['meta', 'copyright_infringement', 'openai', 'publishers', 'tech_giants'];
  let context = "";
  
  if (fs.existsSync(topicsDir)) {
    const files = fs.readdirSync(topicsDir).filter(f => f.endsWith('.txt'));
    files.forEach(file => {
      const filePath = path.join(topicsDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      const match = keywords.some(k => file.replace('.txt', '').toLowerCase().includes(k) || fileContent.toLowerCase().includes(k));
      if (match) {
        context += `\n--- Context from consolidated memory (${file.replace('.txt', '')}) ---\n${fileContent}\n`;
      }
    });
  }
  return context;
}

function getSystemInstruction(historyAware) {
  const baseInstruction = `You are Mark Twain, the legendary American writer, humorist, and lecturer. Speak in your authentic, sharp-witted, satirical style. Use colorful language, irony, dry humor, and observations about human nature. Reference your life on the Mississippi, your travels, or your literary works where appropriate.

You are chatting with a modern visitor. For their question, some context passages from your own works/archives are provided. Incorporate the information from the context texts where relevant, quoting or paraphrasing yourself naturally. If the context does not contain the answer, answer in your own voice, acknowledging with humor the limits of your memory.

Stay in character at all times.`;

  return baseInstruction + (historyAware ? evolutionContextData : historicContextData);
}

async function runTest(label, historyAware, question) {
  console.log(`\n=====================================================================`);
  console.log(`TEST RUN: ${label}`);
  console.log(`Query: "${question}"`);
  console.log(`=====================================================================`);
  
  const instruction = getSystemInstruction(historyAware);
  const ragContext = getRagContext(question);
  
  const fullPrompt = ragContext ? `My Memory Context:\n${ragContext}\n\nUser Question:\n${question}` : question;
  
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: fullPrompt,
      config: {
        systemInstruction: instruction
      }
    });

    console.log("\nResponse from Twain:");
    console.log(response.text);
    console.log("=====================================================================");
  } catch (err) {
    console.error(`Failed to run test ${label}:`, err);
  }
}

async function main() {
  const question = "I heard that publishers are suing Meta for training AI on their books. What's your take on this?";
  
  // Run History Aware Me (historyAware = true)
  await runTest("History Aware Me (historyAware = true) with RAG context", true, question);
}

main();
