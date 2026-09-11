import { motion } from "framer-motion";
import { Heart, KeyRound, Languages, ShieldCheck, Zap } from "lucide-react";
import { GithubIcon, TelegramIcon } from "./icons";
import { useI18n } from "../lib/i18n";

/* لینک‌های شبکه‌های اجتماعی پایین صفحه */
export const GITHUB_URL = "https://github.com/codewave4/Translator";
export const TELEGRAM_URL = "https://t.me/DeepRed_Code";

export function Features() {
  const { t } = useI18n();
  const items = [
    { icon: Zap, title: t("f1_title"), desc: t("f1_desc") },
    { icon: KeyRound, title: t("f3_title"), desc: t("f3_desc") },
    { icon: ShieldCheck, title: t("f2_title"), desc: t("f2_desc") },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-pine-900/8 transition hover:-translate-y-1 hover:shadow-lg dark:bg-white/[0.04] dark:ring-white/10"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-pine-800 to-pine-950 text-gold-400 shadow-md dark:from-gold-400 dark:to-gold-500 dark:text-pine-950">
              <f.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-[16px] font-black text-pine-950 dark:text-white">
              {f.title}
            </h3>
            <p className="mt-2 text-sm leading-7 text-ink/60 dark:text-white/60">
              {f.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear(); // سال میلادی با ارقام انگلیسی، مثل 2026
  return (
    <footer className="mt-16 border-t border-pine-900/8 dark:border-white/8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-center sm:flex-row sm:text-start sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-clay-500 to-clay-600 text-white">
            <Languages className="h-4 w-4" />
          </span>
          <span className="text-[15px] font-black text-pine-950 dark:text-white">
            {t("brand")}
          </span>
        </div>
        <p className="text-[13px] font-medium leading-7 text-ink/50 dark:text-white/50">
          {t("footer_powered")}
        </p>
        <div className="flex flex-col items-center gap-3 sm:items-end">
          <p className="flex items-center gap-1.5 text-[13px] font-bold text-ink/60 dark:text-white/60">
            <span dir="ltr">{year}</span> • {t("footer_made")}
            <Heart className="h-4 w-4 fill-clay-500 text-clay-500" />
          </p>
          {/* لوگوهای گیت‌هاب و تلگرام */}
          <div className="flex items-center gap-2">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub — codewave4/Translator"
              aria-label="GitHub"
              className="grid h-11 w-11 place-items-center rounded-2xl bg-pine-950 text-white shadow-md ring-1 ring-white/10 transition hover:-translate-y-1 hover:bg-black hover:shadow-lg dark:bg-white/10 dark:hover:bg-white dark:hover:text-pine-950"
            >
              <GithubIcon className="h-5 w-5" />
            </a>
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              title="Telegram — @DeepRed_Code"
              aria-label="Telegram"
              className="grid h-11 w-11 place-items-center rounded-2xl bg-[#229ED9] text-white shadow-md shadow-[#229ED9]/30 transition hover:-translate-y-1 hover:bg-[#1b8cc2] hover:shadow-lg"
            >
              <TelegramIcon className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
