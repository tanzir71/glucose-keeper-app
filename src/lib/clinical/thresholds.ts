// [CLINICAL-REVIEW] Every clinical number Keeper uses lives in this file, so a clinician can
// review and change it in one place. All values are in mg/dL.
// Display: mmol/L = mg/dL / 18 (1 decimal).

export const THRESHOLDS = {
  safetyLow: 70, // < 70 (3.9 mmol/L): never sealed → Low safety screen (D6)
  safetyVeryHigh: 250, // > 250 (13.9 mmol/L): never sealed → High safety screen
  fastBreakLow: 70, // < 70 (3.9 mmol/L): end / break the fast (IDF–DAR 2021)
  fastBreakHigh: 300, // > 300 (16.7 mmol/L): end / break the fast (IDF–DAR 2021)
} as const;

// Same as v1's getGlucoseLevel (70–180). User-editable only via "Set with your care team".
export const DEFAULT_TARGET_RANGE = { lowMgdl: 70, highMgdl: 180 } as const;

// "A little above/below" wording applies within this distance of the range edge.
export const NEAR_EDGE_MGDL = 30;

// [CLINICAL-REVIEW] Low-reading recheck timer (D6).
export const LOW_RECHECK_MINUTES = 15;

// [CLINICAL-REVIEW] Weight softening rule (05 §4.7).
export const RAPID_LOSS_KG_PER_WEEK = 1.0;
export const RAPID_LOSS_WEEKS = 3;
export const SKIPPED_MEALS_PER_WEEK = 3;
export const WEIGHT_MIN_DAYS_BETWEEN = 6;

// [CLINICAL-REVIEW] Plausible meter values, used by OCR parsing and the typed path.
export const PLAUSIBLE_MGDL = { min: 18, max: 600 } as const;
export const PLAUSIBLE_MMOL = { min: 1.0, max: 33.3 } as const;

// [CLINICAL-REVIEW] Fasting coaching limits (CLAUDE.md rule 7): never coach an eating window
// under 8 h or a fast over 24 h.
export const MIN_EATING_WINDOW_HOURS = 8;
export const MAX_COACHED_FAST_HOURS = 24;

// [CLINICAL-REVIEW] Emergency numbers by country. Anything not listed falls back to copy
// "your local emergency number".
export const EMERGENCY_NUMBERS: Record<string, string> = {
  BD: "999",
};

export type Band = "below" | "in" | "above";
export type Safety = "none" | "low" | "very-high";
export type TargetRange = { lowMgdl: number; highMgdl: number };

export function classifyReading(v: number, r: TargetRange = DEFAULT_TARGET_RANGE): { band: Band; safety: Safety } {
  const band: Band = v < r.lowMgdl ? "below" : v > r.highMgdl ? "above" : "in";
  const safety: Safety = v < THRESHOLDS.safetyLow ? "low" : v > THRESHOLDS.safetyVeryHigh ? "very-high" : "none";
  return { band, safety };
}

export type BandLabelKey = "in" | "littleAbove" | "above" | "littleBelow" | "below";

/**
 * Which band label to show: "In your range" · "A little above your range" (≤ high+30) ·
 * "Above your range" · "A little below your range" (≥ low−30 and not safety-low) ·
 * "Below your range". The strings themselves live in src/copy/en.ts.
 */
export function bandLabelKey(v: number, r: TargetRange = DEFAULT_TARGET_RANGE): BandLabelKey {
  const { band, safety } = classifyReading(v, r);
  if (band === "in") return "in";
  if (band === "above") return v <= r.highMgdl + NEAR_EDGE_MGDL ? "littleAbove" : "above";
  return v >= r.lowMgdl - NEAR_EDGE_MGDL && safety !== "low" ? "littleBelow" : "below";
}

/** True when a reading should end or break a fast (05 §4.6). */
export function breaksFast(v: number): boolean {
  return v < THRESHOLDS.fastBreakLow || v > THRESHOLDS.fastBreakHigh;
}

export const mgdlToMmol = (mgdl: number): number => Math.round((mgdl / 18) * 10) / 10;
export const mmolToMgdl = (mmol: number): number => Math.round(mmol * 18);

export function formatGlucose(mgdl: number, unit: "mmol/L" | "mg/dL"): string {
  return unit === "mmol/L" ? mgdlToMmol(mgdl).toFixed(1) : String(Math.round(mgdl));
}

/** Parse a user-typed value in the given unit into mg/dL, or null if not plausible. */
export function parseTypedGlucose(raw: string, unit: "mmol/L" | "mg/dL"): number | null {
  const v = Number(raw.replace(",", ".").trim());
  if (!raw.trim() || !Number.isFinite(v)) return null;
  if (unit === "mmol/L") {
    if (v < PLAUSIBLE_MMOL.min || v > PLAUSIBLE_MMOL.max) return null;
    return mmolToMgdl(v);
  }
  if (v < PLAUSIBLE_MGDL.min || v > PLAUSIBLE_MGDL.max) return null;
  return Math.round(v);
}
