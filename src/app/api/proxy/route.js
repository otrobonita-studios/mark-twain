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
    // Vercel Preview deployment hostnames for otrobonita-team projects look
    // like <project>-<hash>-otrobonita.vercel.app or
    // <project>-git-<branch>-otrobonita.vercel.app. Scoped to "-otrobonita"
    // specifically (not a blanket .vercel.app allow) so unrelated
    // third-party Vercel-hosted sites can't call this proxy from a
    // browser context using this shared paid-key allowance.
    if (hostname.endsWith("-otrobonita.vercel.app")) {
      return true;
    }
    // Vercel also mints random-word production aliases that omit the team
    // slug -- e.g. stellar-logistics-wheat.vercel.app is a live production
    // alias of the Stellar Logistics site that the rule above misses.
    // Scoped to the stellar-logistics project prefix rather than a blanket
    // .vercel.app allow, since .vercel.app is a public suffix anyone can
    // deploy to.
    if (
      hostname.startsWith("stellar-logistics") &&
      hostname.endsWith(".vercel.app")
    ) {
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
