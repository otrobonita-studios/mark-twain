/**
 * Shared LLM routing for the Mark proxy.
 *
 * LLM_PROVIDER (deepseek | lmstudio) wins.
 * Else Vercel → DeepSeek.
 * Else local → LM Studio.
 *
 * Client Gemini model names are ignored.
 */

const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";
const DEFAULT_LM_STUDIO_URL = "http://127.0.0.1:1234/v1";

function lmStudioBase() {
  return (process.env.LM_STUDIO_BASE_URL || DEFAULT_LM_STUDIO_URL).replace(/\/$/, "");
}

async function lmStudioReachable() {
  try {
    const res = await fetch(`${lmStudioBase()}/models`, {
      signal: AbortSignal.timeout(800),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function resolveProvider() {
  const override = (process.env.LLM_PROVIDER || "").trim().toLowerCase();
  if (override === "deepseek" || override === "lmstudio") return override;
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    return "deepseek";
  }
  return "lmstudio";
}

/** Local: LM Studio if it answers, else DeepSeek when the key exists (laptop without models). */
export async function resolveProviderAsync() {
  const override = (process.env.LLM_PROVIDER || "").trim().toLowerCase();
  if (override === "deepseek" || override === "lmstudio") return override;
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    return "deepseek";
  }
  if (await lmStudioReachable()) return "lmstudio";
  if ((process.env.DEEPSEEK_API_KEY || "").trim()) return "deepseek";
  return "lmstudio";
}

export function hasInlineImages(contents) {
  if (!contents || typeof contents === "string") return false;
  if (!Array.isArray(contents)) return false;
  return contents.some((item) =>
    (item?.parts || []).some((part) => part?.inlineData?.data)
  );
}

function schemaInstruction(config) {
  if (!config) return "";
  const wantJson =
    config.responseMimeType === "application/json" || config.responseSchema;
  if (!wantJson) return "";
  const schema = config.responseSchema
    ? `\nMatch this JSON shape (Gemini-style schema; emit JSON only):\n${JSON.stringify(config.responseSchema)}`
    : "\nRespond with JSON only. No markdown fences.";
  return `You MUST respond with a single valid JSON object and nothing else.${schema}`;
}

function roleFromGemini(role) {
  return role === "model" || role === "assistant" ? "assistant" : "user";
}

export function geminiContentsToOpenAIMessages(contents, config) {
  const messages = [];
  const system = schemaInstruction(config);
  if (system) messages.push({ role: "system", content: system });

  if (typeof contents === "string") {
    messages.push({ role: "user", content: contents });
    return messages;
  }

  if (!Array.isArray(contents)) {
    messages.push({ role: "user", content: String(contents ?? "") });
    return messages;
  }

  for (const item of contents) {
    const role = roleFromGemini(item?.role);
    const parts = item?.parts || [];
    const text = parts
      .map((part) => part?.text)
      .filter(Boolean)
      .join("\n");
    const images = parts.filter((part) => part?.inlineData?.data);

    if (images.length === 0) {
      if (text) messages.push({ role, content: text });
      continue;
    }

    const content = [];
    for (const part of parts) {
      if (part?.text) content.push({ type: "text", text: part.text });
      if (part?.inlineData?.data) {
        const mime = part.inlineData.mimeType || "image/png";
        content.push({
          type: "image_url",
          image_url: { url: `data:${mime};base64,${part.inlineData.data}` },
        });
      }
    }
    messages.push({ role, content });
  }

  return messages;
}

export function geminiContentsToAnthropic(contents, config) {
  const system = schemaInstruction(config);
  const messages = [];

  if (typeof contents === "string") {
    return {
      system,
      messages: [{ role: "user", content: contents }],
    };
  }

  if (!Array.isArray(contents)) {
    return {
      system,
      messages: [{ role: "user", content: String(contents ?? "") }],
    };
  }

  for (const item of contents) {
    const role = roleFromGemini(item?.role);
    const parts = item?.parts || [];
    const content = [];
    for (const part of parts) {
      if (part?.text) content.push({ type: "text", text: part.text });
      if (part?.inlineData?.data) {
        content.push({
          type: "image",
          source: {
            type: "base64",
            media_type: part.inlineData.mimeType || "image/png",
            data: part.inlineData.data,
          },
        });
      }
    }
    if (content.length === 0) continue;
    const onlyText = content.length === 1 && content[0].type === "text";
    messages.push({
      role,
      content: onlyText ? content[0].text : content,
    });
  }

  return { system, messages };
}

async function lmStudioModel(baseUrl) {
  const named = (process.env.LM_STUDIO_MODEL || "").trim();
  if (named) return named;
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/models`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return "local-model";
    const data = await res.json();
    return data?.data?.[0]?.id || "local-model";
  } catch {
    return "local-model";
  }
}

async function openAIChat({ url, apiKey, model, messages, jsonMode, maxTokens }) {
  const body = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature: 0.2,
    thinking: { type: "disabled" },
  };
  if (jsonMode) body.response_format = { type: "json_object" };

  let res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (res.status === 400) {
    delete body.thinking;
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LLM HTTP ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = await res.json();
  const message = data?.choices?.[0]?.message || {};
  const text = (message.content || message.reasoning_content || "").trim();
  if (!text) throw new Error("LLM returned empty content");
  return text;
}

export async function completeText({ contents, config, maxTokens = 4096 }) {
  const provider = await resolveProviderAsync();
  const jsonMode =
    config?.responseMimeType === "application/json" || Boolean(config?.responseSchema);
  const messages = geminiContentsToOpenAIMessages(contents, config);

  if (provider === "deepseek") {
    const apiKey = (process.env.DEEPSEEK_API_KEY || "").trim();
    if (!apiKey) {
      throw new Error("DEEPSEEK_API_KEY required on Vercel (and when LLM_PROVIDER=deepseek)");
    }
    const model =
      (process.env.DEEPSEEK_MODEL || process.env.DEEPSEEK_MODEL_VERSION || "").trim() ||
      DEFAULT_DEEPSEEK_MODEL;
    const official =
      model === "deepseek-chat" ||
      model === "deepseek-reasoner" ||
      model.startsWith("DeepSeek-") ||
      model.includes("/")
        ? DEFAULT_DEEPSEEK_MODEL
        : model;
    return openAIChat({
      url: DEEPSEEK_URL,
      apiKey,
      model: official,
      messages,
      jsonMode,
      maxTokens,
    });
  }

  const base = (process.env.LM_STUDIO_BASE_URL || DEFAULT_LM_STUDIO_URL).replace(/\/$/, "");
  const model = await lmStudioModel(base);
  try {
    return await openAIChat({
      url: `${base}/chat/completions`,
      apiKey: "lm-studio",
      model,
      messages,
      jsonMode,
      maxTokens,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Start LM Studio server on :1234 — ${msg}`);
  }
}

export async function completeVision({ contents, config, maxTokens = 4096 }) {
  const apiKey = (process.env.ANTHROPIC_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error(
      "This request includes an image. DeepSeek V4 is text-only; set ANTHROPIC_API_KEY for vision (Blueprint)."
    );
  }

  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey });
  const model =
    process.env.ANTHROPIC_MODEL_NAME ||
    process.env.ANTHROPIC_MODEL ||
    "claude-haiku-4-5";
  const { system, messages } = geminiContentsToAnthropic(contents, config);

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    ...(system ? { system } : {}),
    messages,
  });

  const text = response.content
    ?.filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
  if (!text) throw new Error("Vision model returned empty content");
  return text;
}
