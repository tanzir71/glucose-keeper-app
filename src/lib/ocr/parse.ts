// Meter-photo OCR parser (03 §7). Pure. Turns OCR words into a single reading, or null.
import { PLAUSIBLE_MGDL, PLAUSIBLE_MMOL, mmolToMgdl } from "@/lib/clinical/thresholds";
import type { GlucoseUnit } from "@/types/domain";

export interface OcrWord {
  text: string;
  confidence: number; // 0–100
  bbox?: { x0: number; y0: number; x1: number; y1: number };
}

export interface ParsedReading {
  valueMgdl: number;
  confidence: number;
  unit: GlucoseUnit;
}

export const MIN_CONFIDENCE = 70;

interface Candidate {
  valueMgdl: number;
  unit: GlucoseUnit;
  confidence: number;
  height: number;
  centrality: number; // 0 (edge) – 1 (centre)
  preferred: boolean;
}

function tokens(word: OcrWord): string[] {
  // Keep digits and dots; split on anything else (meters show time, date and units too).
  return word.text
    .replace(/,/g, ".")
    .split(/[^\d.]+/)
    .map((s) => s.replace(/^\.+|\.+$/g, ""))
    .filter(Boolean);
}

/**
 * Pick the most plausible reading. A plausible mmol/L value is 1.0–33.3 with one decimal; a
 * plausible mg/dL value is an integer 18–600. The person's unit is preferred, then the
 * largest-font, then the most central token. Returns null when confidence is under 70 or nothing
 * is plausible.
 */
export function parseMeterWords(
  words: OcrWord[],
  unit: GlucoseUnit,
  image?: { width: number; height: number },
): ParsedReading | null {
  const cands: Candidate[] = [];
  for (const w of words) {
    for (const tok of tokens(w)) {
      const height = w.bbox ? w.bbox.y1 - w.bbox.y0 : 0;
      let centrality = 0.5;
      if (w.bbox && image) {
        const cx = (w.bbox.x0 + w.bbox.x1) / 2 / image.width;
        const cy = (w.bbox.y0 + w.bbox.y1) / 2 / image.height;
        centrality = 1 - Math.min(1, Math.hypot(cx - 0.5, cy - 0.5) / 0.7071);
      }
      if (/^\d{1,2}\.\d$/.test(tok)) {
        const v = Number(tok);
        if (v >= PLAUSIBLE_MMOL.min && v <= PLAUSIBLE_MMOL.max) {
          cands.push({ valueMgdl: mmolToMgdl(v), unit: "mmol/L", confidence: w.confidence, height, centrality, preferred: unit === "mmol/L" });
        }
      } else if (/^\d{2,3}$/.test(tok)) {
        const v = Number(tok);
        if (v >= PLAUSIBLE_MGDL.min && v <= PLAUSIBLE_MGDL.max) {
          cands.push({ valueMgdl: v, unit: "mg/dL", confidence: w.confidence, height, centrality, preferred: unit === "mg/dL" });
        }
      }
    }
  }
  if (!cands.length) return null;

  const maxH = Math.max(...cands.map((c) => c.height), 1);
  const score = (c: Candidate) => (c.preferred ? 2 : 0) + (c.height / maxH) * 1.5 + c.centrality;
  cands.sort((a, b) => score(b) - score(a));
  const best = cands[0];

  // A close runner-up of a different value makes the read less certain.
  let confidence = best.confidence;
  const rival = cands.find((c) => c.valueMgdl !== best.valueMgdl);
  if (rival && score(best) - score(rival) < 0.3) confidence -= 20;

  if (confidence < MIN_CONFIDENCE) return null;
  return { valueMgdl: best.valueMgdl, confidence: Math.round(confidence), unit: best.unit };
}
