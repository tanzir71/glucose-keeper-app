// On-device meter OCR (03 §7). tesseract.js is dynamically imported and runs in its own worker.
// Every asset is self-hosted under BASE_URL (scripts/copy-ocr-assets.mjs). The photo never
// leaves the phone.
import type { GlucoseUnit } from "@/types/domain";
import { parseMeterWords, type OcrWord, type ParsedReading } from "./parse";

export const OCR_TIME_BUDGET_MS = 8000;
const BASE = import.meta.env.BASE_URL;

interface Variant {
  crop: number; // fraction of the frame kept, centred (meter displays sit mid-photo)
  invert: boolean;
}

/**
 * Spike finding (M3.0, synthetic meter images): a light LCD inside a dark meter body reads as
 * nothing at full frame, but reads at 0.5–0.6 centre crops; a dark display reads at full frame.
 * So we try several variants and stop at the first confident read.
 */
export const VARIANTS: Variant[] = [
  { crop: 0.6, invert: false },
  { crop: 1, invert: false },
  { crop: 0.5, invert: false },
  { crop: 1, invert: true },
  { crop: 0.6, invert: true },
];
const PAD = 20;

/** Centre-crop, grayscale + contrast stretch (+ optional inversion), then pad with white. */
async function preprocess(bmp: ImageBitmap, v: Variant): Promise<HTMLCanvasElement> {
  const scale = Math.min(1, 1000 / Math.max(bmp.width, bmp.height));
  const sw = bmp.width * v.crop;
  const sh = bmp.height * v.crop;
  const width = Math.round(sw * scale);
  const height = Math.round(sh * scale);
  const work = document.createElement("canvas");
  work.width = width;
  work.height = height;
  const ctx = work.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(bmp, (bmp.width - sw) / 2, (bmp.height - sh) / 2, sw, sh, 0, 0, width, height);
  const img = ctx.getImageData(0, 0, width, height);
  const d = img.data;
  let min = 255;
  let max = 0;
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    d[i] = g;
    if (g < min) min = g;
    if (g > max) max = g;
  }
  const span = Math.max(1, max - min);
  for (let i = 0; i < d.length; i += 4) {
    let g = ((d[i] - min) / span) * 255;
    if (v.invert) g = 255 - g;
    d[i] = d[i + 1] = d[i + 2] = g;
  }
  ctx.putImageData(img, 0, 0);
  const out = document.createElement("canvas");
  out.width = width + PAD * 2;
  out.height = height + PAD * 2;
  const o = out.getContext("2d")!;
  o.fillStyle = "#fff";
  o.fillRect(0, 0, out.width, out.height);
  o.drawImage(work, PAD, PAD);
  return out;
}

async function recognise(blob: Blob, unit: GlucoseUnit, deadline: number): Promise<ParsedReading | null> {
  const { createWorker, OEM, PSM } = await import("tesseract.js");
  const worker = await createWorker("eng", OEM.LSTM_ONLY, {
    workerPath: `${BASE}tesseract/worker.min.js`,
    corePath: `${BASE}tesseract/`,
    langPath: `${BASE}tessdata`,
    workerBlobURL: false,
    gzip: true,
  });
  const bmp = await createImageBitmap(blob);
  try {
    await worker.setParameters({
      tessedit_char_whitelist: "0123456789.",
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    });
    let best: ParsedReading | null = null;
    for (const v of VARIANTS) {
      if (Date.now() > deadline) break;
      const canvas = await preprocess(bmp, v);
      const { data } = await worker.recognize(canvas, {}, { blocks: true });
      const words: OcrWord[] = [];
      for (const b of data.blocks ?? []) for (const p of b.paragraphs) for (const l of p.lines) for (const wd of l.words) words.push({ text: wd.text, confidence: wd.confidence, bbox: wd.bbox });
      const r = parseMeterWords(words, unit, { width: canvas.width, height: canvas.height });
      if (r && (!best || r.confidence > best.confidence)) best = r;
      if (best && best.confidence >= 85) break;
    }
    return best;
  } finally {
    bmp.close();
    await worker.terminate();
  }
}

/** Read a meter photo on the device. Resolves null on failure or after the 8 s budget. */
export async function readMeter(blob: Blob, unit: GlucoseUnit, budgetMs = OCR_TIME_BUDGET_MS): Promise<ParsedReading | null> {
  let timer: number | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = window.setTimeout(() => resolve(null), budgetMs);
  });
  try {
    return await Promise.race([recognise(blob, unit, Date.now() + budgetMs - 500).catch(() => null), timeout]);
  } finally {
    window.clearTimeout(timer);
  }
}
