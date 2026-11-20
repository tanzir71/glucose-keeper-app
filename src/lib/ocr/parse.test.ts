import { describe, expect, it } from "vitest";
import { parseMeterWords, type OcrWord } from "./parse";

const w = (text: string, confidence = 90, bbox?: OcrWord["bbox"]): OcrWord => ({ text, confidence, bbox });
const IMG = { width: 400, height: 400 };

describe("parseMeterWords", () => {
  it.each([
    // [words, unit, expected mg/dL or null]
    [[w("6.2")], "mmol/L", 112],
    [[w("112")], "mg/dL", 112],
    [[w("mmol/L 6.2")], "mmol/L", 112],
    [[w("6,2")], "mmol/L", 112],
    [[w("0.5")], "mmol/L", null], // below 1.0
    [[w("40.1")], "mmol/L", null], // above 33.3
    [[w("700")], "mg/dL", null], // above 600
    [[w("12")], "mg/dL", null], // below 18
    [[w("abc")], "mmol/L", null],
    [[], "mmol/L", null],
  ] as const)("%j in %s → %s", (words, unit, expected) => {
    const r = parseMeterWords([...words], unit);
    expect(r?.valueMgdl ?? null).toBe(expected);
  });

  it("returns null under 70 confidence", () => {
    expect(parseMeterWords([w("6.2", 65)], "mmol/L")).toBeNull();
    expect(parseMeterWords([w("6.2", 70)], "mmol/L")).not.toBeNull();
  });

  it("prefers the person's unit when both kinds of token appear", () => {
    const words = [w("7.8", 90, { x0: 100, y0: 100, x1: 300, y1: 200 }), w("140", 90, { x0: 100, y0: 300, x1: 160, y1: 320 })];
    expect(parseMeterWords(words, "mmol/L", IMG)?.unit).toBe("mmol/L");
    expect(parseMeterWords(words, "mg/dL", IMG)?.valueMgdl).toBe(140);
  });

  it("picks the largest-font token over a small clock time", () => {
    const words = [w("12.45", 92, { x0: 10, y0: 10, x1: 80, y1: 30 }), w("5.4", 90, { x0: 120, y0: 150, x1: 300, y1: 260 })];
    // "12.45" isn't a one-decimal value; "5.4" is the big central reading.
    expect(parseMeterWords(words, "mmol/L", IMG)?.valueMgdl).toBe(97);
  });

  it("lowers confidence when two similar candidates compete", () => {
    const words = [w("6.2", 85, { x0: 100, y0: 150, x1: 200, y1: 250 }), w("8.1", 85, { x0: 200, y0: 150, x1: 300, y1: 250 })];
    expect(parseMeterWords(words, "mmol/L", IMG)).toBeNull();
  });
});
