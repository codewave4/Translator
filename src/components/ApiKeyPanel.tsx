import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Pencil,
  PlugZap,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  PROVIDERS,
  ProviderError,
  fetchModels,
  providerById,
  recommendedModel,
  shortModel,
  testProvider,
  type ApiSettings,
  type ModelInfo,
  type ProviderId,
} from "../lib/providers";
import type { Notify } from "../lib/translator";
import { useI18n } from "../lib/i18n";
import { cn } from "../utils/cn";

interface Props {
  settings: ApiSettings;
  onChange: (s: ApiSettings) => void;
  notify: Notify;
}

const SHORT_LIST = 8;

export function providerErrorMessage(
  e: unknown,
  t: ReturnType<typeof useI18n>["t"],
  providerName: string
): string {
  const kind = e instanceof ProviderError ? e.kind : "generic";
  if (kind === "unauthorized") return t("n_api_unauthorized");
  if (kind === "ratelimit") return t("n_api_ratelimit");
  if (kind === "model") return t("n_api_model");
  if (kind === "network") return t("n_api_network", { provider: providerName });
  return t("n_api_generic", { provider: providerName });
}

export default function ApiKeyPanel({ settings, onChange, notify }: Props) {
  const { t, n } = useI18n();
  const provider = providerById(settings.provider);
  const savedKey = (settings.keys[provider.id] ?? "").trim();
  const savedModel = settings.models[provider.id] ?? "";

  // مرحله ۱: سرویس | مرحله ۲: کلید + تست | مرحله ۳: انتخاب مدل
  const [keyDraft, setKeyDraft] = useState(savedKey);
  const [verified, setVerified] = useState(!!savedKey);
  const [show, setShow] = useState(false);
  const [testing, setTesting] = useState(false);
  const [okMs, setOkMs] = useState<number | null>(null);

  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [live, setLive] = useState<boolean | null>(null);
  const [selected, setSelected] = useState(savedModel);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [freeOnly, setFreeOnly] = useState(true);

  const abortRef = useRef<AbortController | null>(null);

  const draft = (key = keyDraft): ApiSettings => ({
    provider: provider.id,
    keys: { ...settings.keys, [provider.id]: key.trim() },
    models: settings.models,
  });

  /** دریافت مدل‌ها؛ در صورت شکست، لیست پیش‌فرض */
  const loadModels = async (s: ApiSettings, keep: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoadingModels(true);
    setModels([]);
    try {
      const list = await fetchModels(s, ctrl.signal);
      if (ctrl.signal.aborted) return;
      setModels(list);
      setLive(true);
      const ids = list.map((m) => m.id);
      setSelected(keep && ids.includes(keep) ? keep : recommendedModel(provider.id, ids));
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      const fallback = provider.models.map((id) => ({ id, free: provider.free || /:free$/.test(id) }));
      setModels(fallback);
      setLive(false);
      setSelected(keep && provider.models.includes(keep) ? keep : provider.models[0]);
    } finally {
      if (!ctrl.signal.aborted) setLoadingModels(false);
    }
  };

  // با تعویض سرویس: اگر کلید تأییدشده دارد → مستقیم مرحله ۳، وگرنه مرحله ۲
  useEffect(() => {
    const k = (settings.keys[provider.id] ?? "").trim();
    const m = settings.models[provider.id] ?? "";
    setKeyDraft(k);
    setVerified(!!k);
    setOkMs(null);
    setShow(false);
    setQuery("");
    setShowAll(false);
    setModels([]);
    setLive(null);
    setSelected(m);
    if (k) void loadModels({ provider: provider.id, keys: settings.keys, models: settings.models }, m);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider.id]);

  const pickProvider = (id: ProviderId) => onChange({ ...settings, provider: id });

  const onKeyInput = (v: string) => {
    setKeyDraft(v);
    setOkMs(null);
    // تغییر کلید = باید دوباره تست شود
    if (verified && v.trim() !== savedKey) {
      setVerified(false);
      setModels([]);
      setLive(null);
    }
  };

  const test = async () => {
    if (!keyDraft.trim()) {
      notify(t("n_api_empty"), "error");
      return;
    }
    setTesting(true);
    setOkMs(null);
    try {
      const s = draft();
      const ms = await testProvider(s);
      setOkMs(ms);
      setVerified(true);
      notify(t("n_api_ok", { ms: n(ms) }), "success");
      await loadModels(s, savedModel);
    } catch (e) {
      setVerified(false);
      notify(providerErrorMessage(e, t, provider.name), "error");
    } finally {
      setTesting(false);
    }
  };

  const save = () => {
    if (!verified || !keyDraft.trim()) {
      notify(t("n_api_empty"), "error");
      return;
    }
    const model = selected || recommendedModel(provider.id, models.map((m) => m.id));
    onChange({
      provider: provider.id,
      keys: { ...settings.keys, [provider.id]: keyDraft.trim() },
      models: { ...settings.models, [provider.id]: model },
    });
    notify(t("n_api_saved", { provider: provider.name }), "success");
  };

  const clear = () => {
    abortRef.current?.abort();
    const keys = { ...settings.keys };
    delete keys[provider.id];
    onChange({ ...settings, keys });
    setKeyDraft("");
    setVerified(false);
    setOkMs(null);
    setModels([]);
    setLive(null);
    setSelected("");
    notify(t("n_api_removed"), "info");
  };

  const changeKey = () => {
    setVerified(false);
    setOkMs(null);
    setModels([]);
    setLive(null);
    setShow(false);
  };

  /* ----- فیلتر و برش لیست مدل‌ها ----- */
  const isOpenRouter = provider.id === "openrouter";
  const hasFree = models.some((m) => m.free);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return models.filter((m) => {
      if (isOpenRouter && freeOnly && hasFree && !q && !m.free) return false;
      return !q || m.id.toLowerCase().includes(q);
    });
  }, [models, query, freeOnly, isOpenRouter, hasFree]);
  const visible = showAll || query ? filtered : filtered.slice(0, SHORT_LIST);
  const recommended = useMemo(() => recommendedModel(provider.id, models.map((m) => m.id)), [models, provider.id]);

  const input =
    "w-full rounded-xl border-2 border-pine-900/10 bg-cream px-4 py-2.5 text-sm font-medium text-ink outline-none transition placeholder:text-ink/30 focus:border-pine-700 dark:border-white/10 dark:bg-white/8 dark:text-white dark:placeholder:text-white/30 dark:focus:border-gold-400/60";

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      <div className="mt-3 rounded-2xl bg-cream p-4 ring-1 ring-pine-900/8 sm:p-5 dark:bg-white/5 dark:ring-white/10">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pine-950 text-gold-400 dark:bg-gold-400 dark:text-pine-950">
            <KeyRound className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-black text-pine-950 dark:text-white">{t("api_panel_title")}</p>
            <p className="mt-1 text-[13px] leading-7 text-ink/60 dark:text-white/60">{t("api_panel_desc")}</p>
          </div>
        </div>

        {/* مرحله ۱: سرویس */}
        <p className="mt-4 flex items-center gap-2 text-[13px] font-black text-ink/60 dark:text-white/60">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-pine-950 text-[11px] text-white dark:bg-gold-400 dark:text-pine-950">{n(1)}</span>
          {t("api_provider")}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PROVIDERS.map((p) => {
            const active = p.id === provider.id;
            const has = !!(settings.keys[p.id] ?? "").trim();
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => pickProvider(p.id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-black transition active:scale-95",
                  active
                    ? "bg-pine-950 text-white shadow-md dark:bg-gold-400 dark:text-pine-950"
                    : "bg-white text-ink/70 ring-1 ring-pine-900/10 hover:text-pine-950 dark:bg-white/8 dark:text-white/70 dark:ring-white/10 dark:hover:text-white"
                )}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                {p.name}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px]",
                    active ? "bg-white/15 dark:bg-pine-950/15" : "bg-pine-950/6 dark:bg-white/10"
                  )}
                >
                  {p.free ? t("api_free") : t("api_paid")}
                </span>
                {has && <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={3} />}
              </button>
            );
          })}
        </div>

        {/* مرحله ۲: کلید + تست */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="flex items-center gap-2 text-[13px] font-black text-ink/60 dark:text-white/60">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-pine-950 text-[11px] text-white dark:bg-gold-400 dark:text-pine-950">{n(2)}</span>
              {t("api_key_label")}{" "}
              <span className="font-mono text-[11px] text-ink/40 dark:text-white/40" dir="ltr">
                ({provider.keyHint})
              </span>
            </label>
            <a
              href={provider.keyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[12px] font-black text-clay-600 hover:underline dark:text-gold-400"
            >
              {t("api_get_key")}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {verified ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-emerald-500/10 px-3.5 py-2.5 ring-1 ring-emerald-500/25">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
              <span className="text-[13px] font-black text-emerald-700 dark:text-emerald-400">{t("api_key_verified")}</span>
              <span className="font-mono text-[12px] text-ink/50 dark:text-white/50" dir="ltr">
                {keyDraft.slice(0, 6)}••••{keyDraft.slice(-4)}
              </span>
              {okMs !== null && (
                <span className="text-[11px] font-bold text-emerald-600/80 dark:text-emerald-400/80">({n(okMs)} ms)</span>
              )}
              <span className="ms-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={changeKey}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-black text-ink/60 transition hover:bg-pine-950/5 hover:text-pine-950 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {t("api_change_key")}
                </button>
                {savedKey && (
                  <button
                    type="button"
                    onClick={clear}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-black text-red-500 transition hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("api_clear")}
                  </button>
                )}
              </span>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <input
                    value={keyDraft}
                    onChange={(e) => onKeyInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void test()}
                    type={show ? "text" : "password"}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={t("api_key_placeholder")}
                    dir="ltr"
                    className={cn(input, "pe-11 text-left font-mono")}
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    title={show ? t("api_hide") : t("api_show")}
                    aria-label={show ? t("api_hide") : t("api_show")}
                    className="absolute end-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink/45 transition hover:bg-pine-950/5 hover:text-pine-950 dark:text-white/45 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => void test()}
                  disabled={testing || !keyDraft.trim()}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-pine-950 px-5 py-2.5 text-[13px] font-black text-white shadow-md transition hover:bg-clay-600 disabled:opacity-50 dark:bg-gold-400 dark:text-pine-950 dark:hover:bg-gold-500"
                >
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
                  {testing ? t("api_testing") : t("api_test")}
                </button>
              </div>
              <p className="mt-2 text-[12px] leading-6 text-ink/50 dark:text-white/50">{t("api_step_key")}</p>
              {savedKey && (
                <button
                  type="button"
                  onClick={clear}
                  className="mt-1 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-black text-red-500 transition hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("api_clear")}
                </button>
              )}
            </>
          )}
        </div>

        {/* مرحله ۳: انتخاب مدل (فقط بعد از تأیید کلید) */}
        <AnimatePresence initial={false}>
          {verified && (
            <motion.div
              key="models"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-[13px] font-black text-ink/60 dark:text-white/60">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-pine-950 text-[11px] text-white dark:bg-gold-400 dark:text-pine-950">{n(3)}</span>
                    {t("api_models_title")}
                  </p>
                  {!loadingModels && models.length > 0 && (
                    <span
                      className={cn(
                        "text-[11px] font-bold",
                        live ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {live
                        ? t("api_models_live", { n: n(models.length), provider: provider.name })
                        : t("api_models_fallback")}
                    </span>
                  )}
                </div>

                {loadingModels ? (
                  <div className="mt-2 flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-[13px] font-bold text-ink/60 ring-1 ring-pine-900/8 dark:bg-white/8 dark:text-white/60 dark:ring-white/10">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("api_models_loading")}
                  </div>
                ) : (
                  <>
                    {(models.length > SHORT_LIST || isOpenRouter) && (
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40 dark:text-white/40" />
                          <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t("api_models_search")}
                            dir="ltr"
                            spellCheck={false}
                            className={cn(input, "ps-9 text-left font-mono text-[13px]")}
                          />
                        </div>
                        {isOpenRouter && hasFree && (
                          <button
                            type="button"
                            onClick={() => setFreeOnly((v) => !v)}
                            className={cn(
                              "inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[12px] font-black ring-1 transition",
                              freeOnly
                                ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/30 dark:text-emerald-400"
                                : "bg-white text-ink/60 ring-pine-900/10 dark:bg-white/8 dark:text-white/60 dark:ring-white/10"
                            )}
                          >
                            <Check className={cn("h-3.5 w-3.5", !freeOnly && "opacity-30")} strokeWidth={3} />
                            {t("api_free_only")}
                          </button>
                        )}
                      </div>
                    )}

                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {visible.map((m) => {
                        const active = m.id === selected;
                        const rec = m.id === recommended;
                        const name = shortModel(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setSelected(m.id)}
                            aria-pressed={active}
                            title={m.id}
                            className={cn(
                              "flex min-w-0 items-center gap-2.5 rounded-xl px-3 py-2 text-start transition active:scale-[0.99]",
                              active
                                ? "bg-emerald-500/10 ring-2 ring-emerald-500"
                                : "bg-white ring-1 ring-pine-900/10 hover:ring-pine-900/25 dark:bg-white/8 dark:ring-white/10 dark:hover:ring-white/25"
                            )}
                          >
                            <span
                              className={cn(
                                "grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full ring-2 transition",
                                active ? "bg-emerald-500 ring-emerald-500 text-white" : "ring-ink/25 dark:ring-white/30"
                              )}
                            >
                              {active && <Check className="h-2.5 w-2.5" strokeWidth={4} />}
                            </span>
                            {/* نام مدل: چپ‌چین، فونت کوچک، شکستن هوشمند در اسم‌های طولانی */}
                            <span className="min-w-0 flex-1 text-left" dir="ltr">
                              <span
                                className={cn(
                                  "block font-mono text-[11px] font-bold leading-4 sm:text-[12px]",
                                  name.length > 30 ? "break-all" : "truncate",
                                  active ? "text-pine-950 dark:text-white" : "text-ink/80 dark:text-white/80"
                                )}
                              >
                                {name}
                              </span>
                              {isOpenRouter && m.id.includes("/") && (
                                <span className="block truncate text-[10px] leading-4 text-ink/45 dark:text-white/45">
                                  {m.id.split("/")[0]}
                                </span>
                              )}
                            </span>
                            {(rec || (isOpenRouter && m.free)) && (
                              <span className="flex shrink-0 flex-col items-end gap-0.5">
                                {rec && (
                                  <span className="inline-flex items-center gap-0.5 whitespace-nowrap rounded-full bg-gold-400/20 px-1.5 py-0.5 text-[9px] font-black text-gold-500 ring-1 ring-gold-500/30">
                                    <Sparkles className="h-2 w-2" />
                                    {t("api_recommended")}
                                  </span>
                                )}
                                {isOpenRouter && m.free && (
                                  <span className="whitespace-nowrap rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400">
                                    {t("api_free")}
                                  </span>
                                )}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {visible.length === 0 && (
                      <p className="mt-2 rounded-xl bg-white px-4 py-3 text-center text-[13px] font-bold text-ink/50 ring-1 ring-pine-900/8 dark:bg-white/8 dark:text-white/50 dark:ring-white/10">
                        {t("api_models_none")}
                      </p>
                    )}

                    {!query && filtered.length > SHORT_LIST && (
                      <button
                        type="button"
                        onClick={() => setShowAll((v) => !v)}
                        className="mt-2 text-[12px] font-black text-clay-600 hover:underline dark:text-gold-400"
                      >
                        {showAll ? t("api_show_less") : t("api_show_all", { n: n(filtered.length) })}
                      </button>
                    )}
                  </>
                )}

                {/* ذخیره */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={save}
                    disabled={loadingModels || !selected}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-l from-clay-500 to-clay-600 px-5 py-2.5 text-[13px] font-black text-white shadow-lg shadow-clay-500/25 transition hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" strokeWidth={3} />
                    {t("api_save")}
                  </button>
                  {savedKey && savedModel && (
                    <span className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400" dir="auto">
                      {t("api_ready", { provider: provider.name, model: shortModel(savedModel) })}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* نکات */}
        <div className="mt-4 space-y-2">
          <p className="flex items-start gap-2 text-[12px] leading-6 text-ink/55 dark:text-white/55">
            <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-emerald-500" />
            {t("api_privacy")}
          </p>
          <p className="flex items-start gap-2 text-[12px] leading-6 text-ink/55 dark:text-white/55">
            <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-amber-500" />
            {t("api_vpn_note")}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
