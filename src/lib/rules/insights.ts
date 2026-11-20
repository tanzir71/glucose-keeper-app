// Weekly insights: weeklyInsights() (docs/keeper-v2/04 §3). At most 2, shown on Week (D1).
// Always observational ("often", "more often"), always with counts and "only your own logs".
// Never causal: no "because", "caused", "should", "bad", "good", "failed" or "spike".
import { t } from "@/copy/en";
import { classifyReading, type TargetRange } from "@/lib/clinical/thresholds";
import type {
  CheckIn,
  FeelingData,
  GlucoseComfort,
  GlucoseReading,
  LogEntry,
  MealData,
  MealSlot,
  SleepData,
  WaterData,
} from "@/types/domain";
import { addDays, localDay, minutesBetween, startOfLocalDay } from "./time";

export interface InsightInput {
  now: Date;
  logs: LogEntry[]; // last 28 days
  checkins: CheckIn[]; // last 28 days
  readings: GlucoseReading[]; // last 28 days
  comfort: GlucoseComfort;
  targetRange: TargetRange;
}

export interface Insight {
  id: "I1" | "I2" | "I3" | "I4" | "I5";
  text: string;
  caption: string;
  /** Points of difference used for ranking. */
  diff: number;
}

export const FORBIDDEN_WORDS = ["because", "caused", "should", "bad", "good", "failed", "spike"];
const THRESHOLD = 25;

type Window = { from: Date; to: Date };
const windowOf = (now: Date, days: number): Window => ({ from: startOfLocalDay(addDays(now, -(days - 1))), to: now });
const inWin = (iso: string, w: Window) => {
  const d = new Date(iso);
  return d >= w.from && d <= w.to;
};
const pct = (a: number, b: number) => (b ? (a / b) * 100 : 0);

const meals = (logs: LogEntry[], w: Window) =>
  logs.filter((l): l is LogEntry<MealData> => l.data.kind === "meal" && inWin(l.at, w));
const walkedAfter = (meal: LogEntry, logs: LogEntry[]) =>
  logs.some((l) => l.data.kind === "move" && minutesBetween(meal.at, l.at) >= 0 && minutesBetween(meal.at, l.at) <= 90);
const slotOf = (m: LogEntry<MealData>): MealSlot | undefined => m.data.slot;
const slotWord = (s: MealSlot) => t.slots[s].toLowerCase();
const slotsWord = (s: MealSlot) => t.slotsPlural[s];

/** Try the 7-day window, then 28 days if samples are too small. */
function withFallback(now: Date, fn: (w: Window) => Insight | "too-small" | null): Insight | null {
  const r7 = fn(windowOf(now, 7));
  if (r7 !== "too-small") return r7;
  const r28 = fn(windowOf(now, 28));
  return r28 === "too-small" ? null : r28;
}

function i1(input: InsightInput, w: Window): Insight | "too-small" | null {
  const latestCheckin = new Map<string, CheckIn>();
  for (const c of input.checkins) {
    const prev = latestCheckin.get(c.mealId);
    if (!prev || c.at > prev.at) latestCheckin.set(c.mealId, c);
  }
  const bySlot = new Map<MealSlot, { walked: CheckIn[]; not: CheckIn[] }>();
  for (const m of meals(input.logs, w)) {
    const c = latestCheckin.get(m.id);
    const s = slotOf(m);
    if (!c || !s) continue;
    const g = bySlot.get(s) ?? { walked: [], not: [] };
    (walkedAfter(m, input.logs) ? g.walked : g.not).push(c);
    bySlot.set(s, g);
  }
  let best: Insight | null = null;
  let enough = false;
  for (const [s, g] of bySlot) {
    if (g.walked.length < 3 || g.not.length < 3) continue;
    enough = true;
    const a = g.walked.filter((c) => c.energy === "steady").length;
    const diff = pct(a, g.walked.length) - pct(g.not.filter((c) => c.energy === "steady").length, g.not.length);
    if (diff >= THRESHOLD && (!best || diff > best.diff)) {
      best = { id: "I1", text: t.insights.i1(slotWord(s)), caption: t.week.insightCaption(a, g.walked.length, t.insights.i1What(slotsWord(s))), diff };
    }
  }
  return enough ? best : "too-small";
}

function i2(input: InsightInput, w: Window): Insight | "too-small" | null {
  const sleeps = input.logs.filter((l): l is LogEntry<SleepData> => l.data.kind === "sleep" && inWin(l.at, w));
  const feelingsByDay = new Map<string, FeelingData[]>();
  for (const l of input.logs) {
    if (l.data.kind !== "feeling") continue;
    const k = localDay(l.at);
    feelingsByDay.set(k, [...(feelingsByDay.get(k) ?? []), l.data as FeelingData]);
  }
  const short: boolean[] = [];
  const long: boolean[] = [];
  for (const s of sleeps) {
    // A sleep log is made on waking, so "the next day" is the day it was logged.
    const f = feelingsByDay.get(localDay(s.at));
    if (!f?.length) continue;
    const low = f.some((x) => x.mood === "low");
    if (s.data.hours < 6) short.push(low);
    else if (s.data.hours >= 7) long.push(low);
  }
  if (short.length < 3 || long.length < 3) return "too-small";
  const a = short.filter(Boolean).length;
  const diff = pct(a, short.length) - pct(long.filter(Boolean).length, long.length);
  return diff >= THRESHOLD ? { id: "I2", text: t.insights.i2, caption: t.week.insightCaption(a, short.length, t.insights.i2What), diff } : null;
}

function i3(input: InsightInput, w: Window): Insight | "too-small" | null {
  const latest = new Map<string, CheckIn>();
  for (const c of input.checkins) if (!latest.get(c.mealId) || c.at > latest.get(c.mealId)!.at) latest.set(c.mealId, c);
  const big = meals(input.logs, w).filter((m) => m.data.size === "big" && latest.has(m.id));
  if (big.length < 3) return "too-small";
  const heavy = big.filter((m) => {
    const c = latest.get(m.id)!;
    return c.energy === "sleepy" || c.tags.includes("heavy");
  });
  const share = pct(heavy.length, big.length);
  if (share < 60) return null;
  const counts = new Map<MealSlot, number>();
  for (const m of heavy) if (m.data.slot) counts.set(m.data.slot, (counts.get(m.data.slot) ?? 0) + 1);
  const s = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "lunch";
  // Rank against the others: at the 60% threshold this equals the 25-point threshold.
  return { id: "I3", text: t.insights.i3(slotsWord(s)), caption: t.week.insightCaption(heavy.length, big.length, t.insights.i3What(slotsWord(s))), diff: share - 35 };
}

function i4(input: InsightInput, w: Window): Insight | "too-small" | null {
  const bySlot = new Map<MealSlot, { walked: boolean[]; not: boolean[] }>();
  const readings = input.readings.filter((r) => r.state === "opened" && r.valueMgdl != null);
  for (const m of meals(input.logs, w)) {
    const s = slotOf(m);
    if (!s) continue;
    const r = readings.find((x) => {
      const mins = minutesBetween(m.at, x.at);
      return mins >= 60 && mins <= 180;
    });
    if (!r) continue;
    const inRange = classifyReading(r.valueMgdl!, input.targetRange).band === "in";
    const g = bySlot.get(s) ?? { walked: [], not: [] };
    (walkedAfter(m, input.logs) ? g.walked : g.not).push(inRange);
    bySlot.set(s, g);
  }
  let best: Insight | null = null;
  let enough = false;
  for (const [s, g] of bySlot) {
    if (g.walked.length < 3 || g.not.length < 3) continue;
    enough = true;
    const a = g.walked.filter(Boolean).length;
    const diff = pct(a, g.walked.length) - pct(g.not.filter(Boolean).length, g.not.length);
    if (diff >= THRESHOLD && (!best || diff > best.diff)) {
      best = { id: "I4", text: t.insights.i4(slotsWord(s)), caption: t.week.insightCaption(a, g.walked.length, t.insights.i4What(slotsWord(s))), diff };
    }
  }
  return enough ? best : "too-small";
}

function i5(input: InsightInput, w: Window): Insight | "too-small" | null {
  const water = new Map<string, number>();
  for (const l of input.logs) {
    if (l.data.kind !== "water" || !inWin(l.at, w)) continue;
    const k = localDay(l.at);
    water.set(k, (water.get(k) ?? 0) + (l.data as WaterData).glasses);
  }
  const headacheDays = new Set<string>();
  for (const c of input.checkins) if (c.tags.includes("headache")) headacheDays.add(localDay(c.at));
  for (const l of input.logs) if (l.data.kind === "feeling" && (l.data as FeelingData).tags?.includes("headache")) headacheDays.add(localDay(l.at));
  const more: boolean[] = [];
  const fewer: boolean[] = [];
  for (const [day, glasses] of water) (glasses >= 6 ? more : fewer).push(headacheDays.has(day));
  if (more.length < 3 || fewer.length < 3) return "too-small";
  const diff = pct(fewer.filter(Boolean).length, fewer.length) - pct(more.filter(Boolean).length, more.length);
  const a = more.filter((h) => !h).length;
  return diff >= THRESHOLD ? { id: "I5", text: t.insights.i5, caption: t.week.insightCaption(a, more.length, t.insights.i5What), diff } : null;
}

export function weeklyInsights(input: InsightInput): Insight[] {
  const out: Insight[] = [];
  const add = (x: Insight | null) => x && out.push(x);
  add(withFallback(input.now, (w) => i1(input, w)));
  add(withFallback(input.now, (w) => i2(input, w)));
  add(withFallback(input.now, (w) => i3(input, w)));
  // Never show I4 unless the person chose ranges or numbers.
  if (input.comfort === "ranges" || input.comfort === "numbers") add(withFallback(input.now, (w) => i4(input, w)));
  add(withFallback(input.now, (w) => i5(input, w)));
  const order = { I1: 1, I2: 2, I3: 3, I4: 4, I5: 5 };
  return out.sort((a, b) => b.diff - a.diff || order[a.id] - order[b.id]).slice(0, 2);
}
