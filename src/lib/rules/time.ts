// Shared, pure time helpers for the rules engines. Never call Date.now() in here: callers pass `now`.
import type { MealSlot, Rhythm } from "@/types/domain";

export const DEFAULT_RHYTHM = {
  wake: "07:00",
  sleep: "23:00",
  workHours: { start: "09:00", end: "17:00" },
} as const;

export const MS_MIN = 60_000;
export const MS_DAY = 86_400_000;

const toDate = (d: Date | string | number): Date => (d instanceof Date ? d : new Date(d));

/** b − a in minutes (fractional). */
export function minutesBetween(a: Date | string, b: Date | string): number {
  return (toDate(b).getTime() - toDate(a).getTime()) / MS_MIN;
}

/** "HH:mm" → minutes since midnight. */
export function parseHM(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function formatHM(mins: number): string {
  const m = ((Math.round(mins) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Local minutes since midnight. */
export function minutesOfDay(d: Date | string): number {
  const x = toDate(d);
  return x.getHours() * 60 + x.getMinutes() + x.getSeconds() / 60;
}

export const hm = (d: Date | string): string => formatHM(Math.floor(minutesOfDay(d)));

/**
 * Is `time` inside [start, end)? Handles windows that cross midnight (e.g. 22:30 → 07:00).
 * `time` can be a Date (local clock time is used), "HH:mm", or minutes since midnight.
 */
export function isWithin(time: Date | string | number, start: string, end: string): boolean {
  const t = typeof time === "number" ? time : typeof time === "string" && /^\d{1,2}:\d{2}$/.test(time) ? parseHM(time) : minutesOfDay(time);
  const s = parseHM(start);
  const e = parseHM(end);
  if (s === e) return false;
  return s < e ? t >= s && t < e : t >= s || t < e;
}

/** Local calendar day "YYYY-MM-DD" in the device time zone. */
export function localDay(d: Date | string): string {
  const x = toDate(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

export function startOfLocalDay(d: Date | string): Date {
  const x = new Date(toDate(d));
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date | string, n: number): Date {
  const x = new Date(toDate(d));
  x.setDate(x.getDate() + n);
  return x;
}

export function addMinutes(d: Date | string, n: number): Date {
  return new Date(toDate(d).getTime() + n * MS_MIN);
}

/** A Date on the same local day as `day` at clock time "HH:mm". */
export function atTime(day: Date | string, time: string): Date {
  const x = startOfLocalDay(day);
  x.setMinutes(parseHM(time));
  return x;
}

export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Bangladesh's weekend is Fri–Sat, so its work week is Sun–Thu. Elsewhere Mon–Fri. */
export function defaultWorkDays(tz: string): number[] {
  return tz === "Asia/Dhaka" ? [0, 1, 2, 3, 4] : [1, 2, 3, 4, 5];
}

export function isWorkDay(date: Date | string, rhythm?: Rhythm, tz: string = deviceTimeZone()): boolean {
  const days = rhythm?.workDays?.length ? rhythm.workDays : defaultWorkDays(tz);
  return days.includes(toDate(date).getDay());
}

export function workHours(rhythm?: Rhythm): { start: string; end: string } {
  return rhythm?.workHours ?? DEFAULT_RHYTHM.workHours;
}

export function partOfDay(d: Date): "morning" | "afternoon" | "evening" {
  const h = d.getHours();
  if (h >= 4 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  return "evening";
}

/** Quiet hours: sleep − 30 min → wake. */
export function isQuietHours(now: Date, rhythm?: Rhythm): boolean {
  const sleep = rhythm?.sleep ?? DEFAULT_RHYTHM.sleep;
  const wake = rhythm?.wake ?? DEFAULT_RHYTHM.wake;
  return isWithin(now, formatHM(parseHM(sleep) - 30), wake);
}

const DEFAULT_SLOTS: { slot: MealSlot; from: string; to: string }[] = [
  { slot: "breakfast", from: "04:30", to: "10:30" },
  { slot: "snack", from: "10:30", to: "12:00" },
  { slot: "lunch", from: "12:00", to: "15:30" },
  { slot: "tea", from: "15:30", to: "18:00" },
  { slot: "dinner", from: "18:00", to: "22:30" },
];

/** Meal name inferred from time and rhythm (B2 header). */
export function inferSlot(at: Date, rhythm?: Rhythm): MealSlot {
  const meals = rhythm?.meals;
  if (meals) {
    const t = minutesOfDay(at);
    let best: { slot: MealSlot; d: number } | null = null;
    for (const [slot, time] of Object.entries(meals)) {
      if (!time) continue;
      const raw = Math.abs(t - parseHM(time));
      const d = Math.min(raw, 1440 - raw);
      if (d <= 90 && (!best || d < best.d)) best = { slot: slot as MealSlot, d };
    }
    if (best) return best.slot;
  }
  for (const s of DEFAULT_SLOTS) if (isWithin(at, s.from, s.to)) return s.slot;
  return "snack";
}
