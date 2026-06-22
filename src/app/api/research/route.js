import { getEmbedding } from '../../../lib/embeddings';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(request) {
  const expectedKey = (process.env.RESEARCH_API_KEY || "").trim();
  if (expectedKey) {
    const authHeader = request.headers.get('Authorization') || "";
    if (authHeader !== `Bearer ${expectedKey}`) {
      return new Response(JSON.stringify({ error: "Unauthorized. Please provide a valid RESEARCH_API_KEY in the Authorization header." }), {
        status: 401,
        headers: corsHeaders,
      });
    }
  }

  const qdrantUrl = process.env.QDRANT_URL;
  if (!qdrantUrl) {
    return new Response(JSON.stringify({ error: "QDRANT_URL is not configured on the server." }), {
      status: 500,
      headers: corsHeaders,
    });
  }
  const qdrantApiKey = (process.env.QDRANT_API_KEY || "").trim();
  const collectionName = "twain_test";
  const baseUrl = qdrantUrl.replace(/\/$/, "");

  try {
    const response = await fetch(`${baseUrl}/collections/${collectionName}`, {
      method: "GET",
      headers: {
        "api-key": qdrantApiKey || "",
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to retrieve Qdrant collection info: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const result = data.result || {};
    
    return new Response(JSON.stringify({
      collection: collectionName,
      status: result.status,
      vectors_count: result.vectors_count,
      points_count: result.points_count,
      vector_size: result.config?.params?.vectors?.size || 1024,
      distance: result.config?.params?.vectors?.distance || "Cosine",
      embedding_model: "BAAI/bge-m3",
      payload_schema: {
        text: "String - The text content of the chunk (~500 words)",
        filename: "String - The source file name of the chunk",
        chunk_index: "Integer - The chunk index within the file"
      }
    }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Research API GET error:", error);
    return new Response(JSON.stringify({ error: error.message || 'An internal server error occurred' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

export async function POST(request) {
  const expectedKey = (process.env.RESEARCH_API_KEY || "").trim();
  if (expectedKey) {
    const authHeader = request.headers.get('Authorization') || "";
    if (authHeader !== `Bearer ${expectedKey}`) {
      return new Response(JSON.stringify({ error: "Unauthorized. Please provide a valid RESEARCH_API_KEY in the Authorization header." }), {
        status: 401,
        headers: corsHeaders,
      });
    }
  }

  const qdrantUrl = process.env.QDRANT_URL;
  if (!qdrantUrl) {
    return new Response(JSON.stringify({ error: "QDRANT_URL is not configured on the server." }), {
      status: 500,
      headers: corsHeaders,
    });
  }
  const qdrantApiKey = (process.env.QDRANT_API_KEY || "").trim();
  const collectionName = "twain_test";
  const baseUrl = qdrantUrl.replace(/\/$/, "");

  try {
    const body = await request.json();
    const action = body.action || "search";

    if (action === "search") {
      let embedding = body.vector;
      const query = body.query;
      const limit = Math.min(parseInt(body.limit || 10, 10), 100);
      const filter = body.filter || null;
      const withVector = body.with_vector === true;

      // If text query is provided, compute embedding on the server
      if (!embedding && query) {
        if (typeof query !== 'string') {
          return new Response(JSON.stringify({ error: "Query must be a string" }), {
            status: 400,
            headers: corsHeaders,
          });
        }
        embedding = await getEmbedding(query);
      }

      if (!embedding) {
        return new Response(JSON.stringify({ error: "Either 'vector' or 'query' must be provided for search." }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      // Query Qdrant search REST API
      const searchUrl = `${baseUrl}/collections/${collectionName}/points/search`;
      const response = await fetch(searchUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": qdrantApiKey || "",
        },
        body: JSON.stringify({
          vector: embedding,
          limit: limit,
          filter: filter,
          with_payload: true,
          with_vector: withVector,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Qdrant search failed: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      return new Response(JSON.stringify({
        results: data.result || [],
      }), {
        status: 200,
        headers: corsHeaders,
      });

    } else if (action === "scroll" || action === "points") {
      const limit = Math.min(parseInt(body.limit || 100, 10), 500);
      const offset = body.offset || null;
      const filter = body.filter || null;
      const withVector = body.with_vector === true;

      // Query Qdrant scroll REST API
      const scrollUrl = `${baseUrl}/collections/${collectionName}/points/scroll`;
      const response = await fetch(scrollUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": qdrantApiKey || "",
        },
        body: JSON.stringify({
          limit: limit,
          offset: offset,
          filter: filter,
          with_payload: true,
          with_vector: withVector,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Qdrant scroll failed: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      return new Response(JSON.stringify({
        points: data.result?.points || [],
        next_page_offset: data.result?.next_page_offset || null,
      }), {
        status: 200,
        headers: corsHeaders,
      });

    } else {
      return new Response(JSON.stringify({ error: `Unsupported action: '${action}'. Supported: 'search', 'scroll'.` }), {
        status: 400,
        headers: corsHeaders,
      });
    }

  } catch (error) {
    console.error("Research API POST error:", error);
    return new Response(JSON.stringify({ error: error.message || 'An internal server error occurred' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
