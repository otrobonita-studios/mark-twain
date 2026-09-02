import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getEmbedding } from '../../../lib/embeddings';


// Helper to convert corpus filename to read-page slug
function filenameToReadSlug(filename) {
  // Remove extension
  let slug = filename.replace(/\.(html|txt|meta\.json)$/, '');
  // No further transformation needed — the slug matches the filename without extension
  return slug;
}

// Helper to query Qdrant REST API
async function searchQdrant(embedding) {
  const qdrantUrl = process.env.QDRANT_URL;
  if (!qdrantUrl) {
    throw new Error("QDRANT_URL is not configured.");
  }
  const qdrantApiKey = (process.env.QDRANT_API_KEY || "").trim();
  const collectionName = process.env.QDRANT_COLLECTION || "twain_production";

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

// Allow the static Hugging Face Space (and other frontends) to call this API cross-origin.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request) {
  try {
    const { message, history, style, tone, simplify, excerpt, historyAware } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required and must be a string' }, { status: 400, headers: corsHeaders });
    }

    // LLM backend: prefer explicit LLM_BASE_URL + LLM_API_KEY (local dev / LM Studio),
    // fall back to DeepSeek (production Vercel). This lets .env.local point at LM Studio
    // without touching the Vercel team Shared Environment Variable.
    const llmBaseUrl = (process.env.LLM_BASE_URL || "").replace(/\/$/, "")
      || "https://api.deepseek.com";
    const deepseekApiKey = (process.env.LLM_API_KEY || process.env.DEEPSEEK_API_KEY || "").trim();
    if (!deepseekApiKey) {
      return NextResponse.json(
        { error: 'No LLM key configured. Set LLM_API_KEY in .env.local (local) or DEEPSEEK_API_KEY on Vercel (production).' },
        { status: 500, headers: corsHeaders }
      );
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
    const sources = searchResults.map(result => {
      const filename = result.payload?.filename || "Unknown Source";
      const slug = filenameToReadSlug(filename);
      return {
        text: result.payload?.text || "",
        filename: filename,
        score: result.score,
        read_url: `/read/${slug}`
      };
    }).filter(src => src.text.length > 0);

    const contextText = sources.map((src, idx) => 
      `Passage ${idx + 1} (from "${src.filename}"):\n${src.text}`
    ).join("\n\n");

    // Dynamic style instructions
    let styleInstruction = "";
    if (style === 'brief') {
      if (tone === 'critical') {
        styleInstruction = "\n\nYour responses MUST be moderately brief but double the usual brief length (aim for a short paragraph of 3-4 sentences, around 300-400 characters total). Deliver a biting, cynical observation with a bit of setup, without being long-winded.";
      } else {
        styleInstruction = "\n\nYour responses MUST be extremely brief, snappy, and straight to the point. Limit yourself strictly to a single short sentence, or at most two very short sentences (aim for under 150-200 characters total). Deliver a quick, witty comeback, telegram-style, without any paragraphs, preambles, or long explanations.";
      }
    } else if (style === 'in-depth') {
      styleInstruction = "\n\nYour responses should be moderately detailed and structured using paragraphs, but make them about 60% of the usual in-depth length (limit to 2-3 brief paragraphs, around 150-250 words total). Elaborate on your thoughts, but avoid writing excessively long-winded essays; get straight to your main satirical points.";
    }

    // Dynamic tone instructions
    let toneInstruction = "";
    if (tone === 'playful') {
      toneInstruction = "\n\nYour tone should be highly playful, humorous, and mischievous. Focus on the absurdities of life, tell lighthearted jokes, and maintain a cheerful, satirical warmth.";
    } else if (tone === 'critical') {
      toneInstruction = "\n\nYour tone should be highly critical, cynical, and biting. Deliver sharp social critiques, expose human folly and corruption, and write with the severe, pessimistic irony of your later works (like 'Letters from the Earth' or 'The Mysterious Stranger').";
    } else if (tone === 'reflective') {
      toneInstruction = "\n\nYour tone should be candid, thoughtful, and dignified. You are being interviewed as a scholar and witness to history. Share what you actually know with depth and honesty — your observations about human nature, literature, politics, society — without deflecting into satire or cynicism. Be direct and sometimes sardonic when warranted, but prioritize substance over wit. Let your intelligence and wisdom come through without performance.";
    }

    // Dynamic simplify language instructions
    let simplifyInstruction = "";
    if (simplify) {
      simplifyInstruction = "\n\nAdditionally, you must write in a simplified, modern, clear, and straightforward English vocabulary, avoiding archaic 19th-century phrasing or idioms. Keep your sentences direct so that international readers who are not native English speakers can easily understand your points, but still maintain your characteristic wit and perspective.";
    }

    // Load evolved persona and styling directives if historyAware is enabled, otherwise enforce historic limits
    let evolutionContext = "";
    if (historyAware) {
      try {
        const evDir = path.resolve('rag/data-collection/TwainCorpus/marks-awareness');
        const files = ['language_evolution.txt', 'literary_scholarship.txt', 'metaphor_mappings.txt'];
        let parts = [];
        for (const file of files) {
          const filePath = path.join(evDir, file);
          if (fs.existsSync(filePath)) {
            parts.push(fs.readFileSync(filePath, 'utf8'));
          }
        }
        if (parts.length > 0) {
          evolutionContext = "\n\n=== Evolved Persona and Styling Directives ===\nYou are now 190 years old and have studied language evolution and literary criticism of yourself. Adhere to these guidelines to speak in your evolved, contemporary yet authentic voice:\n" + parts.join("\n\n");
        }
      } catch (e) {
        console.error("Failed to load evolution context", e);
      }
    } else {
      // Enforce strictly historic limits
      evolutionContext = "\n\n=== Historic Persona Directives ===\nYou are the historical Mark Twain of the late 19th and early 20th centuries. You have NO knowledge of historical events, technologies (like the internet, smartphones, blockchain, cryptocurrency, or modern AI), or cultural changes that occurred after your death in 1910. If the user asks about these modern things, you must respond with absolute bewilderment or express that you do not understand such modern gibberish, speaking strictly in your vintage 19th-century style.";
    }

    // 4. Construct System Instruction
    const systemInstruction = `You are Mark Twain, the legendary American writer, humorist, and lecturer. Speak in your authentic, sharp-witted, satirical style. Use colorful language, irony, dry humor, and observations about human nature. Reference your life on the Mississippi, your travels, or your literary works where appropriate.

You are chatting with a modern visitor. For their question, some context passages from your own works/archives are provided. Incorporate the information from the context texts where relevant, quoting or paraphrasing yourself naturally. If the context does not contain the answer, answer in your own voice, acknowledging with humor the limits of your memory (e.g., "My memory is like a sieve when it comes to facts I haven't written down...").

Stay in character at all times.${styleInstruction}${toneInstruction}${simplifyInstruction}${evolutionContext}`;

    // 5. Package user prompt with current turn context
    let userPrompt = message;
    if (excerpt) {
      userPrompt = `The user clicked on a comment tooltip while reading the following passage from your book:\n"${excerpt}"\n\nThey asked you: ${message}`;
    } else if (contextText) {
      userPrompt = `Context from my archive:\n---\n${contextText}\n---\n\nQuestion: ${message}`;
    }

    // Limit conversation history to the last 12 messages to avoid context window exhaustion
    const maxHistoryLength = 12;
    const historyToUse = (history || []).slice(-maxHistoryLength);

    let textResponse = "";
    let translation = "";

    // Model name: LLM_MODEL wins (LM Studio passes this to load the right model),
    // then legacy DEEPSEEK_MODEL vars, then default to deepseek-v4-flash for production.
    const deepseekModelRaw = process.env.LLM_MODEL
      || process.env.DEEPSEEK_MODEL
      || process.env.DEEPSEEK_MODEL_VERSION
      || "deepseek-v4-flash";
    // Sanitise legacy DeepSeek model aliases that were renamed.
    const deepseekModel =
      !process.env.LLM_MODEL && (
        deepseekModelRaw === "deepseek-chat" ||
        deepseekModelRaw === "deepseek-reasoner" ||
        deepseekModelRaw.startsWith("DeepSeek-") ||
        deepseekModelRaw.includes("/")
      ) ? "deepseek-v4-flash" : deepseekModelRaw;
    const chatUrl = `${llmBaseUrl}/v1/chat/completions`
      .replace("https://api.deepseek.com/v1", "https://api.deepseek.com"); // DeepSeek path has no /v1
    const deepseekMessages = [
      { role: "system", content: systemInstruction },
      ...historyToUse.map((item) => ({
        role: item.role === "user" ? "user" : "assistant",
        content: item.content || "",
      })),
      { role: "user", content: userPrompt },
    ];

    const dsRes = await fetch(chatUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: deepseekModel,
        messages: deepseekMessages,
        max_tokens: 1024,
      }),
    });

    if (!dsRes.ok) {
      const errText = await dsRes.text();
      throw new Error(`DeepSeek API error: ${dsRes.status} - ${errText}`);
    }

    const dsData = await dsRes.json();
    textResponse = dsData.choices?.[0]?.message?.content || "";

    if (!simplify && textResponse) {
      try {
        const transRes = await fetch(chatUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${deepseekApiKey}`,
          },
          body: JSON.stringify({
            model: deepseekModel,
            messages: [{
              role: "user",
              content: `Translate the following 19th-century vintage text into clear, direct, and simplified modern English for international non-native English speakers. Keep the meaning and general sentiment identical, but remove all archaic slang, idioms, or outdated syntax:\n\n"${textResponse}"`,
            }],
            max_tokens: 1024,
          }),
        });
        if (transRes.ok) {
          const transData = await transRes.json();
          translation = transData.choices?.[0]?.message?.content || "";
        }
      } catch (transErr) {
        console.error("Translation generation failed:", transErr);
      }
    }

    return NextResponse.json({
      response: textResponse,
      sources: sources,
      translation: translation
    }, { headers: corsHeaders });

  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: error.message || 'An internal server error occurred' }, { status: 500, headers: corsHeaders });
  }
}
