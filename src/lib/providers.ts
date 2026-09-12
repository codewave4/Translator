/* ============================================================
   موتورهای هوش مصنوعی با کلید اختصاصی کاربر
   همه درخواست‌ها مستقیم از مرورگر به سرویس می‌روند (بدون سرور واسطه).
   کلیدها فقط در localStorage مرورگر کاربر ذخیره می‌شوند.
   ============================================================ */

export type ProviderId =
  | "gemini"
  | "openai"
  | "groq"
  | "openrouter"
  | "mistral"
  | "deepseek"
  | "cerebras"
  | "together"
  | "xai"
  | "fireworks"
  | "sambanova";

/** شناسه مجازی دکمه «سرویس‌های بیشتر» — سرویس واقعی از روی کلید تشخیص داده می‌شود */
export const MORE = "more" as const;
export type ProviderChoice = ProviderId | typeof MORE;

export interface ProviderInfo {
  id: ProviderId;
  name: string;
  /** آیا پلن رایگان دارد؟ */
  free: boolean;
  /** صفحه ساخت کلید */
  keyUrl: string;
  /** پیشوند معمول کلید — فقط برای راهنمایی کاربر */
  keyHint: string;
  models: string[];
  /** endpoint سازگار با OpenAI (برای همه به‌جز Gemini) */
  endpoint?: string;
  /** رنگ نشان */
  color: string;
  /** الگوی تشخیص کلید (برای «سرویس‌های بیشتر») */
  keyPattern?: RegExp;
  /** true = فقط از طریق دکمه «سرویس‌های بیشتر» در دسترس است */
  hidden?: boolean;
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    free: true,
    keyUrl: "https://aistudio.google.com/app/apikey",
    keyHint: "AIza…",
    models: ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-1.5-pro"],
    color: "#4285F4",
  },
  {
    id: "openai",
    name: "OpenAI",
    free: false,
    keyUrl: "https://platform.openai.com/api-keys",
    keyHint: "sk-…",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1", "gpt-3.5-turbo"],
    endpoint: "https://api.openai.com/v1/chat/completions",
    color: "#10A37F",
  },
  {
    id: "groq",
    name: "Groq",
    free: true,
    keyUrl: "https://console.groq.com/keys",
    keyHint: "gsk_…",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it", "mixtral-8x7b-32768"],
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    color: "#F55036",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    free: true,
    keyUrl: "https://openrouter.ai/settings/keys",
    keyHint: "sk-or-…",
    models: [
      "openrouter/auto",
      "meta-llama/llama-3.3-70b-instruct:free",
      "qwen/qwen3-235b-a22b:free",
      "mistralai/mistral-small-3.2-24b-instruct:free",
      "openai/gpt-4o-mini",
      "anthropic/claude-3.5-haiku",
      "deepseek/deepseek-chat",
    ],
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    color: "#7C3AED",
  },
  {
    id: "mistral",
    name: "Mistral",
    free: true,
    keyUrl: "https://console.mistral.ai/api-keys",
    keyHint: "…",
    models: ["mistral-small-latest", "open-mistral-nemo", "mistral-large-latest"],
    endpoint: "https://api.mistral.ai/v1/chat/completions",
    color: "#F97316",
  },

  /* ----- سرویس‌های بیشتر (تشخیص خودکار از روی کلید) ----- */
  {
    id: "cerebras",
    name: "Cerebras",
    free: true,
    keyUrl: "https://cloud.cerebras.ai/",
    keyHint: "csk-…",
    models: ["llama-3.3-70b", "llama3.1-8b", "qwen-3-32b"],
    endpoint: "https://api.cerebras.ai/v1/chat/completions",
    color: "#F15A29",
    keyPattern: /^csk-[A-Za-z0-9_-]{20,}$/,
    hidden: true,
  },
  {
    id: "xai",
    name: "xAI (Grok)",
    free: false,
    keyUrl: "https://console.x.ai/",
    keyHint: "xai-…",
    models: ["grok-3-mini", "grok-3", "grok-2-1212"],
    endpoint: "https://api.x.ai/v1/chat/completions",
    color: "#111111",
    keyPattern: /^xai-[A-Za-z0-9]{20,}$/,
    hidden: true,
  },
  {
    id: "fireworks",
    name: "Fireworks AI",
    free: true,
    keyUrl: "https://fireworks.ai/account/api-keys",
    keyHint: "fw_…",
    models: [
      "accounts/fireworks/models/llama-v3p3-70b-instruct",
      "accounts/fireworks/models/llama-v3p1-8b-instruct",
      "accounts/fireworks/models/qwen2p5-72b-instruct",
    ],
    endpoint: "https://api.fireworks.ai/inference/v1/chat/completions",
    color: "#6720FF",
    keyPattern: /^fw_[A-Za-z0-9]{16,}$/,
    hidden: true,
  },
  {
    id: "together",
    name: "Together AI",
    free: true,
    keyUrl: "https://api.together.xyz/settings/api-keys",
    keyHint: "tgp_v1_… / hex",
    models: [
      "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
      "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
      "Qwen/Qwen2.5-72B-Instruct-Turbo",
    ],
    endpoint: "https://api.together.xyz/v1/chat/completions",
    color: "#0F6FFF",
    keyPattern: /^(tgp_v1_[A-Za-z0-9_-]{20,}|[a-f0-9]{64})$/,
    hidden: true,
  },
  {
    id: "sambanova",
    name: "SambaNova",
    free: true,
    keyUrl: "https://cloud.sambanova.ai/apis",
    keyHint: "xxxxxxxx-xxxx-…",
    models: ["Meta-Llama-3.3-70B-Instruct", "Meta-Llama-3.1-8B-Instruct", "DeepSeek-V3-0324"],
    endpoint: "https://api.sambanova.ai/v1/chat/completions",
    color: "#EE4C2C",
    keyPattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    hidden: true,
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    free: false,
    keyUrl: "https://platform.deepseek.com/api_keys",
    keyHint: "sk-…",
    models: ["deepseek-chat", "deepseek-reasoner"],
    endpoint: "https://api.deepseek.com/chat/completions",
    color: "#4D6BFE",
    // کلید DeepSeek: sk- + ۳۲ کاراکتر هگز (بدون sk-proj- یا sk-or-)
    keyPattern: /^sk-[a-f0-9]{32}$/,
    hidden: true,
  },
];

/** سرویس‌هایی که به‌عنوان دکمه جداگانه نمایش داده می‌شوند */
export const MAIN_PROVIDERS = PROVIDERS.filter((p) => !p.hidden);
/** سرویس‌هایی که زیر دکمه «سرویس‌های بیشتر» هستند */
export const MORE_PROVIDERS = PROVIDERS.filter((p) => p.hidden);

export const providerById = (id: string): ProviderInfo =>
  PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0];

export const isProviderId = (v: string): v is ProviderId =>
  PROVIDERS.some((p) => p.id === v);

/** تشخیص سرویس از روی شکل کلید (فقط بین «سرویس‌های بیشتر») */
export function detectMoreProvider(key: string): ProviderInfo | null {
  const k = key.trim();
  if (!k) return null;
  return MORE_PROVIDERS.find((p) => p.keyPattern?.test(k)) ?? null;
}

/* ---------------- ذخیره‌سازی تنظیمات ---------------- */

export interface ApiSettings {
  provider: ProviderId;
  /** کلید هر سرویس جداگانه ذخیره می‌شود تا با تعویض سرویس از بین نرود */
  keys: Partial<Record<ProviderId, string>>;
  models: Partial<Record<ProviderId, string>>;
}

const KEY = "salam-tr-api-v1";

export function loadApiSettings(): ApiSettings {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (v && typeof v === "object") {
      return {
        provider: isProviderId(v.provider) ? v.provider : "gemini",
        keys: v.keys && typeof v.keys === "object" ? v.keys : {},
        models: v.models && typeof v.models === "object" ? v.models : {},
      };
    }
  } catch {
    /* noop */
  }
  return { provider: "gemini", keys: {}, models: {} };
}

export function saveApiSettings(s: ApiSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* noop */
  }
}

export const activeKey = (s: ApiSettings): string => (s.keys[s.provider] ?? "").trim();
export const activeModel = (s: ApiSettings): string =>
  (s.models[s.provider] ?? "").trim() || providerById(s.provider).models[0];
export const hasActiveKey = (s: ApiSettings): boolean => activeKey(s).length > 0;

/** نام کوتاه مدل برای نمایش (بدون پیشوند سازنده و پسوند :free) */
export function shortModel(model: string): string {
  return model.split("/").pop()?.replace(/:free$/, "") ?? model;
}

/* ---------------- خطاها ---------------- */

export type ProviderErrorKind = "unauthorized" | "ratelimit" | "model" | "network" | "generic";

export class ProviderError extends Error {
  kind: ProviderErrorKind;
  constructor(kind: ProviderErrorKind, detail?: string) {
    super(detail ?? kind);
    this.kind = kind;
  }
}

const isAbort = (e: unknown) => (e as Error)?.name === "AbortError";

function kindFromStatus(status: number): ProviderErrorKind {
  if (status === 401 || status === 403) return "unauthorized";
  if (status === 429 || status === 402) return "ratelimit";
  if (status === 404) return "model";
  return "generic";
}

/* ---------------- پرامپت ترجمه ---------------- */

const LANG_NAMES: Record<string, string> = {
  fa: "Persian (Farsi)", en: "English", ar: "Arabic", tr: "Turkish", fr: "French",
  de: "German", es: "Spanish", it: "Italian", ru: "Russian", zh: "Chinese (Simplified)",
  ja: "Japanese", ko: "Korean", hi: "Hindi", pt: "Portuguese", nl: "Dutch", sv: "Swedish",
  pl: "Polish", uk: "Ukrainian", id: "Indonesian", ms: "Malay", th: "Thai", vi: "Vietnamese",
};

const langName = (code: string) => LANG_NAMES[code] ?? code;

function buildPrompt(src: string, tgt: string): string {
  const from = src === "auto" ? "the source language (detect it automatically)" : langName(src);
  return [
    `You are a professional translator. Translate the user's text from ${from} into ${langName(tgt)}.`,
    "Rules:",
    "- Output ONLY the translation. No explanations, no notes, no quotation marks, no preamble.",
    "- Preserve the meaning, tone, register and formatting (line breaks, lists, punctuation).",
    "- Keep names, numbers, URLs and code unchanged.",
    "- Make the translation natural and fluent, as a native speaker would write it.",
    "- If the text is already in the target language, return it unchanged.",
  ].join("\n");
}

/** پاک‌سازی خروجی مدل: حذف گیومه‌ها، برچسب‌ها و بلوک‌های تفکر */
function clean(out: string): string {
  let s = out.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  s = s.replace(/^(translation|ترجمه)\s*[:：]\s*/i, "");
  if (/^```[\s\S]*```$/.test(s)) s = s.replace(/^```[a-z]*\n?/i, "").replace(/```$/, "").trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("«") && s.endsWith("»"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

/* ---------------- فراخوانی سرویس‌ها ---------------- */

async function doFetch(url: string, init: RequestInit, signal?: AbortSignal): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal });
  } catch (e) {
    if (isAbort(e)) throw e;
    throw new ProviderError("network");
  }
}

async function readError(res: Response): Promise<string> {
  try {
    const j = await res.json();
    return String(j?.error?.message ?? j?.message ?? res.statusText);
  } catch {
    return res.statusText;
  }
}

/** سرویس‌های سازگار با OpenAI: OpenAI، Groq، OpenRouter، Mistral */
async function chatCompletion(
  p: ProviderInfo,
  key: string,
  model: string,
  system: string,
  user: string,
  signal?: AbortSignal
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  };
  if (p.id === "openrouter") {
    headers["HTTP-Referer"] = typeof location !== "undefined" ? location.origin : "https://github.com";
    headers["X-Title"] = "Text Translator";
  }
  const res = await doFetch(
    p.endpoint!,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    },
    signal
  );
  if (!res.ok) {
    const msg = await readError(res);
    const kind = res.status === 400 && /model/i.test(msg) ? "model" : kindFromStatus(res.status);
    throw new ProviderError(kind, msg);
  }
  const data = await res.json().catch(() => null);
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new ProviderError("generic");
  return text;
}

/** Google Gemini (generateContent) */
async function gemini(
  key: string,
  model: string,
  system: string,
  user: string,
  signal?: AbortSignal
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await doFetch(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature: 0.2 },
      }),
    },
    signal
  );
  if (!res.ok) {
    const msg = await readError(res);
    const kind = res.status === 400 && /api key/i.test(msg) ? "unauthorized" : kindFromStatus(res.status);
    throw new ProviderError(kind, msg);
  }
  const data = await res.json().catch(() => null);
  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts) ? parts.map((x: { text?: string }) => x.text ?? "").join("") : "";
  if (!text.trim()) throw new ProviderError("generic");
  return text;
}

/** ترجمه یک تکه متن با سرویس انتخابی */
export async function providerTranslate(
  settings: ApiSettings,
  text: string,
  src: string,
  tgt: string,
  signal?: AbortSignal
): Promise<string> {
  const p = providerById(settings.provider);
  const key = activeKey(settings);
  const model = activeModel(settings);
  if (!key) throw new ProviderError("unauthorized");
  const system = buildPrompt(src, tgt);
  const raw =
    p.id === "gemini"
      ? await gemini(key, model, system, text, signal)
      : await chatCompletion(p, key, model, system, text, signal);
  return clean(raw);
}

/** تست اتصال: یک ترجمه خیلی کوتاه با مدل مشخص؛ زمان پاسخ را برمی‌گرداند */
export async function testProvider(
  settings: ApiSettings,
  signal?: AbortSignal,
  model?: string
): Promise<number> {
  const s: ApiSettings = model
    ? { ...settings, models: { ...settings.models, [settings.provider]: model } }
    : settings;
  const t0 = performance.now();
  await providerTranslate(s, "Hello", "en", "fa", signal);
  return Math.round(performance.now() - t0);
}

/* ---------------- لیست زنده مدل‌ها ---------------- */

export interface ModelInfo {
  id: string;
  free: boolean;
}

/** الگوهایی که مدل‌های غیرمتنی (تصویر، صدا، embedding و…) را حذف می‌کنند */
const EXCLUDE = /embed|embedding|whisper|tts|audio|dall-e|image|vision-only|moderation|ocr|realtime|transcri|guard|rerank|imagen|veo|aqa|bison|gecko|learnlm|search|computer-use|codestral-mamba/i;

function keepTextModel(id: string, p: ProviderId): boolean {
  if (EXCLUDE.test(id)) return false;
  if (p === "openai") return /^(gpt-|o\d|chatgpt-)/.test(id) && !/instruct|preview-\d{4}/.test(id);
  if (p === "gemini") return /^gemini-/.test(id) && !/-exp-\d{4}|thinking-exp|-8b-exp/.test(id);
  if (p === "xai") return /^grok-/.test(id) && !/-vision|-image/.test(id);
  if (p === "together" || p === "fireworks")
    return !/flux|stable-diffusion|sdxl|playground|-vl-|vision|whisper|embed/i.test(id);
  return true;
}

/** مدل پیشنهادی هر سرویس (ارزان، سریع و مناسب ترجمه) */
export function recommendedModel(p: ProviderId, ids: string[]): string {
  const prefs: Record<ProviderId, RegExp[]> = {
    gemini: [/^gemini-2\.0-flash$/, /^gemini-2\.\d-flash$/, /flash-lite/, /flash/],
    openai: [/^gpt-4o-mini$/, /^gpt-4\.1-mini$/, /mini/, /^gpt-4o$/],
    groq: [/llama-3\.3-70b-versatile/, /llama-3\.1-8b-instant/, /llama/],
    openrouter: [/llama-3\.3-70b-instruct:free/, /gemini.*flash.*:free/, /:free$/],
    mistral: [/^mistral-small-latest$/, /open-mistral-nemo/, /small/],
    deepseek: [/^deepseek-chat$/, /chat/],
    cerebras: [/llama-3\.3-70b/, /llama3\.1-8b/, /llama/],
    together: [/Llama-3\.3-70B-Instruct-Turbo-Free/i, /-Free$/i, /Llama-3\.3-70B/i, /llama/i],
    xai: [/^grok-3-mini$/, /mini/, /^grok-3$/, /grok/],
    fireworks: [/llama-v3p3-70b-instruct/, /llama-v3p1-8b-instruct/, /llama/],
    sambanova: [/Meta-Llama-3\.3-70B-Instruct/, /Llama-3\.1-8B/, /Llama/],
  };
  for (const re of prefs[p]) {
    const hit = ids.find((id) => re.test(id));
    if (hit) return hit;
  }
  return ids[0] ?? providerById(p).models[0];
}

/** دریافت لیست مدل‌ها مستقیم از سرویس (بعد از تأیید کلید) */
export async function fetchModels(settings: ApiSettings, signal?: AbortSignal): Promise<ModelInfo[]> {
  const p = providerById(settings.provider);
  const key = activeKey(settings);
  if (!key) throw new ProviderError("unauthorized");

  let ids: string[] = [];
  let freeSet = new Set<string>();

  if (p.id === "gemini") {
    const res = await doFetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}&pageSize=200`,
      { method: "GET" },
      signal
    );
    if (!res.ok) throw new ProviderError(kindFromStatus(res.status), await readError(res));
    const data = await res.json().catch(() => null);
    const list: { name?: string; supportedGenerationMethods?: string[] }[] = Array.isArray(data?.models) ? data.models : [];
    ids = list
      .filter((m) => (m.supportedGenerationMethods ?? []).includes("generateContent"))
      .map((m) => String(m.name ?? "").replace(/^models\//, ""))
      .filter(Boolean);
  } else {
    const base = p.endpoint!.replace(/\/chat\/completions$/, "/models");
    const headers: Record<string, string> = { Authorization: `Bearer ${key}` };
    if (p.id === "openrouter") {
      headers["HTTP-Referer"] = typeof location !== "undefined" ? location.origin : "https://github.com";
      headers["X-Title"] = "Text Translator";
    }
    const res = await doFetch(base, { method: "GET", headers }, signal);
    if (!res.ok) throw new ProviderError(kindFromStatus(res.status), await readError(res));
    const data = await res.json().catch(() => null);
    const list: {
      id?: string;
      type?: string;
      pricing?: { prompt?: string; completion?: string };
      architecture?: { output_modalities?: string[]; modality?: string };
    }[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    ids = list
      .filter((m) => {
        // Together نوع مدل را می‌دهد؛ فقط مدل‌های چت
        if (p.id === "together") return !m.type || m.type === "chat";
        if (p.id !== "openrouter") return true;
        // فقط مدل‌هایی که خروجی متنی دارند
        const out = m.architecture?.output_modalities;
        if (Array.isArray(out)) return out.includes("text");
        const mod = m.architecture?.modality;
        return !mod || /->text/.test(mod);
      })
      .map((m) => String(m.id ?? ""))
      .filter(Boolean);
    if (p.id === "openrouter") {
      freeSet = new Set(
        list
          .filter((m) => /:free$/.test(String(m.id)) || (m.pricing && Number(m.pricing.prompt) === 0 && Number(m.pricing.completion) === 0))
          .map((m) => String(m.id))
      );
    }
  }

  const uniq = Array.from(new Set(ids)).filter((id) => keepTextModel(id, p.id));
  if (!uniq.length) throw new ProviderError("generic");

  const isFree = (id: string) => (p.id === "openrouter" ? freeSet.has(id) : p.free);
  const rec = recommendedModel(p.id, uniq);
  uniq.sort((a, b) => {
    if (a === rec) return -1;
    if (b === rec) return 1;
    const fa = isFree(a) ? 0 : 1;
    const fb = isFree(b) ? 0 : 1;
    if (fa !== fb) return fa - fb;
    return a.localeCompare(b);
  });
  return uniq.map((id) => ({ id, free: isFree(id) }));
}
