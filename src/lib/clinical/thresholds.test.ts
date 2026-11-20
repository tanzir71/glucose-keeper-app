import { describe, expect, it } from "vitest";
import {
  bandLabelKey,
  breaksFast,
  classifyReading,
  formatGlucose,
  mgdlToMmol,
  mmolToMgdl,
  parseTypedGlucose,
} from "./thresholds";

describe("classifyReading boundaries (mg/dL)", () => {
  it.each([
    // [value, band, safety]
    [69, "below", "low"],
    [70, "in", "none"],
    [71, "in", "none"],
    [179, "in", "none"],
    [180, "in", "none"],
    [181, "above", "none"],
    [249, "above", "none"],
    [250, "above", "none"],
    [251, "above", "very-high"],
    [299, "above", "very-high"],
    [300, "above", "very-high"],
    [301, "above", "very-high"],
  ] as const)("%i mg/dL → band %s, safety %s", (v, band, safety) => {
    expect(classifyReading(v)).toEqual({ band, safety });
  });

  it("uses a custom target range for the band but never for safety", () => {
    expect(classifyReading(75, { lowMgdl: 80, highMgdl: 140 })).toEqual({ band: "below", safety: "none" });
    expect(classifyReading(150, { lowMgdl: 80, highMgdl: 140 })).toEqual({ band: "above", safety: "none" });
    expect(classifyReading(65, { lowMgdl: 60, highMgdl: 140 })).toEqual({ band: "in", safety: "low" });
  });
});

describe("classifyReading boundaries (mmol/L, via typed input)", () => {
  it.each([
    ["3.8", "low"],
    ["3.9", "none"], // 70.2 → 70 mg/dL: not low
    ["13.9", "none"], // 250.2 → 250 mg/dL: not very-high
    ["14.0", "very-high"],
  ] as const)("%s mmol/L → safety %s", (raw, safety) => {
    const mgdl = parseTypedGlucose(raw, "mmol/L")!;
    expect(classifyReading(mgdl).safety).toBe(safety);
  });

  it("10.0 mmol/L is in range and 10.1 is above", () => {
    expect(classifyReading(parseTypedGlucose("10.0", "mmol/L")!).band).toBe("in");
    expect(classifyReading(parseTypedGlucose("10.1", "mmol/L")!).band).toBe("above");
  });
});

describe("breaksFast boundaries", () => {
  it.each([
    [69, true],
    [70, false],
    [71, false],
    [299, false],
    [300, false],
    [301, true],
  ] as const)("%i mg/dL → %s", (v, expected) => {
    expect(breaksFast(v)).toBe(expected);
  });

  it("typed mmol/L: 16.6 doesn't break a fast; 16.7 does (conservative rounding, see CLINICAL-REVIEW note)", () => {
    // 16.7 × 18 = 300.6 → 301 mg/dL. The guideline says "over 16.7 mmol/L", but a meter showing
    // 16.7 can be 300–301 mg/dL, so Keeper errs on the side of safety. Listed in the clinical
    // review checklist for sign-off.
    expect(breaksFast(parseTypedGlucose("16.6", "mmol/L")!)).toBe(false);
    expect(breaksFast(parseTypedGlucose("16.7", "mmol/L")!)).toBe(true);
  });
});

describe("bandLabelKey", () => {
  it.each([
    [120, "in"],
    [181, "littleAbove"],
    [210, "littleAbove"],
    [211, "above"],
    [69, "below"], // safety-low is never "a little" below
    [70, "in"],
  ] as const)("%i → %s", (v, key) => {
    expect(bandLabelKey(v)).toBe(key);
  });

  it("'a little below' needs a higher target range", () => {
    expect(bandLabelKey(75, { lowMgdl: 80, highMgdl: 180 })).toBe("littleBelow");
    expect(bandLabelKey(45, { lowMgdl: 80, highMgdl: 180 })).toBe("below");
  });
});

describe("units", () => {
  it("converts and formats", () => {
    expect(mgdlToMmol(180)).toBe(10);
    expect(mmolToMgdl(3.9)).toBe(70);
    expect(formatGlucose(126, "mmol/L")).toBe("7.0");
    expect(formatGlucose(126, "mg/dL")).toBe("126");
  });

  it("rejects implausible typed values", () => {
    expect(parseTypedGlucose("", "mg/dL")).toBeNull();
    expect(parseTypedGlucose("abc", "mg/dL")).toBeNull();
    expect(parseTypedGlucose("12", "mg/dL")).toBeNull();
    expect(parseTypedGlucose("601", "mg/dL")).toBeNull();
    expect(parseTypedGlucose("0.5", "mmol/L")).toBeNull();
    expect(parseTypedGlucose("40", "mmol/L")).toBeNull();
    expect(parseTypedGlucose("6,2", "mmol/L")).toBe(112);
  });
});
