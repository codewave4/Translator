import { Globe, Languages, Moon, Sun } from "lucide-react";
import { GithubIcon } from "./icons";
import { GITHUB_URL } from "./Sections";
import { useI18n } from "../lib/i18n";

interface Props {
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export default function Header({ theme, onToggleTheme }: Props) {
  const { t, toggle } = useI18n();

  const links = [
    { href: "#translator", label: t("nav_translator") },
    { href: "#history", label: t("nav_history") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-pine-900/8 bg-cream/85 backdrop-blur-xl dark:border-white/8 dark:bg-pine-950/85">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <a href="#top" className="group flex items-center gap-3">
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

        <nav className="hidden items-center gap-1 text-sm font-bold text-ink/60 md:flex dark:text-white/60">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-xl px-4 py-2 transition hover:bg-pine-950/5 hover:text-pine-950 dark:hover:bg-white/8 dark:hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-xl bg-pine-950 px-4 py-2.5 text-[13px] font-black text-white shadow-md transition hover:-translate-y-0.5 hover:bg-clay-600 sm:inline-flex dark:bg-gold-400 dark:text-pine-950 dark:hover:bg-gold-500"
          >
            <GithubIcon className="h-4 w-4" />
            {t("github_btn")}
          </a>

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
    </header>
  );
}
