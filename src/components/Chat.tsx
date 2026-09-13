import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Check,
  Copy,
  KeyRound,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  Settings2,
  Sparkles,
  Square,
  Trash2,
  User,
} from "lucide-react";
import {
  ProviderError,
  activeModel,
  hasActiveKey,
  loadApiSettings,
  providerById,
  providerChat,
  shortModel,
  type ApiSettings,
  type ChatMessage,
} from "../lib/providers";
import type { Notify } from "../lib/translator";
import { useI18n } from "../lib/i18n";
import { providerErrorMessage } from "./ApiKeyPanel";
import { cn } from "../utils/cn";

const CHAT_KEY = "salam-tr-chat-v1";

interface Msg extends ChatMessage {
  id: string;
  stopped?: boolean;
}

function loadChat(): Msg[] {
  try {
    const v = JSON.parse(localStorage.getItem(CHAT_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((m) => m && typeof m.content === "string") : [];
  } catch {
    return [];
  }
}

function saveChat(msgs: Msg[]) {
  try {
    localStorage.setItem(CHAT_KEY, JSON.stringify(msgs.slice(-200)));
  } catch {
    /* noop */
  }
}

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now() + Math.random());

const RTL_RE = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
const isRtl = (s: string) => {
  const m = s.match(/[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]|[A-Za-z]/);
  return m ? RTL_RE.test(m[0]) : false;
};

interface Props {
  notify: Notify;
  /** باز کردن مترجم + پنل کلید */
  onSetupKey: () => void;
}

export default function Chat({ notify, onSetupKey }: Props) {
  const { t, isFa } = useI18n();
  const [api, setApi] = useState<ApiSettings>(loadApiSettings);
  const [msgs, setMsgs] = useState<Msg[]>(loadChat);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");
  const [armClear, setArmClear] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // تنظیمات کلید ممکن است در تب مترجم عوض شده باشد؛ هر بار که چت باز می‌شود دوباره بخوان
  useEffect(() => {
    setApi(loadApiSettings());
    const onFocus = () => setApi(loadApiSettings());
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => saveChat(msgs), [msgs]);

  // اسکرول خودکار به آخرین پیام
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, busy]);

  useEffect(() => {
    if (!armClear) return;
    const tm = setTimeout(() => setArmClear(false), 3000);
    return () => clearTimeout(tm);
  }, [armClear]);

  // auto-grow textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [input]);

  const ready = hasActiveKey(api);
  const provider = providerById(api.provider);
  const model = shortModel(activeModel(api));

  /** ارسال گفتگو به مدل و دریافت پاسخ زنده */
  const run = async (history: Msg[]) => {
    const settings = loadApiSettings();
    if (!hasActiveKey(settings)) {
      notify(t("chat_no_key_title"), "error");
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setBusy(true);

    const id = uid();
    setMsgs([...history, { id, role: "assistant", content: "" }]);

    try {
      await providerChat(
        settings,
        history.map(({ role, content }) => ({ role, content })),
        (tok) =>
          setMsgs((prev) => prev.map((m) => (m.id === id ? { ...m, content: m.content + tok } : m))),
        ctrl.signal
      );
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        setMsgs((prev) =>
          prev
            .map((m) => (m.id === id ? { ...m, stopped: true } : m))
            .filter((m) => m.id !== id || m.content.trim())
        );
        return;
      }
      setMsgs((prev) => prev.filter((m) => m.id !== id));
      notify(
        e instanceof ProviderError ? providerErrorMessage(e, t, providerById(settings.provider).name) : t("n_chat_error"),
        "error"
      );
    } finally {
      if (abortRef.current === ctrl) {
        setBusy(false);
        abortRef.current = null;
      }
    }
  };

  const send = async (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || busy) return;
    setInput("");
    const next: Msg[] = [...msgs, { id: uid(), role: "user", content: value }];
    setMsgs(next);
    await run(next);
    inputRef.current?.focus();
  };

  const stop = () => abortRef.current?.abort();

  const regenerate = async () => {
    if (busy) return;
    // آخرین پاسخ دستیار را حذف کن و دوباره بپرس
    let cut = msgs.length;
    while (cut > 0 && msgs[cut - 1].role === "assistant") cut--;
    const history = msgs.slice(0, cut);
    if (!history.length) return;
    setMsgs(history);
    await run(history);
  };

  const copyMsg = async (m: Msg) => {
    try {
      await navigator.clipboard.writeText(m.content);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = m.content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(m.id);
    setTimeout(() => setCopied((c) => (c === m.id ? "" : c)), 1500);
  };

  const clear = () => {
    if (!armClear) {
      setArmClear(true);
      return;
    }
    abortRef.current?.abort();
    setMsgs([]);
    setArmClear(false);
    notify(t("n_chat_cleared"), "success");
  };

  const suggestions = [t("chat_suggest_1"), t("chat_suggest_2"), t("chat_suggest_3")];
  const lastIsAssistant = msgs.length > 0 && msgs[msgs.length - 1].role === "assistant";

  return (
    <section id="chat" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-8 sm:px-6">
      <div className="flex flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-[0_25px_70px_-25px_rgba(11,36,34,0.45)] ring-1 ring-pine-900/10 dark:bg-white/[0.04] dark:ring-white/10 dark:shadow-[0_25px_70px_-25px_rgba(0,0,0,0.8)]">
        {/* نوار بالا */}
        <div className="flex flex-wrap items-center gap-3 border-b border-pine-900/8 p-4 sm:px-5 dark:border-white/10">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-clay-500 to-clay-600 text-white shadow-lg shadow-clay-500/25">
            <MessageSquare className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-black text-pine-950 dark:text-white">{t("chat_title")}</p>
            <p className="truncate text-[12px] font-medium text-ink/50 dark:text-white/50">{t("chat_subtitle")}</p>
          </div>
          {ready && (
            <button
              type="button"
              onClick={onSetupKey}
              title={t("chat_change_model")}
              className="inline-flex max-w-full items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-[12px] font-black text-emerald-700 ring-1 ring-emerald-500/25 transition hover:bg-emerald-500/20 dark:text-emerald-400"
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: provider.color }} />
              <span className="truncate" dir="ltr">
                {t("chat_model_badge", { provider: provider.name, model })}
              </span>
              <Settings2 className="h-3.5 w-3.5 shrink-0" />
            </button>
          )}
          {msgs.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-black transition",
                armClear
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                  : "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
              )}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {armClear ? t("chat_clear_confirm") : t("chat_clear")}
            </button>
          )}
        </div>

        {/* بدون کلید */}
        {!ready ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-3xl bg-pine-950 text-gold-400 dark:bg-gold-400 dark:text-pine-950">
              <KeyRound className="h-7 w-7" />
            </span>
            <p className="mt-4 text-[16px] font-black text-pine-950 dark:text-white">{t("chat_no_key_title")}</p>
            <p className="mt-2 max-w-md text-[13px] leading-7 text-ink/60 dark:text-white/60">{t("chat_no_key_desc")}</p>
            <button
              type="button"
              onClick={onSetupKey}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-l from-clay-500 to-clay-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-clay-500/25 transition hover:-translate-y-0.5"
            >
              <Settings2 className="h-4 w-4" />
              {t("chat_setup_btn")}
            </button>
          </div>
        ) : (
          <>
            {/* پیام‌ها */}
            <div ref={listRef} className="h-[52vh] min-h-[320px] overflow-y-auto scroll-smooth p-4 sm:p-5">
              {msgs.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="grid h-14 w-14 place-items-center rounded-3xl bg-pine-950/5 text-pine-800 dark:bg-white/8 dark:text-gold-400">
                    <Sparkles className="h-6 w-6" />
                  </span>
                  <p className="mt-4 text-[16px] font-black text-pine-950 dark:text-white">{t("chat_empty_title")}</p>
                  <p className="mt-1 max-w-sm text-[13px] leading-7 text-ink/50 dark:text-white/50">{t("chat_empty_desc")}</p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => void send(s)}
                        className="rounded-full bg-cream px-4 py-2 text-[13px] font-bold text-pine-800 ring-1 ring-pine-900/10 transition hover:-translate-y-0.5 hover:bg-pine-950 hover:text-white dark:bg-white/6 dark:text-white/80 dark:ring-white/10 dark:hover:bg-gold-400 dark:hover:text-pine-950"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence initial={false}>
                    {msgs.map((m, i) => {
                      const mine = m.role === "user";
                      const streaming = busy && !mine && i === msgs.length - 1;
                      const rtl = m.content ? isRtl(m.content) : isFa;
                      return (
                        <motion.div
                          key={m.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className={cn("group flex items-end gap-2", mine ? "flex-row-reverse" : "flex-row")}
                        >
                          <span
                            className={cn(
                              "grid h-8 w-8 shrink-0 place-items-center rounded-xl",
                              mine
                                ? "bg-pine-950 text-white dark:bg-gold-400 dark:text-pine-950"
                                : "bg-gradient-to-br from-clay-500 to-clay-600 text-white"
                            )}
                            title={mine ? t("chat_you") : provider.name}
                          >
                            {mine ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                          </span>
                          <div className={cn("flex max-w-[85%] flex-col gap-1 sm:max-w-[75%]", mine ? "items-end" : "items-start")}>
                            <div
                              dir={rtl ? "rtl" : "ltr"}
                              className={cn(
                                "whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[14.5px] leading-8",
                                rtl ? "text-right" : "text-left",
                                mine
                                  ? "rounded-br-md bg-pine-950 text-white dark:bg-gold-400 dark:text-pine-950"
                                  : "rounded-bl-md bg-cream text-ink ring-1 ring-pine-900/8 dark:bg-white/8 dark:text-white dark:ring-white/10"
                              )}
                            >
                              {m.content}
                              {streaming && (
                                <span className="ms-1 inline-block h-4 w-[3px] animate-blink rounded-full bg-clay-500 align-middle" />
                              )}
                              {!m.content && streaming && (
                                <span className="inline-flex items-center gap-1.5 text-[13px] text-ink/50 dark:text-white/50">
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  {t("chat_thinking")}
                                </span>
                              )}
                              {m.stopped && (
                                <span className="ms-1 text-[11px] text-ink/40 dark:text-white/40">{t("chat_stopped")}</span>
                              )}
                            </div>
                            {!streaming && m.content && (
                              <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100 sm:opacity-0 [@media(hover:none)]:opacity-100">
                                <button
                                  type="button"
                                  onClick={() => void copyMsg(m)}
                                  title={t("chat_copy_msg")}
                                  className="grid h-7 w-7 place-items-center rounded-lg text-ink/40 transition hover:bg-pine-950/5 hover:text-pine-950 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
                                >
                                  {copied === m.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                </button>
                                {!mine && i === msgs.length - 1 && (
                                  <button
                                    type="button"
                                    onClick={() => void regenerate()}
                                    title={t("chat_regenerate")}
                                    className="grid h-7 w-7 place-items-center rounded-lg text-ink/40 transition hover:bg-pine-950/5 hover:text-pine-950 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
                                  >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* ورودی */}
            <div className="border-t border-pine-900/8 p-3 sm:p-4 dark:border-white/10">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    // Enter = خط جدید؛ ارسال فقط با دکمه یا Ctrl/⌘ + Enter
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  rows={1}
                  dir="auto"
                  placeholder={t("chat_placeholder")}
                  className="max-h-40 min-h-[48px] w-full flex-1 resize-none rounded-2xl border-2 border-pine-900/10 bg-cream px-4 py-3 text-[15px] leading-6 text-ink outline-none transition placeholder:text-ink/30 focus:border-pine-700 dark:border-white/10 dark:bg-white/8 dark:text-white dark:placeholder:text-white/30 dark:focus:border-gold-400/60"
                />
                {busy ? (
                  <button
                    type="button"
                    onClick={stop}
                    title={t("chat_stop")}
                    aria-label={t("chat_stop")}
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-500 text-white shadow-lg shadow-red-500/30 transition hover:bg-red-600 active:scale-95"
                  >
                    <Square className="h-4 w-4 fill-current" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void send()}
                    disabled={!input.trim()}
                    title={t("chat_send")}
                    aria-label={t("chat_send")}
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-l from-clay-500 to-clay-600 text-white shadow-lg shadow-clay-500/25 transition hover:-translate-y-0.5 active:scale-95 disabled:translate-y-0 disabled:opacity-40"
                  >
                    <Send className={cn("h-5 w-5", isFa && "-scale-x-100")} />
                  </button>
                )}
              </div>
              {lastIsAssistant && !busy && (
                <p className="mt-2 text-[11px] font-medium text-ink/40 dark:text-white/40">
                  {t("chat_model_badge", { provider: provider.name, model })}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
