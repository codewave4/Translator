import { Globe, Languages, MessageSquare, Moon, Sun } from "lucide-react";
import { GithubIcon } from "./icons";
import { GITHUB_URL } from "./Sections";
import { useI18n } from "../lib/i18n";
import { cn } from "../utils/cn";

export type Tab = "translate" | "chat";

interface Props {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  tab: Tab;
  onTab: (t: Tab) => void;
}

export default function Header({ theme, onToggleTheme, tab, onTab }: Props) {
  const { t, toggle } = useI18n();

  const tabs: { id: Tab; label: string; icon: typeof Languages }[] = [
    { id: "translate", label: t("nav_translator"), icon: Languages },
    { id: "chat", label: t("nav_chat"), icon: MessageSquare },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-pine-900/8 bg-cream/85 backdrop-blur-xl dark:border-white/8 dark:bg-pine-950/85">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <a
          href="#top"
          onClick={() => onTab("translate")}
          className="group flex items-center gap-3"
        >
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-clay-500 to-clay-600 text-white shadow-lg shadow-clay-500/25 transition-transform group-hover:rotate-6 group-hover:scale-105">
            <Languages className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-black text-pine-950 dark:text-white">
              {t("brand")}
            </span>
            <span className="block text-[11px] font-medium text-ink/50 dark:text-white/50">
              {t("tagline")}
            </span>
          </span>
        </a>

        {/* تب‌ها: مترجم / چت (دسکتاپ) */}
        <nav className="hidden items-center gap-1 rounded-2xl bg-pine-950/5 p-1 md:flex dark:bg-white/8">
          {tabs.map((tb) => (
            <button
              key={tb.id}
              type="button"
              onClick={() => onTab(tb.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition",
                tab === tb.id
                  ? "bg-white text-pine-950 shadow-sm dark:bg-gold-400 dark:text-pine-950"
                  : "text-ink/60 hover:text-pine-950 dark:text-white/60 dark:hover:text-white"
              )}
            >
              <tb.icon className="h-4 w-4" />
              {tb.label}
            </button>
          ))}
          <a
            href="#history"
            onClick={() => onTab("translate")}
            className="rounded-xl px-4 py-2 text-sm font-bold text-ink/60 transition hover:text-pine-950 dark:text-white/60 dark:hover:text-white"
          >
            {t("nav_history")}
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-xl bg-pine-950 px-4 py-2.5 text-[13px] font-black text-white shadow-md transition hover:-translate-y-0.5 hover:bg-clay-600 lg:inline-flex dark:bg-gold-400 dark:text-pine-950 dark:hover:bg-gold-500"
          >
            <GithubIcon className="h-4 w-4" />
            {t("github_btn")}
          </a>

          {/* دکمه تغییر زبان رابط کاربری (فارسی / English) */}
          <button
            onClick={toggle}
            title={t("lang_switch")}
            aria-label={t("lang_switch")}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-gold-400 px-3 text-[13px] font-black text-pine-950 shadow-md transition hover:-translate-y-0.5 hover:bg-gold-500 dark:bg-gold-400 dark:hover:bg-gold-500"
          >
            <Globe className="h-4 w-4" />
            {t("lang_switch_label")}
          </button>

          <button
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? t("theme_light") : t("theme_dark")}
            title={theme === "dark" ? t("theme_light") : t("theme_dark")}
            className="grid h-10 w-10 place-items-center rounded-xl bg-pine-950/6 text-pine-950 ring-1 ring-pine-900/10 transition hover:bg-pine-950/10 dark:bg-white/8 dark:text-gold-400 dark:ring-white/10 dark:hover:bg-white/15"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* تب‌ها در موبایل */}
      <div className="mx-auto max-w-6xl px-4 pb-3 md:hidden sm:px-6">
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-pine-950/5 p-1 dark:bg-white/8">
          {tabs.map((tb) => (
            <button
              key={tb.id}
              type="button"
              onClick={() => onTab(tb.id)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-[13px] font-black transition",
                tab === tb.id
                  ? "bg-white text-pine-950 shadow-sm dark:bg-gold-400 dark:text-pine-950"
                  : "text-ink/60 dark:text-white/60"
              )}
            >
              <tb.icon className="h-4 w-4" />
              {tb.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
