import { GoogleGenAI } from '@google/genai';

const ALLOWED_ORIGINS = [
  'http://localhost:5173', // Vite dev default
  'http://localhost:3000', // Next.js dev default
  'https://otrobonita-superday.web.app',
  'https://otrobonita-superday.firebaseapp.com',
  'https://otrobonita-blueprint.web.app',
  'https://otrobonita-blueprint.firebaseapp.com',
  'https://otrobonita-theproductionunit.web.app',
  'https://otrobonita-theproductionunit.firebaseapp.com',
  'https://otrobonita-official.web.app',
  'https://otrobonita-official.firebaseapp.com',
];

function isOriginAllowed(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.startsWith('http://localhost:')) return true;
  return false;
}

export async function OPTIONS(request) {
  const origin = request.headers.get('origin');
  
  if (!isOriginAllowed(origin)) {
    return new Response(null, { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(request) {
  const origin = request.headers.get('origin');
  
  if (!isOriginAllowed(origin)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  try {
    const { model, contents, config } = await request.json();

    const geminiApiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured on the server' }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const response = await ai.models.generateContent({
      model: model || 'gemini-2.5-flash',
      contents: contents,
      config: config,
    });

    return new Response(JSON.stringify({ text: response.text }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error("Proxy API error:", error);
    return new Response(JSON.stringify({ error: error.message || 'An internal server error occurred' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
