// Ramadan times (03 §9) via `adhan`. Suhoor ends at Fajr (minus a user offset), iftar is at
// Maghrib. The start date is always user-confirmed (moon sighting), never predicted.
import { CalculationMethod, Coordinates, PrayerTimes } from "adhan";
import { addDays, localDay, minutesBetween, startOfLocalDay } from "@/lib/rules/time";
import type { RamadanSettings, Rhythm } from "@/types/domain";

export const CITIES: NonNullable<Rhythm["city"]>[] = [
  { name: "Dhaka", lat: 23.8103, lng: 90.4125 },
  { name: "Chattogram", lat: 22.3569, lng: 91.7832 },
  { name: "Sylhet", lat: 24.8949, lng: 91.8687 },
  { name: "Khulna", lat: 22.8456, lng: 89.5403 },
  { name: "Rajshahi", lat: 24.3745, lng: 88.6042 },
];

export const METHODS: RamadanSettings["method"][] = ["Karachi", "MuslimWorldLeague", "UmmAlQura", "Egyptian", "NorthAmerica", "Dubai"];

// [REVIEW] Karachi method and a 0-minute Sehri offset are the defaults for Bangladesh.
export const DEFAULT_RAMADAN: RamadanSettings = { method: "Karachi", suhoorOffsetMin: 0, days: 30 };

export interface DayTimes {
  suhoorEnds: Date; // Fajr − offset
  iftar: Date; // Maghrib
}

export function dayTimes(date: Date, city: { lat: number; lng: number }, method: RamadanSettings["method"] = "Karachi", offsetMin = 0): DayTimes {
  const params = CalculationMethod[method]();
  // Noon avoids any date-boundary ambiguity for the calendar day.
  const noon = new Date(startOfLocalDay(date));
  noon.setHours(12);
  const pt = new PrayerTimes(new Coordinates(city.lat, city.lng), noon, params);
  return { suhoorEnds: new Date(pt.fajr.getTime() - offsetMin * 60_000), iftar: pt.maghrib };
}

export type RamadanPhase =
  | { phase: "before"; daysUntil: number }
  | { phase: "fasting"; day: number; times: DayTimes }
  | { phase: "window"; day: number; times: DayTimes; nextSuhoorEnds: Date }
  | { phase: "after"; days: number };

/** Where `now` sits in Ramadan, given the confirmed start date ("YYYY-MM-DD"). */
export function ramadanPhase(now: Date, r: RamadanSettings, city: { lat: number; lng: number }): RamadanPhase | null {
  if (!r.startDate) return null;
  const [y, m, d] = r.startDate.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const length = r.days ?? 30;
  const dayIndex = Math.floor(minutesBetween(start, startOfLocalDay(now)) / (24 * 60)); // 0-based
  if (dayIndex < 0) return { phase: "before", daysUntil: -dayIndex };
  const today = dayTimes(now, city, r.method, r.suhoorOffsetMin);
  // After maghrib on the last day, Ramadan is over.
  if (dayIndex > length - 1 || (dayIndex === length - 1 && now >= today.iftar)) return { phase: "after", days: length };
  if (now >= today.suhoorEnds && now < today.iftar) return { phase: "fasting", day: dayIndex + 1, times: today };
  if (now < today.suhoorEnds) {
    // Night before today's fast (after midnight): the window runs until today's suhoor ends.
    return { phase: "window", day: dayIndex + 1, times: today, nextSuhoorEnds: today.suhoorEnds };
  }
  const tomorrow = dayTimes(addDays(now, 1), city, r.method, r.suhoorOffsetMin);
  return { phase: "window", day: dayIndex + 1, times: today, nextSuhoorEnds: tomorrow.suhoorEnds };
}

/**
 * During Ramadan, name a meal by the fast: from 15 min before Maghrib to 2 h after is iftar;
 * from 3 h before the end of suhoor (Fajr − offset) to 15 min after is suhoor.
 */
export function ramadanSlot(at: Date, r: RamadanSettings, city: { lat: number; lng: number }): "suhoor" | "iftar" | undefined {
  const phase = ramadanPhase(at, r, city);
  if (!phase || phase.phase === "before" || phase.phase === "after") return undefined;
  const t = dayTimes(at, city, r.method, r.suhoorOffsetMin);
  const sinceIftar = minutesBetween(t.iftar, at);
  if (sinceIftar >= -15 && sinceIftar <= 120) return "iftar";
  const untilSuhoorEnds = minutesBetween(at, t.suhoorEnds);
  if (untilSuhoorEnds >= -15 && untilSuhoorEnds <= 180) return "suhoor";
  return undefined;
}

/** Days until a date, for the pre-Ramadan planning card (from 8 weeks before). */
export const PRE_RAMADAN_WEEKS = 8;

export const ramadanDayKey = (now: Date) => localDay(now);
