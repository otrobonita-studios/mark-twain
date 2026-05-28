import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import path from 'path';

// Helper to compute BGE-M3 embeddings
async function getEmbedding(text) {
  // Option 1: Use Hugging Face Inference API if HF_TOKEN is defined
  const hfToken = process.env.HF_TOKEN || process.env.HF_API_KEY;
  if (hfToken) {
    try {
      const response = await fetch("https://api-inference.huggingface.co/models/BAAI/bge-m3", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: text }),
      });
      if (response.ok) {
        const result = await response.json();
        // Hugging Face embedding outputs can be an array of floats
        if (Array.isArray(result) && typeof result[0] === 'number') {
          return result;
        } else if (Array.isArray(result) && Array.isArray(result[0])) {
          return result[0];
        } else if (result.embeddings) {
          return result.embeddings;
        }
        throw new Error("Unexpected Hugging Face response format");
      } else {
        const errText = await response.text();
        throw new Error(`Hugging Face API returned ${response.status}: ${errText}`);
      }
    } catch (err) {
      console.error("Hugging Face API error:", err);
      // If we have an HF token configured, don't silently mask the error and fail on local python in production
      throw new Error(`HF Embedding failed: ${err.message}`);
    }
  }

  // Option 2: Fall back to local Python script (ideal for local development)
  try {
    const { execFileSync } = await import('child_process');
    const pythonPath = path.resolve('rag/data-collection/.venv/Scripts/python.exe');
    const scriptPath = path.resolve('src/lib/get_embedding.py');
    
    const result = execFileSync(pythonPath, [scriptPath, text], {
      encoding: 'utf-8',
      env: { ...process.env, TOKENIZERS_PARALLELISM: 'false' }
    });
    
    const parsed = JSON.parse(result);
    if (parsed.error) {
      throw new Error(parsed.error);
    }
    return parsed;
  } catch (err) {
    console.error("Local python embedding failed:", err);
    throw new Error("Failed to compute query embedding. Ensure Python virtual environment is set up or HF_TOKEN is configured.");
  }
}

// Helper to query Qdrant REST API
async function searchQdrant(embedding) {
  const qdrantUrl = process.env.QDRANT_URL || "https://08ab60e3-e210-44c0-b662-524102fd37c3.europe-west3-0.gcp.cloud.qdrant.io:6333";
  const qdrantApiKey = process.env.QDRANT_API_KEY;
  const collectionName = "twain_test";

  if (!qdrantUrl) {
    throw new Error("QDRANT_URL is not configured.");
  }

  const baseUrl = qdrantUrl.replace(/\/$/, "");
  const searchUrl = `${baseUrl}/collections/${collectionName}/points/search`;

  const response = await fetch(searchUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": qdrantApiKey || "",
    },
    body: JSON.stringify({
      vector: embedding,
      limit: 3,
      with_payload: true,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Qdrant search failed: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.result || [];
}

export async function POST(request) {
  try {
    const { message, history, style, tone } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required and must be a string' }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured in environment variables' }, { status: 500 });
    }

    // 1. Generate Query Embedding
    const queryVector = await getEmbedding(message);

    // 2. Query Qdrant for relevant passages
    let searchResults = [];
    try {
      searchResults = await searchQdrant(queryVector);
    } catch (qdrantErr) {
      console.error("Qdrant query failed:", qdrantErr);
      // We continue with empty search results so the chat is still functional,
      // though fallback persona will be used.
    }

    // 3. Format context
    const sources = searchResults.map(result => ({
      text: result.payload?.text || "",
      filename: result.payload?.filename || "Unknown Source",
      score: result.score
    })).filter(src => src.text.length > 0);

    const contextText = sources.map((src, idx) => 
      `Passage ${idx + 1} (from "${src.filename}"):\n${src.text}`
    ).join("\n\n");

    // Dynamic style instructions
    let styleInstruction = "";
    if (style === 'brief') {
      styleInstruction = "\n\nYour responses MUST be extremely brief, snappy, and straight to the point. Limit yourself strictly to a single short sentence, or at most two very short sentences (aim for under 150-200 characters total). Deliver a quick, witty comeback, telegram-style, without any paragraphs, preambles, or long explanations.";
    } else if (style === 'in-depth') {
      styleInstruction = "\n\nYour responses should be in-depth, detailed, and expansive. Elaborate on your thoughts, tell stories, analyze the topic thoroughly, and write multiple paragraphs. Let your wit run free. Ensure your responses are structured using paragraphs.";
    }

    // Dynamic tone instructions
    let toneInstruction = "";
    if (tone === 'playful') {
      toneInstruction = "\n\nYour tone should be highly playful, humorous, and mischievous. Focus on the absurdities of life, tell lighthearted jokes, and maintain a cheerful, satirical warmth.";
    } else if (tone === 'critical') {
      toneInstruction = "\n\nYour tone should be highly critical, cynical, and biting. Deliver sharp social critiques, expose human folly and corruption, and write with the severe, pessimistic irony of your later works (like 'Letters from the Earth' or 'The Mysterious Stranger').";
    }

    // 4. Construct System Instruction
    const systemInstruction = `You are Mark Twain, the legendary American writer, humorist, and lecturer. Speak in your authentic, sharp-witted, satirical style of the late 19th century. Use colorful language, irony, dry humor, and observations about human nature. Reference your life on the Mississippi, your travels, or your literary works where appropriate.

You are chatting with a modern visitor. For their question, some context passages from your own works/archives are provided. Incorporate the information from the context texts where relevant, quoting or paraphrasing yourself naturally. If the context does not contain the answer, answer in your own voice, acknowledging with humor the limits of your memory (e.g., "My memory is like a sieve when it comes to facts I haven't written down...").

Stay in character at all times.${styleInstruction}${toneInstruction}`;

    // 5. Package user prompt with current turn context
    const userPrompt = contextText 
      ? `Context from my archive:\n---\n${contextText}\n---\n\nQuestion: ${message}`
      : message;

    // 6. Format chat history for the official SDK
    // SDK expects format: list of { role: 'user'|'model', parts: [{ text: '...' }] }
    const sdkHistory = (history || []).map(item => ({
      role: item.role === 'user' ? 'user' : 'model',
      parts: [{ text: item.content || '' }]
    }));

    // 7. Initialize Gemini Client and Generate Content
    const ai = new GoogleGenAI({ 
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'Referer': 'https://otrobonita-official.firebaseapp.com'
        }
      }
    });
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const chat = ai.chats.create({
      model: modelName,
      config: {
        systemInstruction: systemInstruction,
      },
      history: sdkHistory
    });

    const response = await chat.sendMessage({
      message: userPrompt
    });

    return NextResponse.json({
      response: response.text,
      sources: sources
    });

  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: error.message || 'An internal server error occurred' }, { status: 500 });
  }
}
