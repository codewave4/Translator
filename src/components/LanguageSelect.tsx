import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Search, Wand2 } from "lucide-react";
import { LANGUAGES } from "../lib/translator";
import { useI18n } from "../lib/i18n";
import { cn } from "../utils/cn";

interface Props {
  value: string;
  onChange: (code: string) => void;
  allowAuto?: boolean;
}

export default function LanguageSelect({ value, onChange, allowAuto }: Props) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const current =
    value === "auto" ? null : LANGUAGES.find((l) => l.code === value);

  const query = q.trim().toLowerCase();
  const list = LANGUAGES.filter(
    (l) =>
      !query ||
      l.fa.includes(q.trim()) ||
      l.en.toLowerCase().includes(query) ||
      l.native.toLowerCase().includes(query) ||
      l.code.includes(query)
  );

  const pick = (code: string) => {
    onChange(code);
    setOpen(false);
    setQ("");
  };

  return (
    <div ref={ref} className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-2xl px-3 py-2.5 text-sm font-black transition sm:px-4 sm:py-3",
          open
            ? "bg-pine-950 text-white shadow-lg dark:bg-gold-400 dark:text-pine-950"
            : "bg-cream text-pine-950 hover:bg-sand dark:bg-white/8 dark:text-white dark:hover:bg-white/12"
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {current ? (
            <>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-pine-950/8 text-[13px] font-black text-pine-800 dark:bg-white/12 dark:text-gold-400">
                {current.code.toUpperCase()}
              </span>
              <span className="truncate">{current[lang]}</span>
              <span className="hidden truncate text-xs font-medium opacity-50 lg:inline">
                {current.native}
              </span>
            </>
          ) : (
            <>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-clay-500/12 text-clay-600 dark:bg-clay-500/25 dark:text-clay-400">
                <Wand2 className="h-4 w-4" />
              </span>
              <span className="truncate">{t("auto_detect")}</span>
            </>
          )}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute start-0 top-full z-30 mt-2 w-64 max-w-[80vw] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-pine-900/10 dark:bg-pine-900 dark:ring-white/15"
          >
            <div className="border-b border-pine-900/8 p-2 dark:border-white/10">
              <div className="flex items-center gap-2 rounded-xl bg-cream px-3 py-2 dark:bg-white/8">
                <Search className="h-4 w-4 shrink-0 text-ink/40 dark:text-white/40" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("search_lang")}
                  className="w-full bg-transparent text-sm font-medium text-ink outline-none placeholder:text-ink/35 dark:text-white dark:placeholder:text-white/35"
                />
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto p-1.5">
              {allowAuto && !query && (
                <button
                  type="button"
                  onClick={() => pick("auto")}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-black transition",
                    value === "auto"
                      ? "bg-clay-500/10 text-clay-600 dark:text-clay-400"
                      : "text-ink hover:bg-cream dark:text-white dark:hover:bg-white/8"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4" />
                    {t("auto_detect")}
                  </span>
                  {value === "auto" && <Check className="h-4 w-4" />}
                </button>
              )}
              {list.map((l) => (
                <button
                  type="button"
                  key={l.code}
                  onClick={() => pick(l.code)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition",
                    value === l.code
                      ? "bg-pine-950 font-black text-white dark:bg-gold-400 dark:text-pine-950"
                      : "font-medium text-ink hover:bg-cream dark:text-white dark:hover:bg-white/8"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "grid h-7 w-7 place-items-center rounded-lg text-[11px] font-black",
                        value === l.code
                          ? "bg-white/20 dark:bg-pine-950/15"
                          : "bg-pine-950/6 text-pine-800 dark:bg-white/10 dark:text-gold-400"
                      )}
                    >
                      {l.code.toUpperCase()}
                    </span>
                    <span>{l[lang]}</span>
                    <span className="text-xs opacity-50" dir="auto">
                      {l.native}
                    </span>
                  </span>
                  {value === l.code && <Check className="h-4 w-4" />}
                </button>
              ))}
              {list.length === 0 && (
                <p className="px-3 py-6 text-center text-sm font-medium text-ink/45 dark:text-white/45">
                  {t("no_lang")}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
