/* ============================================================
   خروجی PDF از ترجمه — کارت سبز تیره با قاب طلایی
   بدون کتابخانه خارجی: هر صفحه با Canvas رندر می‌شود و به‌صورت
   تصویر JPEG داخل یک فایل PDF دست‌ساز قرار می‌گیرد.
   متن‌های طولانی خودکار چندصفحه‌ای می‌شوند.
   ============================================================ */
import type { I18n } from "./i18n";
import type { EngineUsed } from "./translator";

export interface PdfInput {
  sourceText: string;
  translatedText: string;
  /** کد زبان مبدأ (تشخیص‌داده‌شده) */
  src: string;
  tgt: string;
  engine: EngineUsed;
  /** برای موتور custom: نام سرویس و مدل (مثلاً «Google Gemini» / «gemini-2.0-flash») */
  providerName?: string;
  modelName?: string;
  i18n: I18n;
}

type Bytes = Uint8Array<ArrayBuffer>;

/* ---------- اندازه‌ها (واحد منطقی؛ نسبت A4) ---------- */
const W = 1080;
const H = 1527;
const PT_W = 595.28;
const PT_H = 841.89;
const SCALE = 2;
const FRAME = 40;
const MARGIN = 84;
const TOP = 96;
const BOTTOM = 210;
const CARD_PAD = 40;
const CARD_HEAD = 104;
const CARD_FOOT = 24;
const GAP = 28;
const INFO_H = 268;

const FONT = 'Vazirmatn, "Segoe UI", Tahoma, Arial, sans-serif';
const font = (weight: number, size: number) => `${weight} ${size}px ${FONT}`;

const C = {
  gold: "#ddb254",
  goldLine: "rgba(221,178,84,0.55)",
  goldSoft: "rgba(221,178,84,0.22)",
  card: "rgba(255,255,255,0.05)",
  cardLine: "rgba(255,255,255,0.10)",
  white: "#ffffff",
  muted: "rgba(255,255,255,0.62)",
  faint: "rgba(255,255,255,0.40)",
  clay1: "#e4572e",
  clay2: "#d14e26",
};

/* ---------- آیکون‌ها (مسیرهای SVG در viewBox 24) ---------- */
const ICONS = {
  languages: ["m5 8 6 6", "m4 14 6-6 2-3", "M2 5h12", "M7 2h1", "m22 22-5-10-5 10", "M14 18h6"],
  globe: ["M22 12a10 10 0 1 1-20 0 10 10 0 1 1 20 0", "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20", "M2 12h20"],
  calendar: ["M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", "M16 2v4", "M8 2v4", "M3 10h18"],
} as const;

const GOOGLE_G: [string, string][] = [
  ["#EA4335", "M12 5.4c1.9 0 3.2.8 3.9 1.5l2.9-2.8C17 2.4 14.7 1.4 12 1.4 7.9 1.4 4.3 3.8 2.6 7.2l3.3 2.6c.8-2.5 3.2-4.4 6.1-4.4z"],
  ["#4285F4", "M22.2 12.2c0-.9-.1-1.5-.2-2.2H12v4h5.8c-.1 1-.8 2.4-2.2 3.4l3.2 2.5c1.9-1.8 3.4-4.4 3.4-7.7z"],
  ["#FBBC05", "M5.9 14.2c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2L2.6 7.2C1.8 8.7 1.4 10.3 1.4 12s.4 3.3 1.2 4.8l3.3-2.6z"],
  ["#34A853", "M12 22.6c2.9 0 5.3-.9 7-2.6l-3.2-2.5c-.9.6-2.1 1-3.8 1-2.9 0-5.3-1.9-6.1-4.4l-3.3 2.6c1.7 3.4 5.3 5.9 9.4 5.9z"],
];

type Ctx = CanvasRenderingContext2D;

/* ---------- ابزارهای رسم ---------- */
function rrect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function hline(ctx: Ctx, x1: number, x2: number, y: number, color: string, lw = 1.2) {
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.stroke();
}

function vline(ctx: Ctx, x: number, y1: number, y2: number, color: string, lw = 1.2) {
  ctx.beginPath();
  ctx.moveTo(x, y1);
  ctx.lineTo(x, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.stroke();
}

function dot(ctx: Ctx, x: number, y: number, r: number, color: string) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

/** ستاره چهارپر (✦) */
function star(ctx: Ctx, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx, cy, cx + r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + r);
  ctx.quadraticCurveTo(cx, cy, cx - r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - r);
  ctx.closePath();
}

function glow(ctx: Ctx, x: number, y: number, r: number, color: string) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function icon(ctx: Ctx, name: keyof typeof ICONS, x: number, y: number, size: number, color: string, lw = 2) {
  ctx.save();
  ctx.translate(x, y);
  const s = size / 24;
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const d of ICONS[name]) ctx.stroke(new Path2D(d));
  ctx.restore();
}

function googleG(ctx: Ctx, x: number, y: number, size: number) {
  ctx.save();
  ctx.translate(x, y);
  const s = size / 24;
  ctx.scale(s, s);
  for (const [color, d] of GOOGLE_G) {
    ctx.fillStyle = color;
    ctx.fill(new Path2D(d));
  }
  ctx.restore();
}

function drawText(ctx: Ctx, s: string, x: number, y: number, align: CanvasTextAlign, rtl: boolean) {
  try {
    ctx.direction = rtl ? "rtl" : "ltr";
  } catch {
    /* مرورگرهای قدیمی */
  }
  ctx.textAlign = align;
  ctx.fillText(s, x, y);
}

/* ---------- جهت متن و شکستن خطوط ---------- */
const RTL_RE = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
const STRONG_RE =
  /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]|[A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF\u0900-\u097F\u0E00-\u0E7F\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/;

function isRtl(text: string, fallback: boolean): boolean {
  const m = text.match(STRONG_RE);
  return m ? RTL_RE.test(m[0]) : fallback;
}

function wrap(ctx: Ctx, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of text.replace(/\r/g, "").split("\n")) {
    if (!para.trim()) {
      out.push("");
      continue;
    }
    const words = para.split(/\s+/).filter(Boolean);
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width <= maxW) {
        line = test;
        continue;
      }
      if (line) out.push(line);
      if (ctx.measureText(w).width <= maxW) {
        line = w;
        continue;
      }
      // کلمه خیلی طولانی (مثل لینک): شکستن حرف‌به‌حرف
      let cur = "";
      for (const ch of Array.from(w)) {
        if (cur && ctx.measureText(cur + ch).width > maxW) {
          out.push(cur);
          cur = ch;
        } else {
          cur += ch;
        }
      }
      line = cur;
    }
    if (line) out.push(line);
  }
  return out;
}

/* ---------- تاریخ و زمان ---------- */
function stamp(i18n: I18n): string {
  const d = new Date();
  const p2 = (v: number) => String(v).padStart(2, "0");
  if (i18n.isFa) {
    try {
      const date = new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
      const time = new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
      return `${date} | ${time}`;
    } catch {
      /* در ادامه، قالب میلادی */
    }
  }
  return `${d.getFullYear()}/${p2(d.getMonth() + 1)}/${p2(d.getDate())} | ${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

/* ============================================================
   نقاش صفحه‌ها
   در حالت dry فقط چیدمان محاسبه می‌شود (برای شمردن صفحات)؛
   در حالت واقعی هر صفحه بعد از اتمام به JPEG تبدیل و آزاد می‌شود.
   ============================================================ */
class Painter {
  pageCount = 0;
  jpegs: Bytes[] = [];
  y = TOP;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: Ctx | null = null;
  private readonly mctx: Ctx;

  constructor(
    readonly i18n: I18n,
    readonly dry: boolean,
    readonly totalPages: number
  ) {
    const mc = document.createElement("canvas");
    mc.width = 8;
    mc.height = 8;
    const m = mc.getContext("2d");
    if (!m) throw new Error("canvas unsupported");
    this.mctx = m;
  }

  get bottom() {
    return H - BOTTOM;
  }

  async newPage() {
    await this.closePage();
    this.pageCount += 1;
    this.y = TOP;
    if (this.dry) return;
    const c = document.createElement("canvas");
    c.width = W * SCALE;
    c.height = H * SCALE;
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("canvas context");
    ctx.scale(SCALE, SCALE);
    this.canvas = c;
    this.ctx = ctx;
    this.background(ctx);
  }

  async ensure(h: number) {
    if (this.y + h > this.bottom) await this.newPage();
  }

  async finish() {
    await this.closePage();
  }

  private async closePage() {
    const c = this.canvas;
    const ctx = this.ctx;
    if (!c || !ctx) return;
    if (this.totalPages > 1) {
      const { t, n, isFa } = this.i18n;
      ctx.font = font(600, 18);
      ctx.fillStyle = C.faint;
      ctx.textBaseline = "middle";
      drawText(ctx, t("pdf_page", { a: n(this.pageCount), b: n(this.totalPages) }), W / 2, H - 78, "center", isFa);
    }
    this.jpegs.push(await canvasToJpeg(c));
    c.width = 0;
    c.height = 0;
    this.canvas = null;
    this.ctx = null;
  }

  /* ----- پس‌زمینه، الگو و قاب طلایی ----- */
  private background(ctx: Ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0c2826");
    g.addColorStop(0.5, "#0e312e");
    g.addColorStop(1, "#0a2220");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    glow(ctx, W * 0.82, 110, 380, "rgba(228,87,46,0.16)");
    glow(ctx, W * 0.14, H * 0.38, 360, "rgba(221,178,84,0.10)");
    glow(ctx, W * 0.62, H * 0.96, 440, "rgba(26,90,87,0.40)");

    // الگوی گره‌چینی
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let cx = 48; cx < W; cx += 96) {
      for (let cy = 48; cy < H; cy += 96) {
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.stroke();
        for (const [dx, dy] of [[0, -40], [0, 40], [-40, 0], [40, 0]]) {
          ctx.beginPath();
          ctx.moveTo(cx + dx, cy + dy - 8);
          ctx.lineTo(cx + dx + 8, cy + dy);
          ctx.lineTo(cx + dx, cy + dy + 8);
          ctx.lineTo(cx + dx - 8, cy + dy);
          ctx.closePath();
          ctx.stroke();
        }
      }
    }
    ctx.restore();

    // قاب دوخطه طلایی
    ctx.strokeStyle = C.goldLine;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(FRAME, FRAME, W - FRAME * 2, H - FRAME * 2);
    ctx.strokeStyle = C.goldSoft;
    ctx.lineWidth = 1;
    ctx.strokeRect(FRAME + 9, FRAME + 9, W - (FRAME + 9) * 2, H - (FRAME + 9) * 2);

    // تزیین گوشه‌ها
    const i = FRAME + 9;
    this.corner(ctx, i, i, 1, 1);
    this.corner(ctx, W - i, i, -1, 1);
    this.corner(ctx, i, H - i, 1, -1);
    this.corner(ctx, W - i, H - i, -1, -1);
  }

  private corner(ctx: Ctx, x: number, y: number, sx: number, sy: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, sy);
    ctx.strokeStyle = "rgba(221,178,84,0.8)";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(26, 26, 16, Math.PI, Math.PI * 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(26, 26, 9, Math.PI, Math.PI * 1.5);
    ctx.stroke();
    star(ctx, 26, 26, 6);
    ctx.fillStyle = C.gold;
    ctx.fill();
    dot(ctx, 8, 34, 1.8, C.gold);
    dot(ctx, 34, 8, 1.8, C.gold);
    ctx.restore();
  }

  private divider(ctx: Ctx, y: number) {
    const cx = W / 2;
    hline(ctx, MARGIN, cx - 28, y, C.goldLine);
    hline(ctx, cx + 28, W - MARGIN, y, C.goldLine);
    star(ctx, cx, y, 9);
    ctx.fillStyle = C.gold;
    ctx.fill();
    dot(ctx, cx - 18, y, 1.8, C.gold);
    dot(ctx, cx + 18, y, 1.8, C.gold);
  }

  /* ----- سربرگ (فقط صفحه اول) ----- */
  header() {
    const { t, isFa } = this.i18n;
    const logo = 84;
    const gap = 22;
    const y = this.y;
    this.mctx.font = font(900, 50);
    const tw = this.mctx.measureText(t("brand")).width;
    this.mctx.font = font(500, 24);
    const sw = this.mctx.measureText(t("pdf_subtitle")).width;
    const total = logo + gap + Math.max(tw, sw);
    const x0 = Math.round((W - total) / 2);
    const ctx = this.ctx;
    if (ctx) {
      rrect(ctx, x0, y, logo, logo, 22);
      const g = ctx.createLinearGradient(x0, y, x0 + logo, y + logo);
      g.addColorStop(0, C.clay1);
      g.addColorStop(1, C.clay2);
      ctx.save();
      ctx.shadowColor = "rgba(228,87,46,0.45)";
      ctx.shadowBlur = 26;
      ctx.shadowOffsetY = 10;
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
      icon(ctx, "languages", x0 + logo * 0.2, y + logo * 0.2, logo * 0.6, "#fff", 2.2);

      ctx.textBaseline = "middle";
      const ax = isFa ? x0 + total : x0 + logo + gap;
      const al: CanvasTextAlign = isFa ? "right" : "left";
      ctx.font = font(900, 50);
      ctx.fillStyle = C.white;
      drawText(ctx, t("brand"), ax, y + 28, al, isFa);
      ctx.font = font(500, 24);
      ctx.fillStyle = C.muted;
      drawText(ctx, t("pdf_subtitle"), ax, y + 68, al, isFa);
    }
    this.y = y + logo + 46;
    if (ctx) this.divider(ctx, this.y);
    this.y += 46;
  }

  /* ----- برچسب گرد (کد زبان یا عنوان کارت) ----- */
  private pill(ctx: Ctx, x: number, y: number, text: string, gold: boolean, anchor: "left" | "right", rtl: boolean) {
    const h = 44;
    ctx.font = font(700, 20);
    const tw = ctx.measureText(text).width;
    const iconW = gold ? 22 + 10 : 0;
    const w = Math.ceil(tw + iconW + 40);
    const px = anchor === "right" ? x - w : x;
    rrect(ctx, px, y, w, h, h / 2);
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fill();
    ctx.strokeStyle = gold ? "rgba(221,178,84,0.85)" : "rgba(255,255,255,0.22)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = gold ? C.gold : C.muted;
    ctx.textBaseline = "middle";
    const cy = y + h / 2 + 1;
    if (gold) {
      if (rtl) {
        drawText(ctx, text, px + 20, cy, "left", false);
        icon(ctx, "globe", px + w - 20 - 22, y + 11, 22, C.gold, 1.9);
      } else {
        icon(ctx, "globe", px + 20, y + 11, 22, C.gold, 1.9);
        drawText(ctx, text, px + w - 20, cy, "right", false);
      }
    } else {
      drawText(ctx, text, px + w / 2, cy, "center", rtl);
    }
  }

  /* ----- کارت متن (مبدأ / ترجمه) — در صورت نیاز چندصفحه‌ای ----- */
  async textCard(text: string, label: string, code: string, baseSize: number) {
    const { t, isFa } = this.i18n;
    const rtl = isRtl(text, isFa);
    const len = text.length;
    const size = len > 1500 ? 24 : len > 600 ? 28 : len > 180 ? 32 : baseSize;
    const lh = Math.round(size * 1.8);
    const innerW = W - MARGIN * 2 - CARD_PAD * 2;
    this.mctx.font = font(700, size);
    const lines = wrap(this.mctx, text, innerW);
    if (!lines.length) lines.push("");

    let first = true;
    let i = 0;
    while (i < lines.length) {
      await this.ensure(CARD_HEAD + lh + CARD_FOOT);
      const avail = this.bottom - this.y - CARD_HEAD - CARD_FOOT;
      const fit = Math.max(1, Math.floor(avail / lh));
      const chunk = lines.slice(i, i + fit);
      i += chunk.length;
      const cardH = CARD_HEAD + chunk.length * lh + CARD_FOOT;

      const ctx = this.ctx;
      if (ctx) {
        const x = MARGIN;
        const y = this.y;
        const w = W - MARGIN * 2;
        rrect(ctx, x, y, w, cardH, 30);
        ctx.fillStyle = C.card;
        ctx.fill();
        ctx.strokeStyle = C.cardLine;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const lbl = first ? label : `${label} (${t("pdf_continued")})`;
        this.pill(ctx, x + w - CARD_PAD, y + 32, code.toUpperCase(), true, "right", isFa);
        this.pill(ctx, x + CARD_PAD, y + 32, lbl, false, "left", isFa);

        ctx.font = font(700, size);
        ctx.fillStyle = C.white;
        ctx.textBaseline = "middle";
        chunk.forEach((line, k) => {
          const lr = isRtl(line, rtl);
          const cy = y + CARD_HEAD + k * lh + lh / 2;
          drawText(ctx, line, lr ? x + w - CARD_PAD : x + CARD_PAD, cy, lr ? "right" : "left", lr);
        });
      }
      this.y += cardH + GAP;
      first = false;
    }
  }

  /* ----- کارت اطلاعات (موتور، زبان‌ها، تاریخ) ----- */
  async infoCard(src: string, tgt: string, engine: EngineUsed, providerName?: string, modelName?: string) {
    const { t, ln, isFa } = this.i18n;
    await this.ensure(INFO_H);
    const ctx = this.ctx;
    if (ctx) {
      const x = MARGIN;
      const y = this.y;
      const w = W - MARGIN * 2;
      rrect(ctx, x, y, w, INFO_H, 30);
      ctx.fillStyle = C.card;
      ctx.fill();
      ctx.strokeStyle = C.cardLine;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // موتور ترجمه
      const lx = x + 36;
      const ly = y + 32;
      const ls = 64;
      if (engine === "google") {
        ctx.beginPath();
        ctx.arc(lx + ls / 2, ly + ls / 2, ls / 2, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        googleG(ctx, lx + ls / 2 - 18, ly + ls / 2 - 18, 36);
      } else if (engine === "custom") {
        // نشان طلایی با حرف اول نام سرویس
        rrect(ctx, lx, ly, ls, ls, 18);
        const g = ctx.createLinearGradient(lx, ly, lx + ls, ly + ls);
        g.addColorStop(0, "#ddb254");
        g.addColorStop(1, "#c99a2e");
        ctx.fillStyle = g;
        ctx.fill();
        ctx.font = font(900, 30);
        ctx.fillStyle = "#0e312e";
        ctx.textBaseline = "middle";
        drawText(ctx, (providerName ?? "AI").trim().charAt(0).toUpperCase(), lx + ls / 2, ly + ls / 2 + 1, "center", false);
      } else {
        rrect(ctx, lx, ly, ls, ls, 18);
        const g = ctx.createLinearGradient(lx, ly, lx + ls, ly + ls);
        g.addColorStop(0, "#fb923c");
        g.addColorStop(1, "#f43f5e");
        ctx.fillStyle = g;
        ctx.fill();
        ctx.font = font(900, 30);
        ctx.fillStyle = "#fff";
        ctx.textBaseline = "middle";
        drawText(ctx, "M", lx + ls / 2, ly + ls / 2 + 1, "center", false);
      }
      const tx = lx + ls + 22;
      ctx.textBaseline = "middle";
      ctx.font = font(800, 27);
      ctx.fillStyle = C.white;
      drawText(ctx, t("target_label", { lang: ln(tgt) }), tx, y + 50, "left", isFa);
      ctx.font = font(500, 22);
      ctx.fillStyle = C.muted;
      const engineLine =
        engine === "google"
          ? "Google Translate"
          : engine === "custom"
            ? [providerName ?? "AI", modelName].filter(Boolean).join(" • ")
            : "MyMemory Translated";
      drawText(ctx, engineLine, tx, y + 86, "left", false);

      hline(ctx, x + 24, x + w - 24, y + 128, C.cardLine);

      // سه ستون: زبان مقصد، زبان مبدأ، تاریخ و زمان
      const colTop = y + 128;
      const cols = [
        { label: t("pdf_target_lang"), value: ln(tgt), badge: tgt.toUpperCase(), size: 26 },
        { label: t("pdf_source_lang"), value: ln(src), badge: src.toUpperCase(), size: 26 },
        { label: t("pdf_datetime"), value: stamp(this.i18n), badge: "", size: 23 },
      ];
      const widths = [0.29, 0.29, 0.42].map((f) => w * f);
      let cursor = 0;
      cols.forEach((c, k) => {
        const cw = widths[k];
        const colX = isFa ? x + w - cursor - cw : x + cursor;
        cursor += cw;
        if (k > 0) vline(ctx, isFa ? colX + cw : colX, colTop + 24, y + INFO_H - 24, C.cardLine);

        const bx = isFa ? colX + cw - 32 - 40 : colX + 32;
        const by = colTop + 26;
        if (c.badge) {
          rrect(ctx, bx, by, 40, 40, 12);
          ctx.strokeStyle = "rgba(221,178,84,0.8)";
          ctx.lineWidth = 1.4;
          ctx.stroke();
          ctx.font = font(800, 15);
          ctx.fillStyle = C.gold;
          ctx.textBaseline = "middle";
          drawText(ctx, c.badge, bx + 20, by + 21, "center", false);
        } else {
          icon(ctx, "calendar", bx + 6, by + 6, 28, C.gold, 1.9);
        }
        const tx2 = isFa ? bx - 16 : bx + 40 + 16;
        const al: CanvasTextAlign = isFa ? "right" : "left";
        ctx.font = font(500, 21);
        ctx.fillStyle = C.muted;
        drawText(ctx, c.label, tx2, colTop + 46, al, isFa);
        ctx.font = font(800, c.size);
        ctx.fillStyle = C.white;
        drawText(ctx, c.value, tx2, colTop + 94, al, isRtl(c.value, isFa));
      });
    }
    this.y += INFO_H + GAP;
  }

  /* ----- پانوشت (صفحه آخر) ----- */
  footer() {
    const ctx = this.ctx;
    if (!ctx) return;
    this.divider(ctx, H - 176);
    ctx.font = font(500, 22);
    ctx.fillStyle = C.faint;
    ctx.textBaseline = "middle";
    drawText(ctx, "Text Translator", W / 2, H - 130, "center", false);
  }
}

/* ---------- تبدیل بوم به JPEG ---------- */
function canvasToJpeg(c: HTMLCanvasElement): Promise<Bytes> {
  return new Promise((resolve, reject) => {
    const fromBlob = (b: Blob | null) => {
      if (!b) {
        reject(new Error("toBlob failed"));
        return;
      }
      const fr = new FileReader();
      fr.onload = () => resolve(new Uint8Array(fr.result as ArrayBuffer));
      fr.onerror = () => reject(fr.error ?? new Error("read failed"));
      fr.readAsArrayBuffer(b);
    };
    try {
      if (typeof c.toBlob === "function") {
        c.toBlob(fromBlob, "image/jpeg", 0.9);
      } else {
        const bin = atob(c.toDataURL("image/jpeg", 0.9).split(",")[1] ?? "");
        const out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        resolve(out);
      }
    } catch (e) {
      reject(e);
    }
  });
}

/* ---------- ساخت فایل PDF (بدون کتابخانه) ---------- */
function buildPdf(jpegs: Bytes[], pxW: number, pxH: number): Blob {
  const enc = new TextEncoder();
  const parts: (string | Bytes)[] = [];
  const offsets: number[] = [];
  let pos = 0;

  const put = (d: string | Bytes) => {
    const b = typeof d === "string" ? enc.encode(d) : d;
    parts.push(b);
    pos += b.byteLength;
  };
  const obj = (num: number, body: string, stream?: Bytes) => {
    offsets[num] = pos;
    put(`${num} 0 obj\n${body}\n`);
    if (stream) {
      put("stream\n");
      put(stream);
      put("\nendstream\n");
    }
    put("endobj\n");
  };

  put("%PDF-1.4\n");
  put(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  const n = jpegs.length;
  const pageObj = (i: number) => 3 + i * 3;
  const imgObj = (i: number) => 4 + i * 3;
  const contentObj = (i: number) => 5 + i * 3;
  const total = 3 + n * 3;

  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, `<< /Type /Pages /Kids [${jpegs.map((_, i) => `${pageObj(i)} 0 R`).join(" ")}] /Count ${n} >>`);
  jpegs.forEach((jpg, i) => {
    obj(
      pageObj(i),
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PT_W} ${PT_H}] /Resources << /ProcSet [/PDF /ImageC] /XObject << /Im0 ${imgObj(i)} 0 R >> >> /Contents ${contentObj(i)} 0 R >>`
    );
    obj(
      imgObj(i),
      `<< /Type /XObject /Subtype /Image /Width ${pxW} /Height ${pxH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.byteLength} >>`,
      jpg
    );
    const content = enc.encode(`q ${PT_W} 0 0 ${PT_H} 0 0 cm /Im0 Do Q`);
    obj(contentObj(i), `<< /Length ${content.byteLength} >>`, content);
  });

  const xref = pos;
  let table = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let i = 1; i < total; i++) table += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  put(table);
  put(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);

  return new Blob(parts, { type: "application/pdf" });
}

/* ---------- فونت، دانلود، نام فایل ---------- */
async function loadFonts() {
  if (!("fonts" in document)) return;
  const specs = ["900 50px Vazirmatn", "800 27px Vazirmatn", "700 36px Vazirmatn", "600 18px Vazirmatn", "500 24px Vazirmatn"];
  const all = Promise.all(specs.map((s) => document.fonts.load(s).catch(() => [] as FontFace[])));
  await Promise.race([all, new Promise<void>((r) => setTimeout(r, 3500))]);
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 20000);
}

function fileName(): string {
  const d = new Date();
  const p2 = (v: number) => String(v).padStart(2, "0");
  return `translation-${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}.pdf`;
}

async function layout(p: Painter, input: PdfInput) {
  const { t } = p.i18n;
  await p.newPage();
  p.header();
  await p.textCard(input.sourceText.trim() || "—", t("source_label"), input.src, 36);
  await p.textCard(input.translatedText.trim() || "—", t("pdf_translation"), input.tgt, 40);
  await p.infoCard(input.src, input.tgt, input.engine, input.providerName, input.modelName);
  p.footer();
  await p.finish();
}

/** ساخت و دانلود PDF ترجمه */
export async function exportTranslationPdf(input: PdfInput): Promise<void> {
  await loadFonts();
  // گذر اول: فقط شمارش صفحات
  const dry = new Painter(input.i18n, true, 0);
  await layout(dry, input);
  // گذر دوم: رندر واقعی با شماره صفحه
  const painter = new Painter(input.i18n, false, dry.pageCount);
  await layout(painter, input);
  if (!painter.jpegs.length) throw new Error("empty");
  download(buildPdf(painter.jpegs, W * SCALE, H * SCALE), fileName());
}
