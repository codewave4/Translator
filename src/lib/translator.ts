/* ============================================================
   Salam Translator — core library
   موتورهای ترجمه:
     • گوگل     — endpoint آزاد translate.googleapis.com (client=gtx) بدون کلید
     • MyMemory  — API رایگان https://mymemory.translated.net/doc/spec.php
   ============================================================ */

import {
  ProviderError,
  hasActiveKey,
  providerTranslate,
  type ApiSettings,
} from "./providers";

export type UiLangCode = "fa" | "en";

export interface Lang {
  code: string;
  fa: string;
  en: string;
  native: string;
  speech: string;
}

export const LANGUAGES: Lang[] = [
  { code: "fa", fa: "فارسی", en: "Persian", native: "فارسی", speech: "fa-IR" },
  { code: "en", fa: "انگلیسی", en: "English", native: "English", speech: "en-US" },
  { code: "ar", fa: "عربی", en: "Arabic", native: "العربية", speech: "ar-SA" },
  { code: "tr", fa: "ترکی", en: "Turkish", native: "Türkçe", speech: "tr-TR" },
  { code: "fr", fa: "فرانسوی", en: "French", native: "Français", speech: "fr-FR" },
  { code: "de", fa: "آلمانی", en: "German", native: "Deutsch", speech: "de-DE" },
  { code: "es", fa: "اسپانیایی", en: "Spanish", native: "Español", speech: "es-ES" },
  { code: "it", fa: "ایتالیایی", en: "Italian", native: "Italiano", speech: "it-IT" },
  { code: "ru", fa: "روسی", en: "Russian", native: "Русский", speech: "ru-RU" },
  { code: "zh", fa: "چینی", en: "Chinese", native: "中文", speech: "zh-CN" },
  { code: "ja", fa: "ژاپنی", en: "Japanese", native: "日本語", speech: "ja-JP" },
  { code: "ko", fa: "کره‌ای", en: "Korean", native: "한국어", speech: "ko-KR" },
  { code: "hi", fa: "هندی", en: "Hindi", native: "हिन्दी", speech: "hi-IN" },
  { code: "pt", fa: "پرتغالی", en: "Portuguese", native: "Português", speech: "pt-PT" },
  { code: "nl", fa: "هلندی", en: "Dutch", native: "Nederlands", speech: "nl-NL" },
  { code: "sv", fa: "سوئدی", en: "Swedish", native: "Svenska", speech: "sv-SE" },
  { code: "pl", fa: "لهستانی", en: "Polish", native: "Polski", speech: "pl-PL" },
  { code: "uk", fa: "اوکراینی", en: "Ukrainian", native: "Українська", speech: "uk-UA" },
  { code: "id", fa: "اندونزیایی", en: "Indonesian", native: "Indonesia", speech: "id-ID" },
  { code: "ms", fa: "مالایی", en: "Malay", native: "Melayu", speech: "ms-MY" },
  { code: "th", fa: "تایلندی", en: "Thai", native: "ไทย", speech: "th-TH" },
  { code: "vi", fa: "ویتنامی", en: "Vietnamese", native: "Tiếng Việt", speech: "vi-VN" },
];

export const isKnownLang = (code: string): boolean =>
  LANGUAGES.some((l) => l.code === code);

export const langByCode = (code: string): Lang =>
  LANGUAGES.find((l) => l.code === code) ?? {
    code,
    fa: code.toUpperCase(),
    en: code.toUpperCase(),
    native: code,
    speech: code,
  };

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export const toFa = (value: string | number): string =>
  String(value).replace(/[0-9]/g, (d) => FA_DIGITS[+d]);

/* ---------------- موتورهای ترجمه ---------------- */

export type Engine = "google" | "mymemory" | "custom" | "auto";
export type EngineUsed = "google" | "mymemory" | "custom";

export interface EngineInfo {
  id: Engine;
  label: { fa: string; en: string };
  desc: { fa: string; en: string };
}

export const ENGINES: EngineInfo[] = [
  {
    id: "google",
    label: { fa: "گوگل", en: "Google" },
    desc: { fa: "کیفیت بالا و تشخیص دقیق زبان", en: "High quality, accurate detection" },
  },
  {
    id: "mymemory",
    label: { fa: "MyMemory", en: "MyMemory" },
    desc: { fa: "حافظه ترجمه با سهمیه روزانه", en: "Translation memory, daily quota" },
  },
  {
    id: "auto",
    label: { fa: "خودکار", en: "Auto" },
    desc: { fa: "کلید تو ← گوگل ← MyMemory", en: "Your key → Google → MyMemory" },
  },
  {
    id: "custom",
    label: { fa: "کلید اختصاصی", en: "Your API key" },
    desc: { fa: "OpenAI، Gemini، Groq و…", en: "OpenAI, Gemini, Groq…" },
  },
];

export const engineName = (e: EngineUsed, lang: UiLangCode = "fa", providerName?: string): string => {
  if (e === "google") return lang === "fa" ? "گوگل" : "Google";
  if (e === "mymemory") return "MyMemory";
  return providerName ?? (lang === "fa" ? "مدل اختصاصی" : "Custom model");
};

/* ---------------- تشخیص زبان (بر اساس خط نوشتاری) ---------------- */

export function detectLang(text: string): string {
  const t = text.trim();
  if (!t) return "en";
  if (/[\u3040-\u30FF\u31F0-\u31FF]/.test(t)) return "ja"; // kana
  if (/[\uAC00-\uD7AF]/.test(t)) return "ko"; // hangul
  if (/[\u4E00-\u9FFF]/.test(t)) return "zh"; // cjk
  if (/[\u0400-\u04FF]/.test(t)) return "ru"; // cyrillic
  if (/[\u0900-\u097F]/.test(t)) return "hi"; // devanagari
  if (/[\u0E00-\u0E7F]/.test(t)) return "th"; // thai
  if (/[\u0600-\u06FF]/.test(t)) {
    // حروف مخصوص فارسی (گ چ پ ژ) + ی و ک فارسی + نیم‌فاصله
    return /[گچپژ\u06CC\u06A9\u200C]/.test(t) ? "fa" : "ar";
  }
  return "en";
}

/* ---------------- تکه‌تکه کردن متن‌های طولانی ---------------- */

export function chunkText(text: string, maxChunk = 450): string[] {
  const tokens = text.split(/(\n+)/);
  const out: string[] = [];
  for (const tok of tokens) {
    if (!tok) continue;
    if (/^\n+$/.test(tok)) {
      out.push(tok);
      continue;
    }
    const sentences = tok.match(/[^.!?…؟!;\n]+[.!?…؟!;]*\s*/g) ?? [tok];
    let cur = "";
    const flush = () => {
      if (cur.trim()) out.push(cur);
      cur = "";
    };
    for (let s of sentences) {
      if ((cur + s).length > maxChunk) {
        flush();
        while (s.length > maxChunk) {
          let cut = s.lastIndexOf(" ", maxChunk);
          if (cut < 60) cut = maxChunk;
          out.push(s.slice(0, cut));
          s = s.slice(cut);
        }
        cur = s;
      } else {
        cur += s;
      }
    }
    flush();
  }
  return out.filter((p) => p.length > 0);
}

/* ---------------- خطاها ---------------- */

export type ErrorKind = "quota" | "network" | "generic" | "blocked";

export class TranslateError extends Error {
  kind: ErrorKind;
  constructor(kind: ErrorKind) {
    super(kind);
    this.kind = kind;
  }
}

const isAbort = (e: unknown) => (e as Error)?.name === "AbortError";

function decodeHtml(s: string): string {
  const el = document.createElement("textarea");
  el.innerHTML = s;
  return el.value;
}

interface ChunkOut {
  text: string;
  detected: string;
  alternatives: string[];
}

/* ---------------- موتور گوگل ---------------- */

const GOOGLE_CHUNK = 800;

function normalizeGoogleCode(code: string): string {
  const c = code.toLowerCase();
  if (c === "iw") return "he";
  if (c === "jw") return "jv";
  if (c.startsWith("zh")) return "zh";
  return c.split("-")[0];
}

async function googleFetch(url: string, signal?: AbortSignal): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, { signal });
  } catch (e) {
    if (isAbort(e)) throw e;
    throw new TranslateError("network");
  }
  if (res.status === 429 || res.status === 403) throw new TranslateError("blocked");
  if (!res.ok) throw new TranslateError("generic");
  const data = await res.json().catch(() => null);
  if (data == null) throw new TranslateError("generic");
  return data;
}

/** endpoint اصلی: translate.googleapis.com (همان API افزونه‌های مرورگر) */
async function googlePrimary(
  q: string,
  sl: string,
  tl: string,
  signal?: AbortSignal
): Promise<ChunkOut> {
  const params = new URLSearchParams({ client: "gtx", sl, tl, dt: "t", q });
  params.append("dt", "at"); // ترجمه‌های جایگزین
  const data = (await googleFetch(
    `https://translate.googleapis.com/translate_a/single?${params.toString()}`,
    signal
  )) as unknown[];

  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new TranslateError("generic");
  }
  const text = (data[0] as unknown[])
    .map((seg) => (Array.isArray(seg) && typeof seg[0] === "string" ? seg[0] : ""))
    .join("");
  if (!text.trim()) throw new TranslateError("generic");

  const detected =
    typeof data[2] === "string" ? normalizeGoogleCode(data[2]) : sl;

  const alternatives: string[] = [];
  try {
    const alts = data[5];
    if (Array.isArray(alts) && alts.length === 1) {
      const list = (alts[0] as unknown[])?.[2];
      if (Array.isArray(list)) {
        for (const a of list) {
          if (Array.isArray(a) && typeof a[0] === "string") alternatives.push(a[0]);
        }
      }
    }
  } catch {
    /* ساختار جایگزین‌ها مهم نیست */
  }
  return { text, detected, alternatives };
}

/** endpoint پشتیبان: clients5.google.com (API دیکشنری کروم) */
async function googleSecondary(
  q: string,
  sl: string,
  tl: string,
  signal?: AbortSignal
): Promise<ChunkOut> {
  const params = new URLSearchParams({ client: "dict-chrome-ex", sl, tl, q });
  const data = await googleFetch(
    `https://clients5.google.com/translate_a/t?${params.toString()}`,
    signal
  );

  let text = "";
  let detected = sl;
  if (Array.isArray(data)) {
    const first = data[0];
    if (typeof first === "string") text = first;
    else if (Array.isArray(first)) {
      if (typeof first[0] === "string") text = first[0];
      if (typeof first[1] === "string") detected = normalizeGoogleCode(first[1]);
    }
  } else if (data && typeof data === "object") {
    const obj = data as { sentences?: { trans?: string }[]; src?: string };
    if (Array.isArray(obj.sentences)) {
      text = obj.sentences.map((s) => s.trans ?? "").join("");
    }
    if (typeof obj.src === "string") detected = normalizeGoogleCode(obj.src);
  }
  if (!text.trim()) throw new TranslateError("generic");
  return { text, detected, alternatives: [] };
}

async function googleChunk(
  q: string,
  sl: string,
  tl: string,
  signal?: AbortSignal
): Promise<ChunkOut> {
  try {
    return await googlePrimary(q, sl, tl, signal);
  } catch (e) {
    if (isAbort(e)) throw e;
    return googleSecondary(q, sl, tl, signal);
  }
}

/* ---------------- موتور MyMemory ---------------- */

const MYMEMORY_CHUNK = 450;

async function myMemoryChunk(
  q: string,
  src: string,
  tgt: string,
  email: string | undefined,
  signal: AbortSignal | undefined
): Promise<ChunkOut> {
  let url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    q
  )}&langpair=${src}|${tgt}`;
  if (email) url += `&de=${encodeURIComponent(email)}`;

  let res: Response;
  try {
    res = await fetch(url, { signal });
  } catch (e) {
    if (isAbort(e)) throw e;
    throw new TranslateError("network");
  }
  if (res.status === 429) throw new TranslateError("quota");
  if (!res.ok) throw new TranslateError("generic");

  const data = await res.json().catch(() => null);
  if (!data) throw new TranslateError("generic");

  const status = String(data.responseStatus ?? "");
  const translated: string = String(data.responseData?.translatedText ?? "");
  const details: string = String(data.responseDetails ?? "");

  if (
    /MYMEMORY WARNING|QUERY LENGTH LIMIT|NO QUERY SPECIFIED/i.test(translated) ||
    status === "403" ||
    /limit|quota|invalid email/i.test(details)
  ) {
    throw new TranslateError("quota");
  }
  if (!status.startsWith("2") || !translated) {
    throw new TranslateError("generic");
  }

  const alternatives: string[] = [];
  const matches: { translation?: string; quality?: string | number }[] =
    Array.isArray(data.matches) ? data.matches : [];
  for (const m of matches) {
    const t = decodeHtml(String(m.translation ?? "")).trim();
    if (t && Number(m.quality ?? 0) > 0) alternatives.push(t);
  }

  return { text: decodeHtml(translated), detected: src, alternatives };
}

/* ---------------- هماهنگ‌کننده ---------------- */

export interface TranslateResult {
  text: string;
  alternatives: string[];
  chunks: number;
  detected: string;
  engine: EngineUsed;
}

export interface TranslateOptions {
  engine?: Engine;
  email?: string;
  /** تنظیمات کلید اختصاصی (برای موتور custom و حالت auto) */
  api?: ApiSettings;
  signal?: AbortSignal;
  onProgress?: (done: number, total: number) => void;
  onFallback?: (failed: EngineUsed) => void;
}

const CUSTOM_CHUNK = 3500;

async function runEngine(
  engine: EngineUsed,
  text: string,
  src: string,
  tgt: string,
  opts: TranslateOptions
): Promise<TranslateResult> {
  const chunkSize =
    engine === "google" ? GOOGLE_CHUNK : engine === "custom" ? CUSTOM_CHUNK : MYMEMORY_CHUNK;
  const parts = chunkText(text, chunkSize);
  const total = parts.filter((p) => !/^\n+$/.test(p)).length || 1;
  opts.onProgress?.(0, total);

  const guessed = src === "auto" ? detectLang(text) : src;
  let detected = "";
  let done = 0;
  let firstAlternatives: string[] = [];
  const outParts: string[] = [];

  for (const p of parts) {
    if (/^\n+$/.test(p)) {
      outParts.push(p);
      continue;
    }
    let r: ChunkOut;
    if (engine === "google") {
      r = await googleChunk(p, src === "auto" ? "auto" : src, tgt, opts.signal);
    } else if (engine === "custom") {
      if (!opts.api || !hasActiveKey(opts.api)) throw new ProviderError("unauthorized");
      const out = await providerTranslate(opts.api, p, src, tgt, opts.signal);
      r = { text: out, detected: guessed, alternatives: [] };
    } else {
      r = await myMemoryChunk(p, guessed, tgt, opts.email || undefined, opts.signal);
    }

    if (!detected && r.detected && r.detected !== "auto") detected = r.detected;
    if (done === 0) firstAlternatives = r.alternatives;
    outParts.push(r.text);
    done += 1;
    opts.onProgress?.(done, total);
  }

  const full = outParts
    .join("")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // جایگزین‌ها فقط وقتی معنی دارند که متن یک تکه باشد
  const alternatives: string[] = [];
  if (total === 1) {
    const seen = new Set([full.toLowerCase()]);
    for (const a of firstAlternatives) {
      const k = a.trim().toLowerCase();
      if (!k || seen.has(k)) continue;
      seen.add(k);
      alternatives.push(a.trim());
      if (alternatives.length >= 3) break;
    }
  }

  return {
    text: full,
    alternatives,
    chunks: total,
    detected: detected || guessed,
    engine,
  };
}

export async function translateText(
  text: string,
  src: string,
  tgt: string,
  opts: TranslateOptions = {}
): Promise<TranslateResult> {
  const engine = opts.engine ?? "google";
  if (engine !== "auto") return runEngine(engine, text, src, tgt, opts);

  // حالت خودکار: کلید اختصاصی (اگر باشد) ← گوگل ← MyMemory
  const order: EngineUsed[] =
    opts.api && hasActiveKey(opts.api) ? ["custom", "google", "mymemory"] : ["google", "mymemory"];

  let lastErr: unknown = null;
  for (let i = 0; i < order.length; i++) {
    try {
      return await runEngine(order[i], text, src, tgt, opts);
    } catch (e) {
      if (isAbort(e)) throw e;
      lastErr = e;
      if (i < order.length - 1) opts.onFallback?.(order[i]);
    }
  }
  throw lastErr ?? new TranslateError("generic");
}

/* ---------------- گفتار (TTS / STT) ---------------- */

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export function speak(text: string, speechLang: string, onEnd?: () => void) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = speechLang;
    const prefix = speechLang.slice(0, 2).toLowerCase();
    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang.toLowerCase().startsWith(prefix));
    if (voice) u.voice = voice;
    u.onend = () => onEnd?.();
    u.onerror = () => onEnd?.();
    window.speechSynthesis.speak(u);
  } catch {
    onEnd?.();
  }
}

export function stopSpeak() {
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* noop */
  }
}

export function canListen(): boolean {
  return (
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
}

/* ---------------- ذخیره‌سازی ---------------- */

export interface HistoryItem {
  id: string;
  src: string;
  tgt: string;
  sourceText: string;
  translatedText: string;
  time: number;
  fav: boolean;
  engine?: EngineUsed;
}

const HKEY = "salam-tr-history-v1";
const SKEY = "salam-tr-stats-v1";

export function loadHistory(): HistoryItem[] {
  try {
    const v = JSON.parse(localStorage.getItem(HKEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function saveHistory(items: HistoryItem[]) {
  try {
    localStorage.setItem(HKEY, JSON.stringify(items.slice(0, 100)));
  } catch {
    /* noop */
  }
}

export interface Stats {
  translations: number;
  chars: number;
  day: string;
  dayCount: number;
}

export function loadStats(): Stats {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const s = JSON.parse(localStorage.getItem(SKEY) ?? "null");
    if (s && typeof s.translations === "number") {
      if (s.day !== today) {
        s.day = today;
        s.dayCount = 0;
      }
      return s as Stats;
    }
  } catch {
    /* noop */
  }
  return { translations: 0, chars: 0, day: today, dayCount: 0 };
}

export function recordTranslation(chars: number): Stats {
  const s = loadStats();
  s.translations += 1;
  s.chars += chars;
  s.dayCount += 1;
  try {
    localStorage.setItem(SKEY, JSON.stringify(s));
  } catch {
    /* noop */
  }
  return s;
}

export const store = {
  get(k: string, fb = ""): string {
    try {
      return localStorage.getItem(k) ?? fb;
    } catch {
      return fb;
    }
  },
  set(k: string, v: string) {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* noop */
    }
  },
};

export function timeAgo(ts: number, lang: UiLangCode = "fa"): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);

  if (lang === "en") {
    if (s < 60) return "just now";
    if (m < 60) return `${m} min ago`;
    if (h < 24) return `${h} h ago`;
    if (d === 1) return "yesterday";
    if (d < 30) return `${d} days ago`;
    return new Date(ts).toLocaleDateString("en-US");
  }
  if (s < 60) return "لحظاتی پیش";
  if (m < 60) return `${toFa(m)} دقیقه پیش`;
  if (h < 24) return `${toFa(h)} ساعت پیش`;
  if (d === 1) return "دیروز";
  if (d < 30) return `${toFa(d)} روز پیش`;
  return new Date(ts).toLocaleDateString("fa-IR");
}

export const QUICK_PHRASES: Record<UiLangCode, string[]> = {
  fa: [
    "سلام! حالت چطوره؟",
    "این قیمتش چنده؟",
    "لطفاً آروم‌تر صحبت کن.",
    "ببخشید، اینجا کجاست؟",
    "من گم شدم، می‌تونی کمکم کنی؟",
    "یک قهوه لطفاً.",
    "فردا ساعت چند همو ببینیم؟",
    "خیلی ممنون از کمکت!",
  ],
  en: [
    "Hello! How are you?",
    "How much does this cost?",
    "Could you speak more slowly, please?",
    "Excuse me, where am I?",
    "I'm lost, can you help me?",
    "One coffee, please.",
    "What time shall we meet tomorrow?",
    "Thank you so much for your help!",
  ],
};

export type ToastType = "success" | "error" | "info";
export type Notify = (msg: string, type?: ToastType) => void;
