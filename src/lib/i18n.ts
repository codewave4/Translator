/* ============================================================
   دوزبانه‌سازی رابط کاربری (فارسی / English)
   هر کلید یک متن فارسی و یک متن انگلیسی دارد.
   برای تغییر یا اصلاح متن‌ها فقط همین فایل را ویرایش کن.
   ============================================================ */
import { createContext, useContext } from "react";
import { langByCode, toFa } from "./translator";

export type UiLang = "fa" | "en";
export const UI_LANG_KEY = "salam-tr-lang";

export const dict = {
  /* ---------- عمومی ---------- */
  doc_title: { fa: "مترجم متن | ترجمه فارسی به انگلیسی و بالعکس", en: "Text Translator | Persian ↔ English & 20+ languages" },
  brand: { fa: "مترجم متن", en: "Text Translator" },
  tagline: { fa: "رایگان • بدون ثبت‌نام • متن‌باز", en: "Free • No sign-up • Open source" },
  copy: { fa: "کپی", en: "Copy" },
  copied: { fa: "کپی شد", en: "Copied" },
  save: { fa: "ذخیره", en: "Save" },
  delete: { fa: "حذف", en: "Delete" },
  lang_switch: { fa: "Switch to English", en: "تغییر به فارسی" },
  lang_switch_label: { fa: "EN", en: "فارسی" },

  /* ---------- هدر ---------- */
  nav_translator: { fa: "مترجم", en: "Translator" },
  nav_history: { fa: "تاریخچه", en: "History" },
  github_btn: { fa: "سورس در گیت‌هاب", en: "Source on GitHub" },
  theme_light: { fa: "حالت روشن", en: "Light mode" },
  theme_dark: { fa: "حالت تیره", en: "Dark mode" },

  /* ---------- هیرو ---------- */
  hero_badge: { fa: "{n} زبان • ترجمه خودکار • ورودی صوتی", en: "{n} languages • Auto-translate • Voice input" },
  hero_title_before: { fa: "هر متنی را در یک چشم‌به‌هم‌زدن", en: "Translate any text" },
  hero_title_accent: { fa: "ترجمه", en: "in a blink" },
  hero_title_after: { fa: "کن", en: "" },
  hero_desc: {
    fa: "فارسی به انگلیسی و بالعکس، به‌علاوه بیش از {n} زبان دیگر — رایگان، بدون ثبت‌نام، با تاریخچه و تلفظ صوتی.",
    en: "Persian ↔ English plus {n}+ other languages — free, no sign-up, with history and text-to-speech.",
  },
  hero_cta_start: { fa: "شروع ترجمه", en: "Start translating" },

  /* ---------- مترجم ---------- */
  try_it: { fa: "امتحان کن:", en: "Try:" },
  engine_title: { fa: "موتور ترجمه", en: "Translation engine" },
  swap_langs: { fa: "جابه‌جایی زبان‌ها", en: "Swap languages" },
  source_label: { fa: "متن مبدأ", en: "Source text" },
  detected: { fa: "تشخیص: {lang}", en: "Detected: {lang}" },
  input_placeholder: { fa: "متنت را اینجا بنویس، بچسبان یا با میکروفون بخوان...", en: "Type, paste, or dictate your text here..." },
  counter: { fa: "{chars} / {max} حرف • {words} کلمه", en: "{chars} / {max} chars • {words} words" },
  btn_mic: { fa: "ورودی صوتی", en: "Voice input" },
  btn_paste: { fa: "چسباندن از کلیپ‌بورد", en: "Paste from clipboard" },
  btn_speak_src: { fa: "خواندن متن مبدأ", en: "Read source aloud" },
  btn_clear: { fa: "پاک کردن", en: "Clear" },
  target_label: { fa: "ترجمه ({lang})", en: "Translation ({lang})" },
  via_engine: { fa: "با {engine}", en: "via {engine}" },
  btn_speak_tgt: { fa: "خواندن ترجمه", en: "Read translation aloud" },
  btn_copy_tr: { fa: "کپی ترجمه", en: "Copy translation" },
  output_placeholder: { fa: "ترجمه اینجا نمایش داده می‌شود...", en: "Translation will appear here..." },
  long_progress: { fa: "متن طولانی است؛ در حال ترجمه بخش {done} از {total}...", en: "Long text — translating part {done} of {total}..." },
  alternatives_title: { fa: "ترجمه‌های جایگزین (برای کپی بزن روشون):", en: "Alternative translations (tap to copy):" },
  auto_translate: { fa: "ترجمه خودکار", en: "Auto-translate" },
  quota_btn: { fa: "افزایش سهمیه MyMemory", en: "Increase MyMemory quota" },
  translating: { fa: "در حال ترجمه...", en: "Translating..." },
  translate_btn: { fa: "ترجمه کن", en: "Translate" },
  email_hint: {
    fa: "سهمیه رایگان روزانه محدود است. با ثبت ایمیل (فقط در مرورگر تو ذخیره می‌شود)، سهمیه‌ات چند برابر می‌شود:",
    en: "The free daily quota is limited. Add your email (stored only in your browser) to multiply it:",
  },
  stat_today: { fa: "ترجمه امروز", en: "Translated today" },
  stat_total: { fa: "کل ترجمه‌ها", en: "Total translations" },
  stat_chars: { fa: "حروف ترجمه‌شده", en: "Characters translated" },
  stat_langs: { fa: "زبان پشتیبانی‌شده", en: "Supported languages" },

  /* ---------- کلید اختصاصی (مدل‌های هوش مصنوعی) ---------- */
  api_title: { fa: "کلید اختصاصی", en: "Your API key" },
  api_desc_off: { fa: "OpenAI، Gemini، Groq و…", en: "OpenAI, Gemini, Groq…" },
  api_desc_on: { fa: "{provider} • {model}", en: "{provider} • {model}" },
  api_panel_title: { fa: "ترجمه با مدل‌های هوش مصنوعی", en: "Translate with AI models" },
  api_panel_desc: {
    fa: "اگر کلید API یکی از این سرویس‌ها را داری، واردش کن تا با مدل انتخابی‌ات ترجمه شود. ترجمه‌های هوش مصنوعی معمولاً روان‌تر و طبیعی‌ترند.",
    en: "If you have an API key for one of these services, enter it to translate with the model of your choice. AI translations are usually more natural and fluent.",
  },
  api_privacy: {
    fa: "کلید فقط در مرورگر خودت ذخیره می‌شود و درخواست‌ها مستقیم از مرورگر تو به همان سرویس می‌روند؛ هیچ سرور واسطه‌ای وجود ندارد.",
    en: "Your key is stored only in your browser and requests go straight from your browser to that service — there is no middle server.",
  },
  api_provider: { fa: "سرویس", en: "Provider" },
  api_key_label: { fa: "کلید API", en: "API key" },
  api_key_placeholder: { fa: "کلیدت را اینجا بچسبان…", en: "Paste your key here…" },
  api_get_key: { fa: "کلید از کجا بگیرم؟", en: "Get a key" },
  api_free: { fa: "رایگان", en: "Free" },
  api_paid: { fa: "پولی", en: "Paid" },
  api_model: { fa: "مدل", en: "Model" },
  api_custom_model: { fa: "نام مدل دلخواه…", en: "Custom model name…" },
  api_test: { fa: "تست اتصال", en: "Test connection" },
  api_testing: { fa: "در حال تست…", en: "Testing…" },
  api_save: { fa: "ذخیره و استفاده", en: "Save & use" },
  api_clear: { fa: "حذف کلید", en: "Remove key" },
  api_show: { fa: "نمایش کلید", en: "Show key" },
  api_hide: { fa: "مخفی کردن کلید", en: "Hide key" },
  api_ready: { fa: "آماده: {provider} • {model}", en: "Ready: {provider} • {model}" },
  api_need_key: { fa: "برای این موتور اول کلید API را وارد کن", en: "Enter an API key to use this engine" },
  api_step_key: { fa: "کلید را وارد کن و «تست اتصال» را بزن تا مدل‌های در دسترس نمایش داده شوند.", en: "Enter your key and hit “Test connection” to see the available models." },
  api_key_verified: { fa: "کلید معتبر است", en: "Key verified" },
  api_models_title: { fa: "مدل‌های در دسترس", en: "Available models" },
  api_models_loading: { fa: "در حال دریافت لیست مدل‌ها…", en: "Fetching models…" },
  api_models_live: { fa: "{n} مدل مستقیم از {provider} دریافت شد", en: "{n} models fetched live from {provider}" },
  api_models_fallback: { fa: "دریافت لیست زنده ممکن نبود؛ لیست پیش‌فرض نمایش داده می‌شود", en: "Couldn't fetch the live list; showing defaults" },
  api_models_search: { fa: "جست‌وجوی مدل…", en: "Search models…" },
  api_models_none: { fa: "مدلی پیدا نشد", en: "No models found" },
  api_recommended: { fa: "پیشنهادی", en: "Recommended" },
  api_selected: { fa: "انتخاب‌شده", en: "Selected" },
  api_show_all: { fa: "نمایش همه ({n})", en: "Show all ({n})" },
  api_show_less: { fa: "نمایش کمتر", en: "Show less" },
  api_free_only: { fa: "فقط رایگان", en: "Free only" },
  api_change_key: { fa: "تغییر کلید", en: "Change key" },
  api_more_name: { fa: "سرویس‌های بیشتر", en: "More providers" },
  api_more_badge: { fa: "خودکار", en: "Auto" },
  api_more_hint: {
    fa: "کلید هر یک از این سرویس‌ها را بچسبان؛ سرویس خودکار از روی کلید تشخیص داده می‌شود: {list}",
    en: "Paste a key from any of these providers; the service is detected automatically from the key: {list}",
  },
  api_more_detected: { fa: "تشخیص داده شد: {provider}", en: "Detected: {provider}" },
  api_more_unknown: {
    fa: "سرویس این کلید شناخته نشد. کلیدهای پشتیبانی‌شده: {list}",
    en: "Couldn't recognize this key. Supported keys: {list}",
  },
  n_api_detected: { fa: "کلید {provider} شناسایی شد", en: "{provider} key detected" },
  api_vpn_note: {
    fa: "نکته: OpenAI و Gemini از IP ایران در دسترس نیستند و به VPN نیاز دارند؛ Groq، OpenRouter و Mistral معمولاً راحت‌تر جواب می‌دهند.",
    en: "Note: some providers are region-restricted; Groq, OpenRouter and Mistral are usually the most accessible.",
  },
  n_api_ok: { fa: "اتصال برقرار شد! ({ms} میلی‌ثانیه)", en: "Connected! ({ms} ms)" },
  n_api_saved: { fa: "کلید ذخیره شد؛ حالا با {provider} ترجمه می‌شود", en: "Key saved — translating with {provider}" },
  n_api_removed: { fa: "کلید حذف شد", en: "Key removed" },
  n_api_empty: { fa: "اول کلید را وارد کن", en: "Enter a key first" },
  n_api_unauthorized: { fa: "کلید API نامعتبر است یا دسترسی ندارد", en: "Invalid API key or no access" },
  n_api_ratelimit: { fa: "سهمیه یا اعتبار این کلید تمام شده؛ کمی بعد دوباره تلاش کن", en: "Rate limit or credit exhausted for this key; try again later" },
  n_api_model: { fa: "این مدل پیدا نشد؛ مدل دیگری انتخاب کن", en: "Model not found; pick another model" },
  n_api_network: { fa: "به {provider} دسترسی نیست (اینترنت، تحریم یا VPN را بررسی کن)", en: "Can't reach {provider} (check internet, region or VPN)" },
  n_api_generic: { fa: "{provider} پاسخ معتبری نداد؛ دوباره تلاش کن", en: "{provider} returned an invalid response; try again" },
  n_fallback_custom: { fa: "{provider} پاسخ نداد؛ با گوگل ترجمه می‌شود", en: "{provider} didn't respond; falling back to Google" },

  /* ---------- خروجی PDF ---------- */
  btn_pdf: { fa: "دانلود ترجمه به‌صورت PDF", en: "Download translation as PDF" },
  pdf_subtitle: { fa: "ترجمه سریع و دقیق", en: "Fast & accurate translation" },
  pdf_translation: { fa: "ترجمه", en: "Translation" },
  pdf_source_lang: { fa: "زبان مبدأ", en: "Source language" },
  pdf_target_lang: { fa: "زبان مقصد", en: "Target language" },
  pdf_datetime: { fa: "تاریخ و زمان", en: "Date & time" },
  pdf_continued: { fa: "ادامه", en: "continued" },
  pdf_page: { fa: "صفحه {a} از {b}", en: "Page {a} of {b}" },
  n_pdf_done: { fa: "فایل PDF ترجمه دانلود شد", en: "Translation PDF downloaded" },
  n_pdf_err: { fa: "ساخت PDF ناموفق بود؛ دوباره تلاش کن", en: "Couldn't create the PDF; please try again" },

  /* ---------- اعلان‌ها ---------- */
  n_target_changed: { fa: "زبان مقصد خودکار به «{lang}» تغییر کرد", en: "Target language switched to “{lang}”" },
  n_fallback: { fa: "{engine} پاسخ نداد؛ با MyMemory ترجمه می‌شود", en: "{engine} didn't respond; falling back to MyMemory" },
  n_quota: { fa: "سهمیه روزانه MyMemory تمام شد! ایمیلت را ثبت کن یا موتور را روی «گوگل» بگذار", en: "MyMemory daily quota exhausted! Add your email or switch the engine to Google" },
  n_blocked: { fa: "گوگل موقتاً دسترسی را محدود کرده؛ موتور را روی «خودکار» یا MyMemory بگذار", en: "Google temporarily limited access; switch to “Auto” or MyMemory" },
  n_network: { fa: "اتصال اینترنت را بررسی کن یا موتور ترجمه را عوض کن", en: "Check your internet connection or switch the engine" },
  n_generic: { fa: "خطایی رخ داد؛ دوباره تلاش کن یا موتور ترجمه را عوض کن", en: "Something went wrong; try again or switch the engine" },
  n_no_stt: { fa: "مرورگر شما از ورودی صوتی پشتیبانی نمی‌کند (پیشنهاد: کروم)", en: "Your browser doesn't support voice input (try Chrome)" },
  n_listening: { fa: "در حال گوش دادن... صحبت کن", en: "Listening... speak now" },
  n_copied: { fa: "متن کپی شد", en: "Copied to clipboard" },
  n_clip_empty: { fa: "کلیپ‌بورد خالی است", en: "Clipboard is empty" },
  n_clip_denied: { fa: "مرورگر اجازه دسترسی به کلیپ‌بورد نداد", en: "Clipboard access was denied" },
  n_email_invalid: { fa: "ایمیل معتبر وارد کن", en: "Enter a valid email" },
  n_email_saved: { fa: "ایمیل ذخیره شد؛ سهمیه‌ات بیشتر شد", en: "Email saved — your quota is increased" },
  n_email_removed: { fa: "ایمیل حذف شد", en: "Email removed" },
  n_history_cleared: { fa: "تاریخچه پاک شد", en: "History cleared" },
  n_confirm_clear: { fa: "برای تایید پاک‌سازی، دوباره بزن", en: "Tap again to confirm" },

  /* ---------- انتخاب زبان ---------- */
  auto_detect: { fa: "تشخیص خودکار", en: "Auto-detect" },
  search_lang: { fa: "جست‌وجوی زبان...", en: "Search languages..." },
  no_lang: { fa: "زبانی پیدا نشد", en: "No language found" },

  /* ---------- تاریخچه ---------- */
  history_title: { fa: "تاریخچه ترجمه‌ها", en: "Translation history" },
  clear_all: { fa: "پاک کردن همه", en: "Clear all" },
  clear_confirm: { fa: "مطمئنی؟ پاک کن!", en: "Sure? Clear!" },
  tab_all: { fa: "همه ({n})", en: "All ({n})" },
  tab_fav: { fa: "علاقه‌مندی‌ها ({n})", en: "Favorites ({n})" },
  empty_fav_title: { fa: "هنوز چیزی را نشان نکرده‌ای", en: "No favorites yet" },
  empty_all_title: { fa: "هنوز ترجمه‌ای انجام نشده", en: "No translations yet" },
  empty_fav_desc: { fa: "روی ستاره هر ترجمه بزن تا اینجا ذخیره شود و همیشه در دسترست باشد.", en: "Tap the star on any translation to keep it here." },
  empty_all_desc: { fa: "اولین متنت را بالا بنویس تا ترجمه شود و تاریخچه‌ات اینجا ساخته شود.", en: "Type your first text above and your history will appear here." },
  reuse: { fa: "استفاده مجدد", en: "Reuse" },
  fav_add: { fa: "افزودن به علاقه‌مندی‌ها", en: "Add to favorites" },
  fav_remove: { fa: "حذف از علاقه‌مندی‌ها", en: "Remove from favorites" },
  favorite: { fa: "علاقه‌مندی", en: "Favorite" },

  /* ---------- ویژگی‌ها ---------- */
  f1_title: { fa: "دو موتور ترجمه: گوگل و MyMemory", en: "Two engines: Google & MyMemory" },
  f1_desc: {
    fa: "بین موتور گوگل (کیفیت بالا) و MyMemory انتخاب کن، یا حالت خودکار را بگذار تا اگر یکی جواب نداد، دیگری ترجمه کند. متن‌های طولانی هم خودکار تکه‌تکه ترجمه می‌شوند.",
    en: "Pick Google (high quality) or MyMemory, or use Auto so one takes over if the other fails. Long texts are split and translated automatically.",
  },
  f2_title: { fa: "حریم خصوصی تو دست خودته", en: "Your privacy, your control" },
  f2_desc: {
    fa: "تاریخچه، علاقه‌مندی‌ها و تنظیمات فقط داخل مرورگر خودت (LocalStorage) ذخیره می‌شود و هیچ سروری آن‌ها را نمی‌بیند.",
    en: "History, favorites and settings live only in your browser (LocalStorage) — no server ever sees them.",
  },
  f3_title: { fa: "ترجمه با هوش مصنوعی، با کلید خودت", en: "AI translation with your own key" },
  f3_desc: {
    fa: "کلید API سرویس‌هایی مثل Gemini، OpenAI یا Groq را وارد کن تا با مدل انتخابی‌ات ترجمه‌ای روان‌تر و طبیعی‌تر بگیری. کلید فقط در مرورگر خودت می‌ماند.",
    en: "Add an API key from Gemini, OpenAI, Groq and more to get smoother, more natural translations from the model you choose. The key never leaves your browser.",
  },

  /* ---------- فوتر ---------- */
  footer_powered: { fa: "قدرت‌گرفته از موتورهای ترجمه گوگل و MyMemory • تاریخچه فقط در مرورگر تو ذخیره می‌شود", en: "Powered by Google & MyMemory • History is stored only in your browser" },
  footer_made: { fa: "ساخته‌شده با", en: "Made with" },
} as const;

export type DictKey = keyof typeof dict;
export type Vars = Record<string, string | number>;

export function translate(lang: UiLang, key: DictKey, vars?: Vars): string {
  let s: string = dict[key][lang];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.split(`{${k}}`).join(String(v));
    }
  }
  return s;
}

export interface I18n {
  lang: UiLang;
  dir: "rtl" | "ltr";
  isFa: boolean;
  setLang: (l: UiLang) => void;
  toggle: () => void;
  /** متن ترجمه‌شده */
  t: (key: DictKey, vars?: Vars) => string;
  /** عدد: در فارسی با ارقام فارسی، در انگلیسی با ارقام لاتین */
  n: (v: string | number) => string;
  /** نام یک زبان (fa / en) با کد آن */
  ln: (code: string) => string;
}

export function createI18n(lang: UiLang, setLang: (l: UiLang) => void): I18n {
  return {
    lang,
    dir: lang === "fa" ? "rtl" : "ltr",
    isFa: lang === "fa",
    setLang,
    toggle: () => setLang(lang === "fa" ? "en" : "fa"),
    t: (key, vars) => translate(lang, key, vars),
    n: (v) => (lang === "fa" ? toFa(v) : String(v)),
    ln: (code) => langByCode(code)[lang],
  };
}

export function readStoredLang(): UiLang {
  try {
    return localStorage.getItem(UI_LANG_KEY) === "en" ? "en" : "fa";
  } catch {
    return "fa";
  }
}

export const I18nContext = createContext<I18n>(createI18n("fa", () => {}));
export const useI18n = () => useContext(I18nContext);
