import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, BadgeCheck, CheckCircle2, Info } from "lucide-react";
import Header from "./components/Header";
import Translator from "./components/Translator";
import { Features, Footer } from "./components/Sections";
import { LANGUAGES, type ToastType } from "./lib/translator";
import {
  I18nContext,
  UI_LANG_KEY,
  createI18n,
  readStoredLang,
  translate,
  type UiLang,
} from "./lib/i18n";
import { cn } from "./utils/cn";

interface Toast {
  id: number;
  msg: string;
  type: ToastType;
}

const toastStyle: Record<ToastType, { cls: string; Icon: typeof Info }> = {
  success: {
    cls: "bg-emerald-500 text-white shadow-emerald-500/30",
    Icon: CheckCircle2,
  },
  error: {
    cls: "bg-red-500 text-white shadow-red-500/30",
    Icon: AlertCircle,
  },
  info: {
    cls: "bg-pine-950 text-white ring-1 ring-white/15 dark:bg-gold-400 dark:text-pine-950 dark:ring-0",
    Icon: Info,
  },
};

export default function App() {
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
      ? "dark"
      : "light"
  );
  const [lang, setLang] = useState<UiLang>(readStoredLang);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const i18n = useMemo(() => createI18n(lang, setLang), [lang]);
  const { t, n } = i18n;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem("salam-tr-theme", theme);
    } catch {
      /* noop */
    }
  }, [theme]);

  // اعمال زبان و جهت صفحه (راست‌چین برای فارسی، چپ‌چین برای انگلیسی)
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
    document.title = translate(lang, "doc_title");
    try {
      localStorage.setItem(UI_LANG_KEY, lang);
    } catch {
      /* noop */
    }
  }, [lang]);

  const notify = useCallback((msg: string, type: ToastType = "success") => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p.slice(-2), { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 2800);
  }, []);

  return (
    <I18nContext.Provider value={i18n}>
      <div id="top" className="min-h-screen">
        <Header
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        />

        {/* hero */}
        <div className="relative overflow-hidden">
          <div className="pattern-girih-dark absolute inset-0 opacity-70 dark:hidden" />
          <div className="pattern-girih absolute inset-0 hidden dark:block" />
          <div className="absolute -top-32 right-1/4 h-72 w-72 rounded-full bg-clay-500/15 blur-[110px] dark:bg-clay-600/20" />
          <div className="absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-gold-500/15 blur-[110px]" />

          <div className="relative mx-auto max-w-6xl px-4 pb-2 pt-12 text-center sm:px-6 sm:pt-16">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[13px] font-black text-pine-800 shadow-sm ring-1 ring-pine-900/10 dark:bg-white/8 dark:text-gold-400 dark:ring-white/10"
            >
              <BadgeCheck className="h-4 w-4 text-emerald-500" />
              {t("hero_badge", { n: n(LANGUAGES.length) })}
            </motion.div>
            <motion.h1
              key={`h1-${lang}`}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="mt-5 text-4xl font-black leading-[1.6] text-pine-950 sm:text-5xl sm:leading-[1.6] dark:text-white"
            >
              {t("hero_title_before")}
              <span className="text-clay-500"> {t("hero_title_accent")} </span>
              {t("hero_title_after")}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16 }}
              className="mx-auto mt-3 max-w-2xl text-[15px] leading-8 text-ink/60 sm:text-base dark:text-white/60"
            >
              {t("hero_desc", { n: n(20) })}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.24 }}
              className="mt-6 flex flex-wrap items-center justify-center gap-2"
            >
              <a
                href="#translator"
                className="rounded-2xl bg-pine-950 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-clay-600 dark:bg-gold-400 dark:text-pine-950 dark:hover:bg-gold-500"
              >
                {t("hero_cta_start")}
              </a>
              <a
                href="#history"
                className="rounded-2xl bg-white px-6 py-3 text-sm font-black text-pine-950 shadow-md ring-1 ring-pine-900/10 transition hover:-translate-y-0.5 hover:ring-clay-500/40 dark:bg-white/8 dark:text-white dark:ring-white/15 dark:hover:bg-white/12"
              >
                {t("nav_history")}
              </a>
            </motion.div>
          </div>
        </div>

        <main className="pb-4">
          <Translator notify={notify} />
          <Features />
        </main>
        <Footer />

        {/* toasts */}
        <div className="pointer-events-none fixed bottom-6 right-1/2 z-[80] flex w-full max-w-sm translate-x-1/2 flex-col items-center gap-2 px-4">
          <AnimatePresence>
            {toasts.map((tst) => {
              const s = toastStyle[tst.type];
              return (
                <motion.div
                  key={tst.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={cn(
                    "pointer-events-auto flex w-full items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-black shadow-2xl",
                    s.cls
                  )}
                >
                  <s.Icon className="h-5 w-5 shrink-0" />
                  {tst.msg}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </I18nContext.Provider>
  );
}
