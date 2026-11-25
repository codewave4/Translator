import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRightLeft,
  BookOpen,
  CalendarCheck,
  Check,
  ChevronDown,
  ClipboardPaste,
  Copy,
  Cpu,
  Eraser,
  FileDown,
  Globe,
  KeyRound,
  Languages,
  Loader2,
  Mail,
  Mic,
  Scale,
  Settings2,
  Sparkles,
  Type,
  Volume2,
  VolumeX,
  Wand2,
} from "lucide-react";
import LanguageSelect from "./LanguageSelect";
import HistoryPanel from "./HistoryPanel";
import ApiKeyPanel, { providerErrorMessage } from "./ApiKeyPanel";
import {
  ProviderError,
  activeModel,
  hasActiveKey,
  loadApiSettings,
  providerById,
  saveApiSettings,
  shortModel,
  type ApiSettings,
} from "../lib/providers";
import {
  ENGINES,
  LANGUAGES,
  QUICK_PHRASES,
  TranslateError,
  canListen,
  detectLang,
  engineName,
  isKnownLang,
  isWordLike,
  langByCode,
  loadHistory,
  loadStats,
  recordTranslation,
  saveHistory,
  speak,
  stopSpeak,
  store,
  translateText,
  type DictData,
  type Engine,
  type EngineUsed,
  type HistoryItem,
  type Notify,
  type Stats,
} from "../lib/translator";
import { useI18n } from "../lib/i18n";
import { exportTranslationPdf } from "../lib/pdf";
import { cn } from "../utils/cn";

const MAX_LEN = 5000;

const validCode = (c: string, allowAuto: boolean) =>
  (allowAuto && c === "auto") || LANGUAGES.some((l) => l.code === c);

const validEngine = (v: string): v is Engine =>
  ENGINES.some((e) => e.id === v);

/* لوگوی گوگل */
function GoogleLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#EA4335" d="M12 5.4c1.9 0 3.2.8 3.9 1.5l2.9-2.8C17 2.4 14.7 1.4 12 1.4 7.9 1.4 4.3 3.8 2.6 7.2l3.3 2.6c.8-2.5 3.2-4.4 6.1-4.4z" />
      <path fill="#4285F4" d="M22.2 12.2c0-.9-.1-1.5-.2-2.2H12v4h5.8c-.1 1-.8 2.4-2.2 3.4l3.2 2.5c1.9-1.8 3.4-4.4 3.4-7.7z" />
      <path fill="#FBBC05" d="M5.9 14.2c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2L2.6 7.2C1.8 8.7 1.4 10.3 1.4 12s.4 3.3 1.2 4.8l3.3-2.6z" />
      <path fill="#34A853" d="M12 22.6c2.9 0 5.3-.9 7-2.6l-3.2-2.5c-.9.6-2.1 1-3.8 1-2.9 0-5.3-1.9-6.1-4.4l-3.3 2.6c1.7 3.4 5.3 5.9 9.4 5.9z" />
    </svg>
  );
}

function EngineIcon({ id, className }: { id: Engine; className?: string }) {
  if (id === "google") return <GoogleLogo className={className} />;
  if (id === "custom") return <KeyRound className={cn("text-gold-500", className)} />;
  if (id === "mymemory")
    return (
      <span
        className={cn(
          "grid place-items-center rounded-md bg-gradient-to-br from-orange-400 to-rose-500 font-black text-white",
          className
        )}
        style={{ fontSize: "0.65em" }}
      >
        M
      </span>
    );
  return <Wand2 className={cn("text-violet-500", className)} />;
}

/* برچسب فارسی نقش‌های دستوری گوگل */
const POS_FA: Record<string, string> = {
  verb: "فعل",
  noun: "اسم",
  adjective: "صفت",
  adverb: "قید",
  pronoun: "ضمیر",
  preposition: "حرف اضافه",
  conjunction: "حرف ربط",
  interjection: "حرف ندا",
  article: "حرف تعریف",
  abbreviation: "اختصار",
  prefix: "پیشوند",
  suffix: "پسوند",
  determiner: "تعیین‌کننده",
  numeral: "عدد",
};

const posLabel = (pos: string, lang: "fa" | "en") =>
  lang === "fa"
    ? (POS_FA[pos.toLowerCase()] ?? pos)
    : pos.charAt(0).toUpperCase() + pos.slice(1);

/* کارت دیکشنری — بعد از ترجمه بسته است و با ضربه باز می‌شود */
function DictCard({
  dict,
  open,
  onToggle,
  exTr,
  wordLang,
}: {
  dict: DictData;
  open: boolean;
  onToggle: () => void;
  /** ترجمه جمله‌های مثال (با باز شدن کارت، تنبل‌وار گرفته می‌شود) */
  exTr: Record<number, string>;
  wordLang: string;
}) {
  const { t, lang } = useI18n();
  const [speakingWord, setSpeakingWord] = useState(false);
  const playWord = () => {
    if (speakingWord) {
      stopSpeak();
      setSpeakingWord(false);
      return;
    }
    setSpeakingWord(true);
    speak(dict.word, langByCode(wordLang).speech, () => setSpeakingWord(false));
  };
  return (
    <div className="mt-4 overflow-hidden rounded-[1.75rem] bg-white shadow-sm ring-1 ring-pine-900/10 dark:bg-white/[0.04] dark:ring-white/10">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-start transition hover:bg-pine-950/[0.03] dark:hover:bg-white/[0.03]"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-400 text-pine-950 shadow-sm">
          <BookOpen className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-black text-pine-950 dark:text-white">
            {t("dict_title")}
          </span>
          <span className="block truncate text-xs font-medium text-ink/45 dark:text-white/45">
            {t("dict_sub")}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-ink/40 transition-transform dark:text-white/40",
            open && "rotate-180"
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="border-t border-pine-900/8 px-4 pt-3 pb-4 dark:border-white/10">
              {/* واژه + پخش تلفظ */}
              <div className="flex items-center gap-2">
                <span dir="auto" className="text-lg font-black text-pine-950 dark:text-white">
                  {dict.word}
                </span>
                <button
                  type="button"
                  onClick={playWord}
                  title={t("btn_speak_src")}
                  aria-label={t("btn_speak_src")}
                  className="grid h-9 w-9 place-items-center rounded-xl bg-pine-950/5 text-pine-800 transition hover:bg-pine-950/10 active:scale-95 dark:bg-white/8 dark:text-white dark:hover:bg-white/15"
                >
                  {speakingWord ? (
                    <VolumeX className="h-4 w-4 text-clay-500" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* معنی‌ها بر اساس نقش دستوری */}
              {dict.groups.map((g, gi) => {
                const max = Math.max(...g.senses.map((s) => s.score), 0.0001);
                return (
                  <div key={gi} className="mt-4">
                    <span className="inline-block rounded-full bg-pine-950 px-3 py-1 text-xs font-black text-gold-400 dark:bg-white/10 dark:text-gold-300">
                      {posLabel(g.pos, lang)}
                    </span>
                    <div className="mt-2 space-y-2.5">
                      {g.senses.map((s, si) => (
                        <div key={si} className="flex items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <span dir="auto" className="text-[15px] leading-7 font-bold text-ink dark:text-white">
                              {s.term}
                            </span>
                            {s.reverse.length > 0 && (
                              <span
                                dir="ltr"
                                className="ms-2 inline-block text-[13px] font-medium text-ink/40 dark:text-white/40"
                              >
                                {s.reverse.slice(0, 4).join(", ")}
                              </span>
                            )}
                            {si === 0 && (
                              <span className="ms-2 inline-block rounded-full bg-emerald-500/12 px-2 py-0.5 align-middle text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                                {gi === 0 ? t("dict_most_common") : t("dict_common")}
                              </span>
                            )}
                          </div>
                          {si < 3 && s.score > 0 && (
                            <span className="mt-2.5 h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-pine-950/8 dark:bg-white/10">
                              <span
                                className="block h-full rounded-full bg-gradient-to-l from-clay-500 to-gold-400"
                                style={{
                                  width: `${Math.max(12, Math.round((s.score / max) * 100))}%`,
                                }}
                              />
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* مثال‌ها */}
              {dict.examples.length > 0 && (
                <div className="mt-5">
                  <p className="text-[13px] font-black text-ink/50 dark:text-white/50">
                    {t("dict_examples")}
                  </p>
                  <div className="mt-2 space-y-2">
                    {dict.examples.map((ex, i) => (
                      <div key={i} className="rounded-2xl bg-cream p-3 dark:bg-white/5">
                        <p dir="auto" className="text-sm leading-7 font-medium text-pine-900 dark:text-white">
                          {ex}
                        </p>
                        {exTr[i] && (
                          <p dir="auto" className="mt-0.5 text-sm leading-7 text-ink/55 dark:text-white/55">
                            {exTr[i]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* مترادف‌ها */}
              {dict.synonyms.length > 0 && (
                <div className="mt-5">
                  <p className="text-[13px] font-black text-ink/50 dark:text-white/50">
                    {t("dict_synonyms")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5" dir="auto">
                    {dict.synonyms.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-pine-950/5 px-3 py-1 text-[13px] font-bold text-pine-800 ring-1 ring-pine-900/8 dark:bg-white/8 dark:text-white/85 dark:ring-white/10"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* وضعیت اجرای یک موتور در مقایسه */
interface CmpRun {
  status: "loading" | "done" | "error";
  text?: string;
  ms?: number;
  error?: string;
}

/* کارت مقایسهٔ موتورها — بسته است؛ با باز شدن، هر سه موتور هم‌زمان ترجمه می‌کنند */
function CompareCard({
  open,
  onToggle,
  runs,
  usedEngine,
  output,
  hasKey,
  providerName,
  modelLabel,
  speakingText,
  onPick,
  onCopy,
  onSpeak,
  onSetupKey,
}: {
  open: boolean;
  onToggle: () => void;
  runs: Partial<Record<EngineUsed, CmpRun>>;
  usedEngine: EngineUsed | null;
  output: string;
  hasKey: boolean;
  providerName: string;
  modelLabel: string;
  speakingText: string | null;
  onPick: (eng: EngineUsed, text: string) => void;
  onCopy: (text: string) => void;
  onSpeak: (text: string) => void;
  onSetupKey: () => void;
}) {
  const { t, n, lang } = useI18n();
  const order: EngineUsed[] = ["google", "mymemory", "custom"];
  const nameOf = (eng: EngineUsed) =>
    eng === "custom" ? t("cmp_ai") : engineName(eng, lang);
  const subOf = (eng: EngineUsed) => {
    if (eng === "custom") return `${providerName} · ${modelLabel} · ${t("cmp_with_key")}`;
    return ENGINES.find((e) => e.id === eng)?.desc[lang] ?? "";
  };
  const smallBtn =
    "grid h-9 w-9 place-items-center rounded-xl bg-pine-950/5 text-pine-800 transition hover:bg-pine-950/10 active:scale-95 dark:bg-white/8 dark:text-white dark:hover:bg-white/15";
  return (
    <div className="mt-4 overflow-hidden rounded-[1.75rem] bg-white shadow-sm ring-1 ring-pine-900/10 dark:bg-white/[0.04] dark:ring-white/10">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-start transition hover:bg-pine-950/[0.03] dark:hover:bg-white/[0.03]"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-400 text-pine-950 shadow-sm">
          <Scale className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-black text-pine-950 dark:text-white">
            {t("cmp_title")}
          </span>
          <span className="block truncate text-xs font-medium text-ink/45 dark:text-white/45">
            {t("cmp_sub")}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-ink/40 transition-transform dark:text-white/40",
            open && "rotate-180"
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-pine-900/8 p-3 sm:p-4 dark:border-white/10">
              {order.map((eng) => {
                const run = runs[eng];
                const noKey = eng === "custom" && !hasKey;
                const isCurrent =
                  !noKey &&
                  eng === usedEngine &&
                  run?.status === "done" &&
                  run.text?.trim() === output.trim();
                return (
                  <div
                    key={eng}
                    className={cn(
                      "rounded-3xl bg-cream p-3.5 ring-1 dark:bg-white/[0.03]",
                      isCurrent
                        ? "ring-2 ring-emerald-500"
                        : eng === "custom"
                          ? "ring-gold-400/40 dark:ring-gold-400/30"
                          : "ring-pine-900/8 dark:ring-white/10"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-pine-900/8 dark:bg-white/10 dark:ring-white/10">
                        <EngineIcon id={eng} className="h-[18px] w-[18px]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-black text-pine-950 dark:text-white">
                          {nameOf(eng)}
                        </span>
                        <span className="block truncate text-[11px] font-medium text-ink/45 dark:text-white/45" dir="auto">
                          {subOf(eng)}
                        </span>
                      </span>
                      {run?.status === "done" && typeof run.ms === "number" && (
                        <span className="shrink-0 rounded-full bg-pine-950/5 px-2.5 py-1 text-[11px] font-black text-ink/55 ring-1 ring-pine-900/8 dark:bg-white/8 dark:text-white/55 dark:ring-white/10">
                          {t("cmp_time", { t: n((run.ms / 1000).toFixed(1)) })}
                        </span>
                      )}
                    </div>

                    {noKey ? (
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="text-sm font-bold text-ink/50 dark:text-white/50">
                          {t("cmp_need_key")}
                        </span>
                        <button
                          type="button"
                          onClick={onSetupKey}
                          className="ms-auto shrink-0 rounded-xl bg-pine-950 px-4 py-2 text-[13px] font-black text-white transition hover:bg-clay-600 active:scale-95 dark:bg-gold-400 dark:text-pine-950 dark:hover:bg-gold-500"
                        >
                          {t("cmp_setup_key")}
                        </button>
                      </div>
                    ) : !run || run.status === "loading" ? (
                      <div className="mt-3 space-y-2.5">
                        <div className="skeleton h-4 w-11/12 rounded-lg bg-pine-950/8 dark:bg-white/8" />
                        <div className="skeleton h-4 w-2/3 rounded-lg bg-pine-950/8 dark:bg-white/8" />
                      </div>
                    ) : run.status === "error" ? (
                      <p className="mt-2 text-sm leading-7 font-bold text-red-500">
                        {run.error ?? t("cmp_failed")}
                      </p>
                    ) : (
                      <>
                        <p dir="auto" className="mt-2 text-[15px] leading-8 font-medium whitespace-pre-wrap text-ink dark:text-white">
                          {run.text}
                        </p>
                        <div className="mt-2.5 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => run.text && onCopy(run.text)}
                            title={t("btn_copy_tr")}
                            aria-label={t("btn_copy_tr")}
                            className={smallBtn}
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => run.text && onSpeak(run.text)}
                            title={t("btn_speak_tgt")}
                            aria-label={t("btn_speak_tgt")}
                            className={smallBtn}
                          >
                            {speakingText === run.text ? (
                              <VolumeX className="h-4 w-4 text-clay-500" />
                            ) : (
                              <Volume2 className="h-4 w-4" />
                            )}
                          </button>
                          {isCurrent ? (
                            <span className="ms-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/12 px-3 py-1.5 text-[12px] font-black text-emerald-600 ring-1 ring-emerald-500/25 dark:text-emerald-400">
                              <Check className="h-3.5 w-3.5" strokeWidth={3} />
                              {t("cmp_current")}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => run.text && onPick(eng, run.text)}
                              className="ms-auto shrink-0 rounded-xl bg-clay-500 px-4 py-2 text-[13px] font-black text-white shadow-lg shadow-clay-500/25 transition hover:bg-clay-600 active:scale-95"
                            >
                              {t("cmp_pick")}
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Translator({
  notify,
  openApiSignal = 0,
}: {
  notify: Notify;
  /** هر بار که عوض شود، موتور «کلید اختصاصی» انتخاب و پنل کلید باز می‌شود (از تب چت) */
  openApiSignal?: number;
}) {
  const i18n = useI18n();
  const { t, n, ln, lang } = i18n;

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [src, setSrc] = useState(() => {
    const v = store.get("salam-tr-src", "auto");
    return validCode(v, true) ? v : "auto";
  });
  const [tgt, setTgt] = useState(() => {
    const v = store.get("salam-tr-tgt", "en");
    return validCode(v, false) ? v : "en";
  });
  const [detected, setDetected] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 1 });
  const [engine, setEngine] = useState<Engine>(() => {
    const v = store.get("salam-tr-engine", "google");
    return validEngine(v) ? v : "google";
  });
  const [usedEngine, setUsedEngine] = useState<EngineUsed | null>(null);
  const [api, setApi] = useState<ApiSettings>(loadApiSettings);
  const [showApi, setShowApi] = useState(false);
  const [auto, setAuto] = useState(() => store.get("salam-tr-auto", "1") === "1");
  const [email, setEmail] = useState(() => store.get("salam-tr-email", ""));
  const [emailDraft, setEmailDraft] = useState(() => store.get("salam-tr-email", ""));
  const [showEmail, setShowEmail] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);
  const [stats, setStats] = useState<Stats>(loadStats);
  const [speaking, setSpeaking] = useState<"src" | "tgt" | null>(null);
  const [listening, setListening] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  /* دیکشنری و مقایسهٔ موتورها — هر دو به ترجمهٔ فعلی وابسته‌اند */
  const [dict, setDict] = useState<DictData | undefined>(undefined);
  const [dictOpen, setDictOpen] = useState(false);
  const [dictExTr, setDictExTr] = useState<Record<number, string>>({});
  const [cmpOpen, setCmpOpen] = useState(false);
  const [cmpRuns, setCmpRuns] = useState<Partial<Record<EngineUsed, CmpRun>>>({});
  const [cmpKey, setCmpKey] = useState("");
  const [cmpSpeaking, setCmpSpeaking] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const cmpAbortRef = useRef<AbortController | null>(null);
  const recRef = useRef<any>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => store.set("salam-tr-src", src), [src]);
  useEffect(() => store.set("salam-tr-tgt", tgt), [tgt]);
  useEffect(() => store.set("salam-tr-auto", auto ? "1" : "0"), [auto]);
  useEffect(() => store.set("salam-tr-engine", engine), [engine]);
  useEffect(() => saveApiSettings(api), [api]);
  // با انتخاب «کلید اختصاصی» بدون کلید ذخیره‌شده، پنل خودکار باز شود
  useEffect(() => {
    if (engine === "custom" && !hasActiveKey(api)) setShowApi(true);
  }, [engine, api]);
  // درخواست از تب چت: موتور «کلید اختصاصی» + باز کردن پنل
  useEffect(() => {
    if (openApiSignal > 0) {
      setEngine("custom");
      setShowApi(true);
    }
  }, [openApiSignal]);
  useEffect(
    () => () => {
      abortRef.current?.abort();
      cmpAbortRef.current?.abort();
      stopSpeak();
      try {
        recRef.current?.stop?.();
      } catch {
        /* noop */
      }
    },
    []
  );

  // auto-grow textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(Math.max(el.scrollHeight, 170), 340) + "px";
  }, [input]);

  /** افزودن به تاریخچه؛ ترجمهٔ تکراریِ پشت‌سرهم دوباره ثبت نمی‌شود.
      با replaceTop، متنِ رکوردِ بالای فهرست جایگزین می‌شود (انتخاب از مقایسه). */
  const addToHistory = (
    sourceText: string,
    translatedText: string,
    histSrc: string,
    target: string,
    eng: EngineUsed,
    replaceTop = false
  ) => {
    setHistory((prev) => {
      const sameTop =
        prev[0]?.sourceText === sourceText.slice(0, 500) &&
        prev[0]?.src === histSrc &&
        prev[0]?.tgt === target;
      if (sameTop && !replaceTop) return prev;
      const item: HistoryItem = {
        id:
          sameTop && replaceTop
            ? prev[0].id
            : typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : String(Date.now()),
        src: histSrc,
        tgt: target,
        sourceText: sourceText.slice(0, 500),
        translatedText: translatedText.slice(0, 500),
        time: Date.now(),
        fav: sameTop && replaceTop ? prev[0].fav : false,
        engine: eng,
      };
      const next = [item, ...(sameTop && replaceTop ? prev.slice(1) : prev)].slice(0, 100);
      saveHistory(next);
      return next;
    });
  };

  const doTranslate = useCallback(
    async (text?: string, s?: string, tg?: string) => {
      const value = (text ?? input).trim();
      if (!value) {
        setOutput("");
        setAlternatives([]);
        setDetected("");
        setDict(undefined);
        setDictOpen(false);
        setCmpOpen(false);
        return;
      }
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const source = s ?? src; // ممکن است "auto" باشد
      const guess = source === "auto" ? detectLang(value) : source;
      if (source !== "auto") setDetected("");

      let target = tg ?? tgt;
      if (guess === target) {
        target = target === "fa" ? "en" : "fa";
        setTgt(target);
        notify(t("n_target_changed", { lang: ln(target) }), "info");
      }

      const providerName = providerById(api.provider).name;
      if (engine === "custom" && !hasActiveKey(api)) {
        notify(t("api_need_key"), "error");
        setShowApi(true);
        return;
      }

      setLoading(true);
      setProgress({ done: 0, total: 1 });
      try {
        const res = await translateText(value, source, target, {
          engine,
          email: email || undefined,
          api,
          signal: ctrl.signal,
          onProgress: (done, total) => setProgress({ done, total }),
          onFallback: (failed) =>
            notify(
              failed === "custom"
                ? t("n_fallback_custom", { provider: providerName })
                : t("n_fallback", { engine: engineName(failed, lang) }),
              "info"
            ),
        });
        setOutput(res.text);
        setAlternatives(res.alternatives);
        setUsedEngine(res.engine);
        setDict(res.dict);
        setDictOpen(false);
        setDictExTr({});
        setCmpRuns({});
        setCmpKey("");
        setCmpOpen(false);
        // دادهٔ دیکشنری فقط از گوگل می‌آید؛ اگر موتور اصلی گوگل نبود و ورودی واژه‌ای کوتاه
        // است، دیکشنری جداگانه و بی‌صدا از گوگل گرفته می‌شود تا کارت همیشه بیاید
        if (!res.dict && res.engine !== "google" && isWordLike(value)) {
          void translateText(value, source, target, {
            engine: "google",
            email: email || undefined,
            signal: ctrl.signal,
          })
            .then((g) => {
              if (abortRef.current === ctrl && g.dict) setDict(g.dict);
            })
            .catch(() => {
              /* دیکشنری قابلیت اضافه است؛ خطایش بی‌صدا رد می‌شود */
            });
        }
        if (source === "auto") setDetected(res.detected);
        setStats(recordTranslation(value.length));

        const histSrc = isKnownLang(res.detected) ? res.detected : "auto";
        addToHistory(value, res.text, histSrc, target, res.engine);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        if (e instanceof ProviderError) {
          notify(providerErrorMessage(e, t, providerName), "error");
          if (e.kind === "unauthorized") setShowApi(true);
        } else if (e instanceof TranslateError && e.kind === "quota") {
          notify(t("n_quota"), "error");
          setShowEmail(true);
        } else if (e instanceof TranslateError && e.kind === "blocked") {
          notify(t("n_blocked"), "error");
        } else if (e instanceof TranslateError && e.kind === "network") {
          notify(t("n_network"), "error");
        } else {
          notify(t("n_generic"), "error");
        }
      } finally {
        if (abortRef.current === ctrl) setLoading(false);
      }
    },
    [input, src, tgt, engine, email, api, notify, t, ln, lang]
  );

  // auto translate (debounced)
  useEffect(() => {
    if (!auto) return;
    if (!input.trim()) {
      setOutput("");
      setAlternatives([]);
      setDetected("");
      setDict(undefined);
      return;
    }
    const tm = setTimeout(() => {
      void doTranslate();
    }, 900);
    return () => clearTimeout(tm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, src, tgt, auto, engine]);

  const swap = () => {
    stopSpeak();
    setSpeaking(null);
    if (src === "auto") {
      const newTgt =
        detected && detected !== tgt && isKnownLang(detected)
          ? detected
          : tgt === "fa"
            ? "en"
            : "fa";
      setSrc(tgt);
      setTgt(newTgt);
    } else {
      setSrc(tgt);
      setTgt(src);
    }
    if (output) {
      setInput(output);
      setOutput("");
      setAlternatives([]);
      setDict(undefined);
      setCmpRuns({});
      setCmpOpen(false);
    }
  };

  const toggleListen = () => {
    if (listening) {
      try {
        recRef.current?.stop?.();
      } catch {
        /* noop */
      }
      return;
    }
    if (!canListen()) {
      notify(t("n_no_stt"), "error");
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    recRef.current = rec;
    rec.lang =
      src === "auto" ? (lang === "fa" ? "fa-IR" : "en-US") : langByCode(src).speech;
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
      }
      if (final.trim()) {
        setInput((prev) => (prev ? `${prev} ${final.trim()}` : final.trim()).slice(0, MAX_LEN));
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    try {
      rec.start();
      setListening(true);
      notify(t("n_listening"), "info");
    } catch {
      setListening(false);
    }
  };

  const toggleSpeak = (which: "src" | "tgt") => {
    if (speaking === which) {
      stopSpeak();
      setSpeaking(null);
      return;
    }
    const text = which === "src" ? input : output;
    if (!text.trim()) return;
    const code =
      which === "src"
        ? src === "auto"
          ? detected || detectLang(text)
          : src
        : tgt;
    setSpeaking(which);
    speak(text, langByCode(code).speech, () => setSpeaking(null));
  };

  const copyText = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    notify(t("n_copied"), "success");
    setTimeout(() => setCopied(false), 1500);
  };

  const paste = async () => {
    try {
      const txt = await navigator.clipboard.readText();
      if (txt) {
        setInput((prev) => `${prev} ${txt}`.trim().slice(0, MAX_LEN));
        inputRef.current?.focus();
      } else {
        notify(t("n_clip_empty"), "info");
      }
    } catch {
      notify(t("n_clip_denied"), "error");
    }
  };

  const exportPdf = async () => {
    if (!output.trim() || pdfBusy) return;
    setPdfBusy(true);
    try {
      await exportTranslationPdf({
        sourceText: input,
        translatedText: output,
        src: src === "auto" ? detected || detectLang(input) : src,
        tgt,
        engine: usedEngine ?? "google",
        providerName: providerById(api.provider).name,
        modelName: shortModel(activeModel(api)),
        i18n,
      });
      notify(t("n_pdf_done"), "success");
    } catch {
      notify(t("n_pdf_err"), "error");
    } finally {
      setPdfBusy(false);
    }
  };

  const saveEmail = () => {
    const v = emailDraft.trim();
    if (v && !/^\S+@\S+\.\S+$/.test(v)) {
      notify(t("n_email_invalid"), "error");
      return;
    }
    setEmail(v);
    store.set("salam-tr-email", v);
    notify(v ? t("n_email_saved") : t("n_email_removed"), "success");
  };

  /* ---------- دیکشنری: ترجمهٔ تنبل‌وار مثال‌ها هنگام باز شدن کارت ---------- */
  const toggleDict = () => {
    setDictOpen((open) => {
      if (!open && dict && dict.examples.length > 0 && Object.keys(dictExTr).length === 0) {
        const srcCode =
          detected && isKnownLang(detected)
            ? detected
            : src === "auto"
              ? detectLang(dict.word)
              : src;
        dict.examples.forEach((ex, i) => {
          void translateText(ex, srcCode, tgt, { engine: "google" })
            .then((r) => setDictExTr((prev) => ({ ...prev, [i]: r.text })))
            .catch(() => {
              /* مثال بدون ترجمه می‌ماند */
            });
        });
      }
      return !open;
    });
  };

  /* ---------- مقایسهٔ موتورها ---------- */
  const runCompare = useCallback(async () => {
    const value = input.trim();
    if (!value || !output) return;
    const sig = `${value}|${src}|${tgt}|${email}|${api.provider}|${activeModel(api)}|${hasActiveKey(api) ? 1 : 0}`;
    if (sig === cmpKey) return;
    setCmpKey(sig);
    cmpAbortRef.current?.abort();
    const ctrl = new AbortController();
    cmpAbortRef.current = ctrl;
    const engines: EngineUsed[] = hasActiveKey(api)
      ? ["google", "mymemory", "custom"]
      : ["google", "mymemory"];
    const initial: Partial<Record<EngineUsed, CmpRun>> = {};
    engines.forEach((e) => (initial[e] = { status: "loading" }));
    setCmpRuns(initial);
    await Promise.all(
      engines.map(async (eng) => {
        const started = performance.now();
        try {
          const r = await translateText(value, src, tgt, {
            engine: eng,
            email: email || undefined,
            api,
            signal: ctrl.signal,
          });
          if (ctrl.signal.aborted) return;
          if (r.engine !== eng) {
            // موتور ثابت جواب نداده و زنجیرهٔ پشتیبان ترجمه کرده؛ نتیجه را به نام آن موتور نشان نمی‌دهیم
            setCmpRuns((prev) => ({
              ...prev,
              [eng]: {
                status: "error",
                error:
                  eng === "custom"
                    ? t("n_fallback_custom", { provider: providerById(api.provider).name })
                    : t("cmp_failed"),
              },
            }));
            return;
          }
          setCmpRuns((prev) => ({
            ...prev,
            [eng]: { status: "done", text: r.text, ms: performance.now() - started },
          }));
        } catch (e) {
          if ((e as Error).name === "AbortError" || ctrl.signal.aborted) return;
          setCmpRuns((prev) => ({
            ...prev,
            [eng]: {
              status: "error",
              error:
                e instanceof ProviderError
                  ? providerErrorMessage(e, t, providerById(api.provider).name)
                  : t("cmp_failed"),
            },
          }));
        }
      })
    );
  }, [input, output, src, tgt, email, api, cmpKey, t]);

  const toggleCompare = () => {
    if (!cmpOpen) void runCompare();
    setCmpOpen((v) => !v);
  };

  /** انتخاب یکی از ترجمه‌های مقایسه به‌عنوان ترجمهٔ اصلی */
  const pickCompared = (eng: EngineUsed, text: string) => {
    setOutput(text);
    setUsedEngine(eng);
    setAlternatives([]);
    const value = input.trim();
    if (!value) return;
    const histSrc =
      detected && isKnownLang(detected) ? detected : src === "auto" ? "auto" : src;
    addToHistory(value, text, histSrc, tgt, eng, true);
    setStats(recordTranslation(value.length));
  };

  const speakCmp = (text: string) => {
    if (cmpSpeaking === text) {
      stopSpeak();
      setCmpSpeaking(null);
      return;
    }
    setCmpSpeaking(text);
    speak(text, langByCode(tgt).speech, () => setCmpSpeaking(null));
  };

  const restore = (item: HistoryItem) => {
    stopSpeak();
    setSpeaking(null);
    setSrc(item.src);
    setTgt(item.tgt);
    setInput(item.sourceText);
    void doTranslate(item.sourceText, item.src, item.tgt);
    document.getElementById("translator")?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleFav = (id: string) =>
    setHistory((prev) => {
      const next = prev.map((h) => (h.id === id ? { ...h, fav: !h.fav } : h));
      saveHistory(next);
      return next;
    });

  const deleteItem = (id: string) =>
    setHistory((prev) => {
      const next = prev.filter((h) => h.id !== id);
      saveHistory(next);
      return next;
    });

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
    notify(t("n_history_cleared"), "success");
  };

  const words = useMemo(
    () => (input.trim() ? input.trim().split(/\s+/).length : 0),
    [input]
  );

  const statCards = [
    { icon: CalendarCheck, value: n(stats.dayCount), label: t("stat_today") },
    { icon: Languages, value: n(stats.translations), label: t("stat_total") },
    { icon: Type, value: n(stats.chars.toLocaleString("en-US")), label: t("stat_chars") },
    { icon: Globe, value: n(LANGUAGES.length), label: t("stat_langs") },
  ];

  const iconBtn =
    "grid h-10 w-10 place-items-center rounded-xl transition active:scale-95 disabled:opacity-40";

  return (
    <section id="translator" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-8 sm:px-6">
      {/* quick phrases */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-[13px] font-black text-ink/50 dark:text-white/50">
          <Sparkles className="h-4 w-4 text-gold-500" />
          {t("try_it")}
        </span>
        {QUICK_PHRASES[lang].slice(0, 5).map((p) => (
          <button
            key={p}
            onClick={() => setInput(p)}
            className="rounded-full bg-white px-4 py-1.5 text-[13px] font-bold text-pine-800 shadow-sm ring-1 ring-pine-900/10 transition hover:-translate-y-0.5 hover:bg-pine-950 hover:text-white dark:bg-white/6 dark:text-white/80 dark:ring-white/10 dark:hover:bg-gold-400 dark:hover:text-pine-950"
          >
            {p}
          </button>
        ))}
      </div>

      {/* main card */}
      <div className="mt-4 rounded-[1.75rem] bg-white shadow-[0_25px_70px_-25px_rgba(11,36,34,0.45)] ring-1 ring-pine-900/10 dark:bg-white/[0.04] dark:ring-white/10 dark:shadow-[0_25px_70px_-25px_rgba(0,0,0,0.8)]">
        {/* language bar */}
        <div className="flex items-center gap-2 border-b border-pine-900/8 p-3 sm:gap-3 sm:p-4 dark:border-white/10">
          <LanguageSelect value={src} onChange={setSrc} allowAuto />
          <motion.button
            whileTap={{ rotate: 180, scale: 0.9 }}
            onClick={swap}
            title={t("swap_langs")}
            aria-label={t("swap_langs")}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-clay-500 text-white shadow-lg shadow-clay-500/25 transition hover:bg-clay-600 sm:h-12 sm:w-12"
          >
            <ArrowRightLeft className="h-5 w-5" />
          </motion.button>
          <LanguageSelect value={tgt} onChange={setTgt} />
        </div>

        {/* engine selector */}
        <div className="border-b border-pine-900/8 px-3 py-3 sm:px-4 dark:border-white/10">
          <div className="flex items-center gap-1.5 text-[13px] font-black text-ink/50 dark:text-white/50">
            <Cpu className="h-4 w-4 text-emerald-500" />
            {t("engine_title")}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ENGINES.map((e) => {
              const active = engine === e.id;
              const isCustom = e.id === "custom";
              const keyReady = hasActiveKey(api);
              const desc =
                isCustom && keyReady
                  ? t("api_desc_on", {
                      provider: providerById(api.provider).name,
                      model: shortModel(activeModel(api)),
                    })
                  : e.desc[lang];
              return (
                <div
                  key={e.id}
                  className={cn(
                    "relative flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 transition",
                    active
                      ? "bg-emerald-500/10 ring-2 ring-emerald-500 dark:bg-emerald-400/10"
                      : "bg-cream ring-1 ring-pine-900/8 hover:bg-sand dark:bg-white/6 dark:ring-white/10 dark:hover:bg-white/10"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setEngine(e.id)}
                    title={desc}
                    aria-pressed={active}
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-start active:scale-[0.98]"
                  >
                    <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-pine-900/8 dark:bg-white/10 dark:ring-white/10">
                      <EngineIcon id={e.id} className="h-4 w-4" />
                      {isCustom && keyReady && (
                        <span className="absolute -end-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-pine-950" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block truncate text-[14px] font-black",
                          active ? "text-pine-950 dark:text-white" : "text-ink/75 dark:text-white/75"
                        )}
                      >
                        {e.label[lang]}
                      </span>
                      <span
                        className="hidden truncate text-[11px] font-medium text-ink/45 sm:block dark:text-white/45"
                        dir={isCustom && keyReady ? "ltr" : undefined}
                      >
                        {desc}
                      </span>
                    </span>
                  </button>
                  {isCustom ? (
                    <button
                      type="button"
                      onClick={() => setShowApi((v) => !v)}
                      title={t("api_panel_title")}
                      aria-label={t("api_panel_title")}
                      aria-expanded={showApi}
                      className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition active:scale-95",
                        showApi
                          ? "bg-pine-950 text-white dark:bg-gold-400 dark:text-pine-950"
                          : "text-ink/50 hover:bg-pine-950/8 hover:text-pine-950 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white"
                      )}
                    >
                      <Settings2 className="h-4 w-4" />
                    </button>
                  ) : (
                    active && <Check className="h-4 w-4 shrink-0 text-emerald-500" strokeWidth={3} />
                  )}
                </div>
              );
            })}
          </div>

          {/* پنل کلید اختصاصی */}
          <AnimatePresence initial={false}>
            {showApi && <ApiKeyPanel settings={api} onChange={setApi} notify={notify} />}
          </AnimatePresence>
        </div>

        {/* panes */}
        <div className="grid lg:grid-cols-2">
          {/* source */}
          <div className="flex flex-col border-b border-pine-900/8 p-4 sm:p-5 lg:border-b-0 dark:border-white/10">
            <div className="flex min-h-8 items-center justify-between gap-2">
              <span className="text-[13px] font-black text-ink/45 dark:text-white/45">
                {t("source_label")}
              </span>
              <AnimatePresence>
                {src === "auto" && detected && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="rounded-full bg-clay-500/10 px-3 py-1 text-xs font-black text-clay-600 dark:text-clay-400"
                  >
                    {t("detected", { lang: ln(detected) })}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_LEN))}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  void doTranslate();
                }
              }}
              dir="auto"
              rows={5}
              placeholder={t("input_placeholder")}
              className="mt-2 max-h-[340px] min-h-[170px] w-full resize-none bg-transparent text-[17px] leading-9 font-medium text-ink outline-none placeholder:text-ink/30 dark:text-white dark:placeholder:text-white/30"
            />
            <div className="mt-3 flex items-center justify-between gap-2">
              <span
                className={cn(
                  "text-xs font-bold",
                  input.length > 4900
                    ? "text-red-500"
                    : input.length > 4500
                      ? "text-amber-500"
                      : "text-ink/40 dark:text-white/40"
                )}
              >
                {t("counter", {
                  chars: n(input.length.toLocaleString("en-US")),
                  max: n(MAX_LEN.toLocaleString("en-US")),
                  words: n(words),
                })}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleListen}
                  title={t("btn_mic")}
                  aria-label={t("btn_mic")}
                  className={cn(
                    iconBtn,
                    listening
                      ? "animate-pulse bg-red-500 text-white shadow-lg shadow-red-500/30"
                      : "bg-pine-950/5 text-pine-800 hover:bg-pine-950/10 dark:bg-white/8 dark:text-white dark:hover:bg-white/15"
                  )}
                >
                  <Mic className="h-[18px] w-[18px]" />
                </button>
                <button
                  onClick={paste}
                  title={t("btn_paste")}
                  aria-label={t("btn_paste")}
                  className={cn(iconBtn, "bg-pine-950/5 text-pine-800 hover:bg-pine-950/10 dark:bg-white/8 dark:text-white dark:hover:bg-white/15")}
                >
                  <ClipboardPaste className="h-[18px] w-[18px]" />
                </button>
                <button
                  onClick={() => toggleSpeak("src")}
                  disabled={!input.trim()}
                  title={t("btn_speak_src")}
                  aria-label={t("btn_speak_src")}
                  className={cn(iconBtn, "bg-pine-950/5 text-pine-800 hover:bg-pine-950/10 dark:bg-white/8 dark:text-white dark:hover:bg-white/15")}
                >
                  {speaking === "src" ? (
                    <VolumeX className="h-[18px] w-[18px] text-clay-500" />
                  ) : (
                    <Volume2 className="h-[18px] w-[18px]" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setInput("");
                    setOutput("");
                    setAlternatives([]);
                    setDict(undefined);
                    setCmpRuns({});
                    setCmpOpen(false);
                    inputRef.current?.focus();
                  }}
                  disabled={!input}
                  title={t("btn_clear")}
                  aria-label={t("btn_clear")}
                  className={cn(iconBtn, "bg-pine-950/5 text-pine-800 hover:bg-red-500 hover:text-white dark:bg-white/8 dark:text-white dark:hover:bg-red-500")}
                >
                  <Eraser className="h-[18px] w-[18px]" />
                </button>
              </div>
            </div>
          </div>

          {/* target */}
          <div className="flex flex-col border-pine-900/8 p-4 sm:p-5 lg:border-s dark:border-white/10">
            <div className="flex min-h-8 items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2 text-[13px] font-black text-ink/45 dark:text-white/45">
                <span className="truncate">{t("target_label", { lang: ln(tgt) })}</span>
                {usedEngine && output && !loading && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-black text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400">
                    <EngineIcon id={usedEngine} className="h-3 w-3" />
                    {t("via_engine", {
                      engine: engineName(usedEngine, lang, providerById(api.provider).name),
                    })}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => void exportPdf()}
                  disabled={!output.trim() || pdfBusy}
                  title={t("btn_pdf")}
                  aria-label={t("btn_pdf")}
                  className={cn(iconBtn, "h-9 w-9 bg-pine-950/5 text-pine-800 hover:bg-pine-950/10 dark:bg-white/8 dark:text-white dark:hover:bg-white/15")}
                >
                  {pdfBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => toggleSpeak("tgt")}
                  disabled={!output.trim()}
                  title={t("btn_speak_tgt")}
                  aria-label={t("btn_speak_tgt")}
                  className={cn(iconBtn, "h-9 w-9 bg-pine-950/5 text-pine-800 hover:bg-pine-950/10 dark:bg-white/8 dark:text-white dark:hover:bg-white/15")}
                >
                  {speaking === "tgt" ? (
                    <VolumeX className="h-4 w-4 text-clay-500" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => void copyText(output)}
                  disabled={!output.trim()}
                  title={t("btn_copy_tr")}
                  aria-label={t("btn_copy_tr")}
                  className={cn(iconBtn, "h-9 w-9 bg-pine-950/5 text-pine-800 hover:bg-pine-950/10 dark:bg-white/8 dark:text-white dark:hover:bg-white/15")}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div dir="auto" className="mt-2 min-h-[170px] flex-1 py-1 text-[17px] leading-9 font-medium">
              {loading && !output ? (
                <div className="space-y-3 pt-2">
                  <div className="skeleton h-4 w-11/12 rounded-lg bg-pine-950/8 dark:bg-white/8" />
                  <div className="skeleton h-4 w-3/4 rounded-lg bg-pine-950/8 dark:bg-white/8" />
                  <div className="skeleton h-4 w-5/6 rounded-lg bg-pine-950/8 dark:bg-white/8" />
                </div>
              ) : output ? (
                <p className="whitespace-pre-wrap text-ink dark:text-white">{output}</p>
              ) : (
                <p className="pt-1 text-ink/30 dark:text-white/30">
                  {t("output_placeholder")}
                </p>
              )}
            </div>

            {loading && progress.total > 1 && (
              <div className="mt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-pine-950/8 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-clay-500 to-gold-400 transition-all duration-300"
                    style={{ width: `${(progress.done / progress.total) * 100}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs font-bold text-ink/45 dark:text-white/45">
                  {t("long_progress", { done: n(progress.done), total: n(progress.total) })}
                </p>
              </div>
            )}

            <AnimatePresence>
              {alternatives.length > 0 && !loading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 rounded-2xl bg-cream p-3 dark:bg-white/5">
                    <p className="px-1 text-xs font-black text-ink/45 dark:text-white/45">
                      {t("alternatives_title")}
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {alternatives.map((a, i) => (
                        <button
                          key={i}
                          onClick={() => void copyText(a)}
                          dir="auto"
                          className="block w-full rounded-xl bg-white px-3 py-2 text-start text-sm font-medium leading-7 text-pine-900 shadow-sm ring-1 ring-pine-900/8 transition hover:ring-clay-500/40 dark:bg-white/8 dark:text-white dark:ring-white/10"
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* action bar */}
        <div className="flex flex-col gap-3 border-t border-pine-900/8 p-4 sm:flex-row sm:items-center dark:border-white/10">
          <button
            onClick={() => setAuto((v) => !v)}
            role="switch"
            aria-checked={auto}
            className="flex items-center gap-2.5 text-sm font-black text-ink/70 dark:text-white/70"
          >
            <span className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", auto ? "bg-emerald-500" : "bg-ink/15 dark:bg-white/15")}>
              <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all", auto ? "right-1" : "right-6")} />
            </span>
            {t("auto_translate")}
          </button>
          {engine !== "google" && (
            <button
              onClick={() => setShowEmail((v) => !v)}
              className="flex items-center gap-1.5 text-sm font-black text-ink/70 transition hover:text-clay-600 dark:text-white/70 dark:hover:text-gold-400"
            >
              <Mail className="h-4 w-4" />
              {t("quota_btn")}
              {email && <Check className="h-4 w-4 text-emerald-500" />}
              <ChevronDown className={cn("h-4 w-4 transition-transform", showEmail && "rotate-180")} />
            </button>
          )}

          <div className="flex items-center gap-3 sm:ms-auto">
            {loading && progress.total > 1 && (
              <span className="hidden text-xs font-bold text-ink/45 sm:inline dark:text-white/45">
                {n(progress.done)}/{n(progress.total)}
              </span>
            )}
            <button
              onClick={() => void doTranslate()}
              disabled={loading || !input.trim()}
              className="group flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-clay-500 to-clay-600 px-7 py-3.5 text-[15px] font-black text-white shadow-xl shadow-clay-500/25 transition hover:-translate-y-0.5 hover:shadow-2xl disabled:translate-y-0 disabled:opacity-60 sm:flex-none"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t("translating")}
                </>
              ) : (
                <>
                  <Languages className="h-5 w-5" />
                  {t("translate_btn")}
                  <span className="kbd hidden sm:inline">Ctrl + Enter</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* email expander */}
        <AnimatePresence initial={false}>
          {showEmail && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-3 border-t border-dashed border-pine-900/12 p-4 sm:flex-row sm:items-center dark:border-white/10">
                <p className="flex-1 text-[13px] leading-7 font-medium text-ink/60 dark:text-white/60">
                  {t("email_hint")}
                </p>
                <div className="flex gap-2">
                  <input
                    value={emailDraft}
                    onChange={(e) => setEmailDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEmail()}
                    placeholder="you@email.com"
                    dir="ltr"
                    className="w-full rounded-xl border-2 border-pine-900/10 bg-cream px-4 py-2.5 text-left text-sm font-medium text-ink outline-none transition placeholder:text-ink/30 focus:border-pine-700 sm:w-56 dark:border-white/10 dark:bg-white/8 dark:text-white dark:placeholder:text-white/30 dark:focus:border-gold-400/60"
                  />
                  <button
                    onClick={saveEmail}
                    className="shrink-0 rounded-xl bg-pine-950 px-5 py-2.5 text-sm font-black text-white transition hover:bg-clay-600 dark:bg-gold-400 dark:text-pine-950 dark:hover:bg-gold-500"
                  >
                    {t("save")}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* دیکشنری — فقط وقتی گوگل برای واژه‌ای کوتاه داده برگردانده باشد */}
      {dict && output && (
        <DictCard
          dict={dict}
          open={dictOpen}
          onToggle={toggleDict}
          exTr={dictExTr}
          wordLang={
            detected && isKnownLang(detected)
              ? detected
              : src === "auto"
                ? detectLang(dict.word)
                : src
          }
        />
      )}

      {/* مقایسهٔ موتورها — بعد از هر ترجمه، بسته؛ با ضربه باز می‌شود */}
      {output && !loading && (
        <CompareCard
          open={cmpOpen}
          onToggle={toggleCompare}
          runs={cmpRuns}
          usedEngine={usedEngine}
          output={output}
          hasKey={hasActiveKey(api)}
          providerName={providerById(api.provider).name}
          modelLabel={shortModel(activeModel(api))}
          speakingText={cmpSpeaking}
          onPick={pickCompared}
          onCopy={(txt) => void copyText(txt)}
          onSpeak={speakCmp}
          onSetupKey={() => {
            setEngine("custom");
            setShowApi(true);
          }}
        />
      )}

      {/* stats */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-pine-900/8 dark:bg-white/[0.04] dark:ring-white/10"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-pine-950/5 text-pine-800 dark:bg-white/8 dark:text-gold-400">
              <s.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xl font-black text-pine-950 dark:text-white">
                {s.value}
              </span>
              <span className="block text-xs font-bold text-ink/45 dark:text-white/45">
                {s.label}
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* history */}
      <HistoryPanel
        items={history}
        onRestore={restore}
        onToggleFav={toggleFav}
        onDelete={deleteItem}
        onClear={clearHistory}
        notify={notify}
      />
    </section>
  );
}
