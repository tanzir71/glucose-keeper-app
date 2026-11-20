import { describe, expect, it } from "vitest";
import {
  canStart,
  eatingWindow,
  inEatingWindow,
  nextTrack,
  offerNextStep,
  plannedEnd,
  shouldStopFast,
  weightSoftening,
  windowFitsRhythm,
  type StepUpInput,
} from "./fasting";
import type { FastSession, GlucoseReading, LogEntry, Settings } from "@/types/domain";

type F = Settings["fasting"];
const NOW = new Date("2026-11-20T12:00:00");
const daysAgo = (n: number, time = "09:00") => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  const [h, m] = time.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d;
};
let seq = 0;
const session = (over: Partial<FastSession> = {}): FastSession => ({
  id: `f${seq++}`,
  track: "overnight-12",
  startedAt: daysAgo(1, "21:00").toISOString(),
  plannedEndAt: daysAgo(0, "09:00").toISOString(),
  feelings: [],
  drinks: [],
  ...over,
});
const reading = (v: number, at: Date, safety: GlucoseReading["safety"] = "none"): GlucoseReading => ({
  id: `r${seq++}`,
  at: at.toISOString(),
  valueMgdl: v,
  source: "typed",
  state: "opened",
  safety,
});

describe("canStart: medication gate (05 §4.3)", () => {
  it.each<[string, F, Parameters<typeof canStart>[0], boolean, string?]>([
    ["overnight is open to anyone not excluded", {}, "overnight-12", true],
    ["overnight is open even when excluded", { excluded: true }, "overnight-12", true],
    ["excluded can't start a window", { excluded: true }, "window-13", false, "excluded"],
    ["excluded can still use Ramadan support", { excluded: true }, "ramadan", true],
    ["unanswered meds → window gated", {}, "window-14", false, "meds"],
    ["insulin yes → window gated", { medsLowRisk: "yes" }, "window-14", false, "meds"],
    ["not sure counts as yes", { medsLowRisk: "not-sure" }, "window-16", false, "meds"],
    ["no meds risk → window ok", { medsLowRisk: "no" }, "window-16", true],
    ["care team confirmed unlocks", { medsLowRisk: "yes", careTeamConfirmed: true }, "window-13", true],
    ["doctor plan needs a plan", {}, "doctor-plan", false, "needs-plan"],
    ["doctor plan with a plan", { doctorPlan: { hours: 24, checks: [] } }, "doctor-plan", true],
    ["excluded can't use doctor plan", { excluded: true, doctorPlan: { hours: 24, checks: [] } }, "doctor-plan", false, "excluded"],
  ])("%s", (_, fasting, track, ok, reason) => {
    const r = canStart(track, fasting);
    expect(r.ok).toBe(ok);
    if ("reason" in r) expect(r.reason).toBe(reason);
    else expect(reason).toBeUndefined();
  });

  it("meds gate falls back to the 12 h track", () => {
    expect(canStart("window-14", { medsLowRisk: "yes" })).toMatchObject({ ok: false, fallback: "overnight-12" });
  });

  it("hydration rule when -gliflozin is yes or not sure", () => {
    expect(canStart("overnight-12", { medsSglt2: "yes" })).toMatchObject({ flags: { hydrationRule: true } });
    expect(canStart("overnight-12", { medsSglt2: "not-sure" })).toMatchObject({ flags: { hydrationRule: true } });
    expect(canStart("overnight-12", { medsSglt2: "no" })).toMatchObject({ flags: { hydrationRule: false } });
  });

  it("Ramadan flags: highRisk and planCard until confirmed; supportOnly when excluded", () => {
    expect(canStart("ramadan", { medsLowRisk: "yes" })).toMatchObject({ ok: true, flags: { highRisk: true, planCard: true, supportOnly: false } });
    expect(canStart("ramadan", { medsLowRisk: "yes", careTeamConfirmed: true })).toMatchObject({ flags: { highRisk: false, planCard: false } });
    expect(canStart("ramadan", { excluded: true, medsLowRisk: "no" })).toMatchObject({ flags: { supportOnly: true, highRisk: false } });
  });
});

describe("windows and limits", () => {
  it("never coaches an eating window under 8 h", () => {
    expect(eatingWindow("window-16", "11:00")).toEqual({ open: "11:00", close: "19:00", hours: 8 });
    expect(eatingWindow("overnight-12")).toEqual({ open: "09:00", close: "21:00", hours: 12 });
    expect(eatingWindow("ramadan")).toBeNull();
  });

  it("the ladder tops out at 16 h", () => {
    expect(nextTrack("overnight-12")).toBe("window-13");
    expect(nextTrack("window-14")).toBe("window-16");
    expect(nextTrack("window-16")).toBeNull();
    expect(nextTrack("ramadan")).toBeNull();
  });

  it("never moves a window into sleep time", () => {
    expect(windowFitsRhythm("09:00", "21:00", { wake: "07:00", sleep: "23:00" })).toBe(true);
    expect(windowFitsRhythm("12:00", "00:00", { wake: "07:00", sleep: "23:00" })).toBe(false);
    expect(windowFitsRhythm("06:00", "18:00", { wake: "07:00", sleep: "23:00" })).toBe(false);
  });

  it("planned end follows the track", () => {
    const start = new Date("2026-11-19T21:00:00");
    expect(plannedEnd("window-14", start).toISOString()).toBe(new Date("2026-11-20T11:00:00").toISOString());
  });

  it("eating window is open before a fast starts and after it ends", () => {
    const s = session({ startedAt: daysAgo(0, "08:00").toISOString(), plannedEndAt: daysAgo(0, "20:00").toISOString() });
    expect(inEatingWindow(s, NOW)).toBe(false);
    expect(inEatingWindow(s, daysAgo(0, "20:30"))).toBe(true);
    expect(inEatingWindow(undefined, NOW)).toBe(true);
  });
});

describe("shouldStopFast (05 §4.6)", () => {
  const s = session({ startedAt: daysAgo(0, "06:00").toISOString(), plannedEndAt: daysAgo(0, "20:00").toISOString() });
  it.each([
    [69, true],
    [70, false],
    [300, false],
    [301, true],
  ])("reading %i mg/dL → stop %s", (v, stop) => {
    expect(shouldStopFast({ session: s, readings: [reading(v, daysAgo(0, "10:00"))], logs: [] }).stop).toBe(stop);
  });

  it("ignores readings from before the fast", () => {
    expect(shouldStopFast({ session: s, readings: [reading(60, daysAgo(1, "10:00"))], logs: [] }).stop).toBe(false);
  });

  it("shaky or dizzy stops the fast", () => {
    const r = shouldStopFast({ session: { ...s, feelings: [{ at: daysAgo(0, "10:00").toISOString(), tag: "shaky-dizzy" }] }, readings: [], logs: [] });
    expect(r).toMatchObject({ stop: true, endReason: "symptom", trigger: "shaky-dizzy" });
  });

  it("hungry or a headache doesn't", () => {
    const r = shouldStopFast({ session: { ...s, feelings: [{ at: daysAgo(0, "10:00").toISOString(), tag: "headache" }, { at: daysAgo(0, "10:00").toISOString(), tag: "hungry" }] }, readings: [], logs: [] });
    expect(r.stop).toBe(false);
  });

  it("a low + unwell feeling stops the fast", () => {
    const l: LogEntry = { id: "x", kind: "feeling", at: daysAgo(0, "11:00").toISOString(), createdAt: "", data: { kind: "feeling", mood: "low", tags: ["unwell"] } };
    expect(shouldStopFast({ session: s, readings: [], logs: [l] })).toMatchObject({ stop: true, trigger: "low-unwell" });
  });

  it("reported symptoms stop the fast", () => {
    expect(shouldStopFast({ session: s, readings: [], logs: [], symptomsReported: true })).toMatchObject({ stop: true, endReason: "symptom" });
  });
});

describe("offerNextStep (05 §4.4)", () => {
  const completedWeek = (track: FastSession["track"] = "overnight-12", n = 5) =>
    Array.from({ length: n }, (_, i) =>
      session({ track, startedAt: daysAgo(i + 1, "21:00").toISOString(), plannedEndAt: daysAgo(i, "09:00").toISOString(), endedAt: daysAgo(i, "09:00").toISOString(), endReason: "planned" }),
    );
  const base = (over: Partial<StepUpInput> = {}): StepUpInput => ({
    now: NOW,
    fasting: { track: "overnight-12", medsLowRisk: "no" },
    sessions: completedWeek(),
    readings: [],
    logs: [],
    softening: false,
    ...over,
  });

  it("offers 13 h after 5 easy days on 12 h", () => {
    expect(offerNextStep(base())).toEqual({
      next: "window-13",
      hours: 13,
      reason: "5 of the last 7 days on the 12 h track ended as planned, with no shaky moments or lows",
    });
  });

  it("needs 5 of the last 7 days", () => {
    expect(offerNextStep(base({ sessions: completedWeek("overnight-12", 4) }))).toBeNull();
  });

  it("an early end for a symptom doesn't count as completed", () => {
    const s = completedWeek();
    s[0] = { ...s[0], endedEarly: true, endReason: "symptom" };
    expect(offerNextStep(base({ sessions: s }))).toBeNull();
  });

  it("no offer after a shaky-dizzy feeling", () => {
    const s = completedWeek();
    s[1] = { ...s[1], feelings: [{ at: daysAgo(1, "07:00").toISOString(), tag: "shaky-dizzy" }] };
    expect(offerNextStep(base({ sessions: s }))).toBeNull();
  });

  it("no offer after a low reading", () => {
    expect(offerNextStep(base({ readings: [reading(65, daysAgo(2), "low")] }))).toBeNull();
  });

  it("no offer when the meds gate blocks the next track", () => {
    expect(offerNextStep(base({ fasting: { track: "overnight-12", medsLowRisk: "yes" } }))).toBeNull();
  });

  it("not more than once a week", () => {
    expect(offerNextStep(base({ fasting: { track: "overnight-12", medsLowRisk: "no", stepUp: { lastOfferAt: daysAgo(3).toISOString() } } }))).toBeNull();
    expect(offerNextStep(base({ fasting: { track: "overnight-12", medsLowRisk: "no", stepUp: { lastOfferAt: daysAgo(8).toISOString() } } }))).not.toBeNull();
  });

  it("paused after a stop", () => {
    expect(offerNextStep(base({ fasting: { track: "overnight-12", medsLowRisk: "no", stepUp: { pausedUntil: daysAgo(-2).toISOString() } } }))).toBeNull();
  });

  it("no offers while weight softening is active", () => {
    expect(offerNextStep(base({ softening: true }))).toBeNull();
  });

  it("16 h is the top rung; Ramadan never steps up", () => {
    expect(offerNextStep(base({ fasting: { track: "window-16", medsLowRisk: "no" }, sessions: completedWeek("window-16") }))).toBeNull();
    expect(offerNextStep(base({ fasting: { track: "ramadan" }, sessions: completedWeek("ramadan") }))).toBeNull();
  });
});

describe("weightSoftening (05 §4.7)", () => {
  const w = (daysBack: number, kg: number) => ({ id: `w${seq++}`, at: daysAgo(daysBack).toISOString(), kg });
  it("softens after > 1 kg/week loss 3 weeks running", () => {
    expect(weightSoftening([w(21, 80), w(14, 78.8), w(7, 77.6), w(0, 76.4)])).toBe(true);
  });
  it("doesn't soften at a gentle pace", () => {
    expect(weightSoftening([w(21, 80), w(14, 79.5), w(7, 79), w(0, 78.5)])).toBe(false);
  });
  it("softens after 3 skipped meals in a week", () => {
    expect(weightSoftening([], 3)).toBe(true);
  });
});
