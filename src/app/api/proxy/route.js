import {
  completeText,
  completeVision,
  hasInlineImages,
} from "../../../lib/llm-router";

function isOriginAllowed(origin) {
  if (!origin) return false;
  if (origin.startsWith("http://localhost:")) return true;

  try {
    const url = new URL(origin);
    const hostname = url.hostname;

    if (hostname === "otrobonita.com" || hostname.endsWith(".otrobonita.com")) {
      return true;
    }
    if (hostname.endsWith(".web.app") || hostname.endsWith(".firebaseapp.com")) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export async function OPTIONS(request) {
  const origin = request.headers.get("origin");

  if (!isOriginAllowed(origin)) {
    return new Response(null, { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function POST(request) {
  const origin = request.headers.get("origin");

  if (!isOriginAllowed(origin)) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  try {
    const { contents, config } = await request.json();

    if (contents == null) {
      return new Response(JSON.stringify({ error: "contents is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const text = hasInlineImages(contents)
      ? await completeVision({ contents, config })
      : await completeText({ contents, config });

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Proxy API error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "An internal server error occurred",
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
