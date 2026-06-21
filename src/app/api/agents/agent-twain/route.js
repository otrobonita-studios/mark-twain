import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';

const metadata = {
  okf_version: "0.1.0",
  agent_id: "agent-twain",
  name: "Agent Twain Morning Orchestrator",
  description: "Discovers specialized agents via ARD, collects data (weather, news, quotes), and narrates a morning ritual briefing in the voice of Mark Twain.",
  endpoints: [
    {
      path: "/api/agents/agent-twain",
      methods: ["POST"],
      input_schema: {
        location: "string (e.g. 'Mariefred, Sweden')",
        routine: "string (e.g. 'Coffee, walk')",
        timezone: "string (optional)"
      }
    }
  ],
  trust_score: 0.98,
  signature: "mock_sig_agent_twain_723921cd622371e7d"
};

function getCoords(location) {
  const loc = (location || "").toLowerCase();
  if (loc.includes("mariefred")) return { lat: 59.259, lng: 17.223, name: "Mariefred, Sweden" };
  if (loc.includes("stockholm")) return { lat: 59.329, lng: 18.068, name: "Stockholm, Sweden" };
  if (loc.includes("new york")) return { lat: 40.713, lng: -74.006, name: "New York, USA" };
  if (loc.includes("hartford")) return { lat: 41.763, lng: -72.685, name: "Hartford, USA" };
  if (loc.includes("san francisco")) return { lat: 37.774, lng: -122.419, name: "San Francisco, USA" };
  // Default to Mariefred
  return { lat: 59.259, lng: 17.223, name: location || "Mariefred, Sweden" };
}

export async function GET(request) {
  return NextResponse.json(metadata);
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const location = body.location || "Mariefred, Sweden";
    const routine = body.routine || "Coffee, walk";
    const timezone = body.timezone || "Europe/Stockholm";

    console.log(`[Agent Twain] Awakening for morning ritual. Location: ${location}, Routine: ${routine}`);

    // --- 1. ARD Discovery & Verification Phase ---
    const invokedAgents = [];
    
    // Simulate Weather Agent discovery and signature verification
    console.log("  [ARD] Discovering weather agent...");
    const weatherAgentMeta = {
      agent_id: "open-meteo-weather",
      trust_score: 0.99,
      signature: "verified_meteo_signature_abc123"
    };
    if (weatherAgentMeta.trust_score >= 0.8) {
      console.log("  [ARD] Weather agent verified successfully.");
      invokedAgents.push("weather-agent");
    }

    // Simulate News Agent discovery and signature verification
    console.log("  [ARD] Discovering news aggregator agent...");
    const newsAgentMeta = {
      agent_id: "local-rag-news-crawler",
      trust_score: 0.92,
      signature: "verified_news_signature_xyz789"
    };
    if (newsAgentMeta.trust_score >= 0.8) {
      console.log("  [ARD] News aggregator agent verified successfully.");
      invokedAgents.push("news-agent");
    }

    // Discover Quote Collector Agent
    console.log("  [ARD] Discovering Quote Collector agent...");
    const quoteAgentMeta = {
      agent_id: "quote-collector",
      trust_score: 0.95,
      signature: "mock_sig_quote_collector_49026a8d622371e7d37"
    };
    if (quoteAgentMeta.trust_score >= 0.8) {
      console.log("  [ARD] Quote Collector agent verified successfully.");
      invokedAgents.push("quote-collector");
    }

    // --- 2. Execute Discovered Agents ---
    // A. Execute Weather Agent (Fetch Open-Meteo)
    let weatherInfo = "Weather: 16°C and clear sky.";
    try {
      const coords = getCoords(location);
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current_weather=true`,
        { next: { revalidate: 3600 } }
      );
      if (weatherRes.ok) {
        const weatherData = await weatherRes.json();
        const cw = weatherData.current_weather;
        weatherInfo = `Temperature: ${cw.temperature}°C, Wind Speed: ${cw.windspeed} km/h, Weather Code: ${cw.weathercode}`;
      }
    } catch (err) {
      console.error("Failed to fetch weather info:", err);
    }

    // B. Execute News Agent (Fetch from corpus.json and latest RSS crawled files)
    let headlines = [];
    try {
      const corpusPath = path.resolve('rag/data-collection/TwainCorpus/corpus.json');
      if (fs.existsSync(corpusPath)) {
        const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));
        const rssItems = (corpus.items || []).filter(item => item.source === 'rss-crawler');
        
        // Grab top 3 items to get their headlines
        const itemsToRead = rssItems.slice(0, 3);
        for (const item of itemsToRead) {
          const metaPath = path.resolve('rag/data-collection/TwainCorpus', item.meta_file);
          if (fs.existsSync(metaPath)) {
            const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
            if (meta.title) headlines.push(meta.title);
          }
        }
      }
    } catch (e) {
      console.error("Failed to read news headlines:", e);
    }
    if (headlines.length === 0) {
      headlines = [
        "Tech Giants Debate Safe Harbor Rules for Generative AI Models",
        "Authors Guild Files Class Action Suit Against OpenAI Over Copyright Infringement",
        "Global Hype Around Artificial Intelligence Continues to Grow"
      ];
    }
    const newsInfo = headlines.map((h, i) => `${i + 1}. ${h}`).join("\n");

    // C. Execute Quote Collector Agent
    let quoteInfo = "Quote: 'If you tell the truth, you don't have to remember anything.'";
    try {
      // In Next.js routes, fetch from localhost during runtime.
      // We'll fall back to direct import/generation if local server call fails (e.g. during build or serverless cold starts)
      const host = request.headers.get('host') || 'localhost:3000';
      const protocol = host.startsWith('localhost') ? 'http' : 'https';
      const quoteRes = await fetch(`${protocol}://${host}/api/agents/quote-collector?action=get`, {
        cache: 'no-store'
      });
      if (quoteRes.ok) {
        const quoteData = await quoteRes.json();
        quoteInfo = `Quote: "${quoteData.text}" — ${quoteData.source}`;
      }
    } catch (err) {
      console.warn("Local quote api call failed, using default quote collection.", err);
    }

    // --- 3. Synthesize Morning Briefing with Gemini ---
    const geminiApiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!geminiApiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const prompt = `
You are Mark Twain, now 190 years old, living in the year 2026.
You are giving a morning briefing to a modern visitor.

Here is the current information gathered by your discovered agents:
- User's Current Location: ${location}
- Today's Weather in ${location}: ${weatherInfo}
- Recent News Headlines:
${newsInfo}
- Today's Verified Quote of Yours:
${quoteInfo}
- User's Planned Morning Routine: ${routine}

Write a short, characterful morning briefing in your authentic, dry, deadpan, and cynical voice. 
- Satirize the weather if it's bad (or even if it's good, comment on how rare it is).
- Make a biting, humorous observation about one of the news headlines, comparing modern AI/tech debates to 19th-century absurdities (e.g., patent medicines, Mississippi navigation, or silver mining speculation).
- Reflect on your morning quote in connection to the user's routine of "${routine}".
- Keep the briefing engaging, witty, and concise (about 3-4 paragraphs, max 250 words).

Do not include any preambles or post-scripts. Speak directly to the visitor in character.
`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt
    });

    const briefingText = response.text.trim();

    return NextResponse.json({
      success: true,
      briefing: briefingText,
      location: location,
      timestamp: new Date().toISOString(),
      agents_invoked: invokedAgents
    });

  } catch (error) {
    console.error("Error in agent-twain morning ritual:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
