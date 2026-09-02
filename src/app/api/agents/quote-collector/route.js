import { NextResponse } from 'next/server';

const fallbackQuotes = [
  { text: "If you tell the truth, you don't have to remember anything.", source: "Notebook, 1894", score: 99, verified: true },
  { text: "Whenever you find yourself on the side of the majority, it is time to pause and reflect.", source: "Notebook, 1904", score: 98, verified: true },
  { text: "Get your facts first, then you can distort them as you please.", source: "Interview with Rudyard Kipling, 1889", score: 97, verified: true },
  { text: "The secret of getting ahead is getting started.", source: "Attributed", score: 95, verified: true },
  { text: "Kindness is the language which the deaf can hear and the blind can see.", source: "Attributed", score: 96, verified: true },
  { text: "Against the assault of laughter, nothing can stand.", source: "The Mysterious Stranger, 1916", score: 98, verified: true }
];

const metadata = {
  okf_version: "0.1.0",
  agent_id: "quote-collector",
  name: "Verified Quote Collector",
  description: "Discovers, crawls, and provides verified historical quotes from Samuel Clemens (Mark Twain).",
  endpoints: [
    {
      path: "/api/agents/quote-collector",
      methods: ["GET", "POST"],
      actions: {
        get: "GET /api/agents/quote-collector?action=get - Returns a random verified quote.",
        collect: "POST /api/agents/quote-collector?action=collect - Crawls sources and indexes new quotes into the database."
      }
    }
  ],
  trust_score: 0.95,
  signature: "mock_sig_quote_collector_49026a8d622371e7d37"
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'get') {
    try {
      // Served from the static list. The Firestore-backed store was removed
      // with the Firebase teardown and has no replacement yet.
      const quotes = fallbackQuotes;

      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      return NextResponse.json({ success: true, ...randomQuote });
    } catch (error) {
      console.error("Error in quote-collector GET:", error);
      // Fallback response
      const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
      return NextResponse.json({ success: true, ...randomQuote });
    }
  }

  // Default behavior is to return the ARD/OKF metadata
  return NextResponse.json(metadata);
}

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'collect') {
    // Collecting requires somewhere to persist to. Firestore was the only
    // store and it is gone; this action is disabled rather than silently
    // pretending to succeed.
    return NextResponse.json({
      success: false,
      error: "Quote collection is disabled: no persistence layer is configured."
    }, { status: 501 });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
