import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, History, RotateCcw, Star, Trash2 } from "lucide-react";
import { timeAgo, type HistoryItem, type Notify } from "../lib/translator";
import { useI18n } from "../lib/i18n";
import { cn } from "../utils/cn";

interface Props {
  items: HistoryItem[];
  onRestore: (item: HistoryItem) => void;
  onToggleFav: (id: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  notify: Notify;
}

export default function HistoryPanel({
  items,
  onRestore,
  onToggleFav,
  onDelete,
  onClear,
  notify,
}: Props) {
  const { t, n, ln, lang } = useI18n();
  const [tab, setTab] = useState<"all" | "fav">("all");
  const [armClear, setArmClear] = useState(false);

  useEffect(() => {
    if (!armClear) return;
    const tm = setTimeout(() => setArmClear(false), 3000);
    return () => clearTimeout(tm);
  }, [armClear]);

  const favs = items.filter((i) => i.fav);
  const list = tab === "all" ? items : favs;

  return (
    <section id="history" className="scroll-mt-24 pt-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-xl font-black text-pine-950 dark:text-white">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-pine-950 text-gold-400 dark:bg-gold-400 dark:text-pine-950">
            <History className="h-5 w-5" />
          </span>
          {t("history_title")}
          <span className="rounded-full bg-pine-950/6 px-3 py-1 text-xs font-black text-ink/55 dark:bg-white/10 dark:text-white/60">
            {n(items.length)}
          </span>
        </h2>
        {items.length > 0 && (
          <button
            onClick={() => {
              if (armClear) {
                onClear();
                setArmClear(false);
              } else {
                setArmClear(true);
                notify(t("n_confirm_clear"), "info");
              }
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-black transition",
              armClear
                ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                : "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
            )}
          >
            <Trash2 className="h-4 w-4" />
            {armClear ? t("clear_confirm") : t("clear_all")}
          </button>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        {(
          [
            { key: "all", label: t("tab_all", { n: n(items.length) }) },
            { key: "fav", label: t("tab_fav", { n: n(favs.length) }) },
          ] as const
        ).map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-black transition",
              tab === tb.key
                ? "bg-pine-950 text-white shadow-md dark:bg-gold-400 dark:text-pine-950"
                : "bg-white text-ink/55 ring-1 ring-pine-900/10 hover:text-pine-950 dark:bg-white/6 dark:text-white/60 dark:ring-white/10 dark:hover:text-white"
            )}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-3xl border-2 border-dashed border-pine-900/12 px-6 py-14 text-center dark:border-white/12">
          <span className="grid h-16 w-16 place-items-center rounded-3xl bg-pine-950/5 text-pine-800 dark:bg-white/8 dark:text-gold-400">
            {tab === "fav" ? <Star className="h-7 w-7" /> : <History className="h-7 w-7" />}
          </span>
          <p className="mt-4 text-[15px] font-black text-pine-950 dark:text-white">
            {tab === "fav" ? t("empty_fav_title") : t("empty_all_title")}
          </p>
          <p className="mt-1 max-w-sm text-sm leading-7 text-ink/50 dark:text-white/50">
            {tab === "fav" ? t("empty_fav_desc") : t("empty_all_desc")}
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <AnimatePresence initial={false}>
            {list.map((h) => (
              <motion.article
                key={h.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                onClick={() => onRestore(h)}
                className="group cursor-pointer rounded-3xl bg-white p-5 shadow-sm ring-1 ring-pine-900/8 transition hover:-translate-y-1 hover:shadow-lg hover:ring-clay-500/30 dark:bg-white/[0.04] dark:ring-white/10 dark:hover:ring-gold-400/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-black">
                    <span className="rounded-full bg-pine-950/6 px-2.5 py-1 text-pine-800 dark:bg-white/10 dark:text-white">
                      {h.src === "auto" ? t("auto_detect") : ln(h.src)}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-ink/35 rtl:rotate-180 dark:text-white/35" />
                    <span className="rounded-full bg-clay-500/10 px-2.5 py-1 text-clay-600 dark:text-clay-400">
                      {ln(h.tgt)}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-ink/40 dark:text-white/40">
                    {timeAgo(h.time, lang)}
                  </span>
                </div>
                <p dir="auto" className="mt-3 line-clamp-2 text-sm leading-7 font-medium text-ink/70 dark:text-white/70">
                  {h.sourceText}
                </p>
                <p dir="auto" className="mt-1.5 line-clamp-2 text-[15px] leading-8 font-bold text-pine-950 dark:text-white">
                  {h.translatedText}
                </p>
                <div className="mt-3 flex items-center gap-1.5 border-t border-dashed border-pine-900/10 pt-3 dark:border-white/10">
                  <span className="flex items-center gap-1.5 text-[13px] font-black text-clay-600 dark:text-gold-400">
                    <RotateCcw className="h-4 w-4 transition-transform group-hover:-rotate-180" />
                    {t("reuse")}
                  </span>
                  <span className="ms-auto flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFav(h.id);
                      }}
                      title={h.fav ? t("fav_remove") : t("fav_add")}
                      aria-label={t("favorite")}
                      className={cn(
                        "grid h-9 w-9 place-items-center rounded-xl transition active:scale-90",
                        h.fav
                          ? "bg-gold-400/20 text-gold-500"
                          : "text-ink/35 hover:bg-gold-400/15 hover:text-gold-500 dark:text-white/35"
                      )}
                    >
                      <Star className={cn("h-4 w-4", h.fav && "fill-gold-400 text-gold-400")} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(h.id);
                      }}
                      title={t("delete")}
                      aria-label={t("delete")}
                      className="grid h-9 w-9 place-items-center rounded-xl text-ink/35 transition hover:bg-red-500/10 hover:text-red-500 active:scale-90 dark:text-white/35"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </span>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
