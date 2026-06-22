import path from 'path';

/**
 * Helper to compute BGE-M3 embeddings.
 * Tries:
 * 1. DeepInfra API (if DEEPINFRA_API_KEY is configured)
 * 2. Hugging Face Inference API (if HF_TOKEN or HF_API_KEY is configured)
 * 3. Local background embedding server (port 5002)
 * 4. Local Python script fallback in virtual environment
 * 
 * @param {string} text - The input text to embed
 * @returns {Promise<number[]>} Embedding vector
 */
export async function getEmbedding(text) {
  // Option 1: Use DeepInfra if DEEPINFRA_API_KEY is defined (highly recommended for BGE-M3 in production)
  const deepinfraKey = (process.env.DEEPINFRA_API_KEY || "").trim();
  if (deepinfraKey) {
    try {
      const response = await fetch("https://api.deepinfra.com/v1/openai/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${deepinfraKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "BAAI/bge-m3",
          input: [text]
        }),
        cache: 'no-store'
      });
      if (response.ok) {
        const result = await response.json();
        if (result.data && result.data[0] && result.data[0].embedding) {
          return result.data[0].embedding;
        }
        throw new Error("Unexpected DeepInfra response format");
      } else {
        const errText = await response.text();
        throw new Error(`DeepInfra returned ${response.status}: ${errText}`);
      }
    } catch (err) {
      console.error("DeepInfra API error:", err);
      throw new Error(`DeepInfra Embedding failed: ${err.message}`);
    }
  }

  // Option 2: Use Hugging Face Inference API if HF_TOKEN is defined
  const hfToken = (process.env.HF_TOKEN || process.env.HF_API_KEY || "").trim();
  if (hfToken) {
    try {
      const response = await fetch("https://router.huggingface.co/hf-inference/pipeline/feature-extraction/BAAI/bge-m3", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          inputs: text,
          options: { wait_for_model: true }
        }),
        cache: 'no-store'
      });
      if (response.ok) {
        const result = await response.json();
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
      throw new Error(`HF Embedding failed: ${err.message}`);
    }
  }

  // Option 3: Query local background embedding server if running (extremely fast local option)
  try {
    const response = await fetch("http://127.0.0.1:5002", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      cache: 'no-store',
      signal: AbortSignal.timeout(500)
    });
    if (response.ok) {
      const embedding = await response.json();
      if (Array.isArray(embedding)) {
        return embedding;
      }
    }
  } catch (err) {
    // If not running or timeout, silently continue to local python script option
  }

  // Option 4: Fall back to local Python script (ideal for local development)
  try {
    const { execFileSync } = await import('child_process');
    const isWin = process.platform === 'win32';
    const pythonRelativePath = isWin
      ? 'rag/data-collection/.venv/Scripts/python.exe'
      : 'rag/data-collection/.venv/bin/python';
    
    const pythonPath = path.resolve(pythonRelativePath);
    const scriptPath = path.resolve('rag/get_embedding.py');
    
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
