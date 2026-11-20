// M6 copy review against docs/keeper-v2/06 §1: scan every string in the copy deck.
import { describe, expect, it } from "vitest";
import { en } from "./en";

function collect(v: unknown, path: string, out: { path: string; text: string }[]) {
  if (typeof v === "string") out.push({ path, text: v });
  else if (typeof v === "function") {
    // Call templates with a few sample argument shapes.
    for (const args of [[2, true, "lunch"], ["lunch", "1:15 pm", "after lunch"], [3, 4, "walked lunches"]]) {
      try {
        const r = (v as (...a: unknown[]) => unknown)(...args);
        if (typeof r === "string") out.push({ path: `${path}()`, text: r });
      } catch {
        /* wrong shape for this template */
      }
    }
  } else if (Array.isArray(v)) v.forEach((x, i) => collect(x, `${path}[${i}]`, out));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) collect(x, path ? `${path}.${k}` : k, out);
}

const strings: { path: string; text: string }[] = [];
collect(en, "", strings);

// Verbatim from Figma and describing a research finding about people's feelings, not a grade
// on a reading ("Use the Figma text if the two ever differ", 06 §2).
const ALLOWED = new Set(["landing.problem.stats[2].body"]);

const RULES: [string, RegExp][] = [
  ['"check", not "test"', /\btest(s|ing|ed)?\b/i],
  ['"in your range", not "normal"', /\b(ab)?normal\b/i],
  ["no grades", /\bbad\b/i],
  ['"managing", not "controlling"', /\bcontrol(s|ling|led)?\b/i],
  ["no failure states", /\bfail(s|ed|ure)?\b/i],
  ["no alarms", /\b(warning|dangerous|alarm)\b/i],
  ['"glucose", not "blood sugar"', /blood sugar/i],
  ["no spikes", /\bspikes?\b/i],
  ["no emoji", /\p{Extended_Pictographic}/u],
];

describe("copy voice (06 §1)", () => {
  it("has a meaningful number of strings to check", () => {
    expect(strings.length).toBeGreaterThan(400);
  });

  it.each(RULES)("%s", (_, re) => {
    const hits = strings.filter((s) => re.test(s.text) && !ALLOWED.has(s.path)).map((s) => `${s.path}: ${s.text}`);
    expect(hits).toEqual([]);
  });

  it("no exclamation marks except the welcome", () => {
    const hits = strings.filter((s) => s.text.includes("!")).map((s) => s.path);
    expect(hits).toEqual([]);
  });

  it("streaks are only ever mentioned to say there are none", () => {
    const hits = strings.filter((s) => /streak/i.test(s.text) && !/(no streaks|broken streaks)/i.test(s.text));
    expect(hits).toEqual([]);
  });
});
