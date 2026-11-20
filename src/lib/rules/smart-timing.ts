// Smart timing: pickNudge() (docs/keeper-v2/04 §1). Pure and deterministic: `now` comes in,
// a Nudge (with a human-readable reason) or null comes out. It never writes anything.
import { t } from "@/copy/en";
import { HABITS } from "@/lib/habits";
import type {
  CheckIn,
  Energy,
  FastSession,
  HabitId,
  LogEntry,
  MealData,
  MealSlot,
  FeelingData,
  NudgeEvent,
  Settings,
  SleepData,
} from "@/types/domain";
import {
  DEFAULT_RHYTHM,
  addMinutes,
  deviceTimeZone,
  isQuietHours,
  isWithin,
  isWorkDay,
  localDay,
  minutesBetween,
  minutesOfDay,
  parseHM,
  workHours,
  inferSlot,
} from "./time";

export interface NudgeInput {
  now: Date;
  settings: Pick<Settings, "tinyHabits" | "habitsEnabled" | "rhythm">;
  logs: LogEntry[]; // last 24 h
  checkins: CheckIn[]; // last 24 h
  nudges: NudgeEvent[]; // last 14 days
  activeFast?: FastSession & { inEatingWindow: boolean };
  /** Device time zone (for the default work week). Defaults to the device's. */
  tz?: string;
}

export interface Nudge {
  habitId: HabitId;
  title: string;
  body: string;
  reason: string;
  place: "desk" | "home";
  mealId?: string;
  expiresAt: Date;
  durationSec?: number;
  reps?: number;
  kind: "timer" | "count" | "tip";
}

type Place = "desk" | "home";

const CLOSED: ReadonlySet<NudgeEvent["outcome"]> = new Set(["skipped", "completed", "ended-early", "accepted"]);
const EVENING_FROM = parseHM("19:30");

const isMeal = (l: LogEntry): l is LogEntry<MealData> => l.data.kind === "meal";
const isMove = (l: LogEntry) => l.data.kind === "move";

/** desk | home | null (on feet during work hours: she's already moving). */
export function placeFor(now: Date, settings: NudgeInput["settings"], tz: string): Place | null {
  const r = settings.rhythm;
  const wh = workHours(r);
  const working = isWorkDay(now, r, tz) && isWithin(now, wh.start, wh.end);
  if (r?.workday === "desk" && working) return "desk";
  if (r?.workday === "on-feet" && working) return null;
  return "home";
}

function unwellToday(now: Date, logs: LogEntry[]): boolean {
  const today = localDay(now);
  const feelings = logs
    .filter((l): l is LogEntry<FeelingData> => l.data.kind === "feeling" && localDay(l.at) === today && new Date(l.at) <= now)
    .sort((a, b) => b.at.localeCompare(a.at));
  const latest = feelings[0];
  return !!latest && latest.data.mood === "low" && !!latest.data.tags?.includes("unwell");
}

function lastNightHours(now: Date, logs: LogEntry[]): number | undefined {
  const sleeps = logs
    .filter((l): l is LogEntry<SleepData> => l.data.kind === "sleep" && new Date(l.at) <= now && minutesBetween(l.at, now) <= 24 * 60)
    .sort((a, b) => b.at.localeCompare(a.at));
  return sleeps[0]?.data.hours;
}

function stats(nudges: NudgeEvent[], habitId: HabitId, place: Place, now: Date) {
  const recent = nudges.filter((n) => n.habitId === habitId && minutesBetween(n.at, now) <= 14 * 24 * 60);
  const skippedHere = recent.filter((n) => n.outcome === "skipped" && n.place === place).length;
  const shows = recent.filter((n) => n.outcome === "shown").length;
  const accepted = recent.filter((n) => n.outcome === "accepted").length;
  return { skippedHere, shows, rate: shows ? accepted / shows : 0 };
}

function dose(habitId: HabitId, size: MealData["size"], slot: MealSlot, eveningWalk: boolean, shortNight: boolean) {
  let minutes: number | undefined;
  let reps: number | undefined;
  switch (habitId) {
    case "stroll":
    case "stairs-stroll":
    case "hallway-laps":
      minutes = slot === "dinner" && eveningWalk ? 10 : size === "big" ? 5 : 2;
      break;
    case "calf-raises":
      reps = size === "big" ? 20 : 10;
      break;
    case "desk-moves":
    case "stand":
      minutes = 3;
      break;
    default:
      break;
  }
  if (shortNight) {
    if (minutes) minutes = Math.max(2, Math.floor(minutes / 2));
    if (reps) reps = Math.max(10, Math.floor(reps / 2));
  }
  return { minutes, reps };
}

function build(
  habitId: HabitId,
  place: Place,
  opts: { minutes?: number; reps?: number; reason: string; mealId?: string; expiresAt: Date },
): Nudge {
  const def = HABITS[habitId];
  const n = def.kind === "count" ? opts.reps ?? 10 : opts.minutes ?? 0;
  return {
    habitId,
    title: t.habits[habitId].title,
    body: t.nudge.bodies[habitId](n),
    reason: opts.reason,
    place,
    mealId: opts.mealId,
    expiresAt: opts.expiresAt,
    durationSec: opts.minutes ? opts.minutes * 60 : undefined,
    reps: opts.reps,
    kind: def.kind,
  };
}

export function pickNudge(input: NudgeInput): Nudge | null {
  const { now, settings, logs, checkins, nudges, activeFast } = input;
  const tz = input.tz ?? deviceTimeZone();
  const rhythm = settings.rhythm;

  // 0. Gates
  if (!settings.tinyHabits) return null;
  if (isQuietHours(now, rhythm)) return null;
  if (activeFast && !activeFast.inEatingWindow) return null;

  const enabled = new Set(settings.habitsEnabled);
  const past = logs.filter((l) => new Date(l.at) <= now);
  const meal = past.filter(isMeal).sort((a, b) => b.at.localeCompare(a.at))[0];
  const m = meal ? minutesBetween(meal.at, now) : Infinity;

  // 1. After-meal path
  if (meal && m >= 10 && m <= 90 && meal.data.size !== "light") {
    // b. Never stack
    if (past.some((l) => isMove(l) && minutesBetween(l.at, now) < 30)) return null;
    // c. One per meal
    const forMeal = nudges.filter((n) => n.mealId === meal.id);
    if (forMeal.some((n) => CLOSED.has(n.outcome))) return null;
    const alreadyShown = forMeal.find((n) => n.outcome === "shown")?.habitId;
    // d. Unwell
    if (unwellToday(now, past)) return null;
    // e. Place
    const place = placeFor(now, settings, tz);
    if (!place) return null;

    const slot = meal.data.slot ?? inferSlot(new Date(meal.at), rhythm);
    const anchors = rhythm?.anchors ?? [];
    const eveningWalkRow = place === "home" && anchors.includes("evening-walk") && slot === "dinner" && !rhythm?.indoorPreferred;
    const evening = minutesOfDay(now) >= EVENING_FROM;

    // f. Candidate order
    let order: HabitId[];
    if (place === "desk") order = m <= 20 ? ["stairs-stroll", "calf-raises", "desk-moves"] : ["calf-raises", "desk-moves", "stairs-stroll"];
    else if (eveningWalkRow) order = ["stroll", "hallway-laps", "stand"];
    else if (evening || rhythm?.indoorPreferred) order = ["hallway-laps", "stand", "stroll"];
    else order = ["stroll", "stand", "hallway-laps"];

    // g. Energy
    const checkin = checkins.filter((c) => c.mealId === meal.id).sort((a, b) => b.at.localeCompare(a.at))[0];
    const energy: Energy | undefined = checkin?.energy ?? meal.data.feeling;
    const sleepy = energy === "sleepy";
    if (sleepy) {
      const gentlest: HabitId = place === "desk" ? "calf-raises" : "stand";
      order = [gentlest, ...order.filter((h) => h !== gentlest)];
    }

    // h. Filter
    order = order.filter((h) => enabled.has(h) && stats(nudges, h, place, now).skippedHere < 3);
    const promoted = new Set<HabitId>();
    for (let i = 1; i < order.length; i++) {
      const s = stats(nudges, order[i], place, now);
      if (s.shows >= 3 && s.rate >= 0.6 && !promoted.has(order[i - 1])) {
        [order[i - 1], order[i]] = [order[i], order[i - 1]];
        promoted.add(order[i - 1]);
      }
    }
    if (order.length === 0) return null;

    // c (cont.). If this meal's nudge was only shown, keep the same habit so the card stays stable.
    const habitId = alreadyShown && order.includes(alreadyShown) ? alreadyShown : order[0];

    // i. Dose
    const nightHours = lastNightHours(now, past);
    const shortNight = nightHours !== undefined && nightHours < 6;
    const d = dose(habitId, meal.data.size, slot, eveningWalkRow, shortNight);

    // j. Reason: only true facts.
    const facts = [t.nudge.reasons.afterMeal(Math.round(m), meal.data.size, slot)];
    if (place === "desk") facts.push(t.nudge.reasons.deskDay);
    if (place === "home" && evening) facts.push(t.nudge.reasons.evening);
    if (sleepy) facts.push(t.nudge.reasons.sleepy);
    if (eveningWalkRow && habitId === "stroll") facts.push(t.nudge.reasons.eveningWalk);
    if (promoted.has(habitId)) facts.push(t.nudge.reasons.usual);
    if (shortNight) facts.push(t.nudge.reasons.shortNight);

    // k. Expiry
    return build(habitId, place, {
      ...d,
      reason: facts.join(" · "),
      mealId: meal.id,
      expiresAt: addMinutes(meal.at, 90),
    });
  }

  if (unwellToday(now, past)) return null;

  // 2. Desk-break path (no qualifying meal): 90 min of sitting on a desk day.
  // 04 §1 says "no move log in the last 90 min"; sitting is also reset by any meal (and starts at
  // work start), because the spec's own test #4 expects no desk break 10 min after a light snack.
  const place = placeFor(now, settings, tz);
  if (place === "desk" && enabled.has("desk-moves")) {
    const wh = workHours(rhythm);
    const sittingSince = Math.max(
      ...past.filter((l) => isMove(l) || isMeal(l)).map((l) => new Date(l.at).getTime()),
      new Date(now).setHours(0, 0, 0, 0) + parseHM(wh.start) * 60_000,
    );
    const today = localDay(now);
    const deskBreaks = nudges
      .filter((n) => n.habitId === "desk-moves" && !n.mealId && n.outcome === "shown" && localDay(n.at) === today)
      .sort((a, b) => b.at.localeCompare(a.at));
    const lastBreak = deskBreaks[0];
    const sitting = (now.getTime() - sittingSince) / 60_000;
    if (sitting >= 90 && deskBreaks.length < 2 && (!lastBreak || minutesBetween(lastBreak.at, now) >= 120)) {
      return build("desk-moves", "desk", {
        minutes: 3,
        reason: `${t.nudge.reasons.sitting} · ${t.nudge.reasons.deskDay}`,
        expiresAt: addMinutes(now, 30),
      });
    }
  }

  // 3. Pre-meal tip
  const meals = rhythm?.meals;
  if (meals && enabled.has("veggies-first")) {
    const shownToday = nudges.some((n) => n.habitId === "veggies-first" && localDay(n.at) === localDay(now));
    if (!shownToday) {
      const nowMin = minutesOfDay(now);
      for (const slot of ["breakfast", "lunch", "tea", "dinner"] as const) {
        const time = meals[slot];
        if (!time) continue;
        const ahead = parseHM(time) - nowMin;
        if (ahead >= 0 && ahead <= 30) {
          const n = build("veggies-first", placeFor(now, settings, tz) ?? "home", {
            reason: t.nudge.reasons.usualMeal(slot, time),
            expiresAt: addMinutes(now, ahead + 15),
          });
          n.body = t.nudge.veggiesSoon(t.slots[slot]);
          return n;
        }
      }
    }
  }

  // 4.
  return null;
}

export { DEFAULT_RHYTHM };
