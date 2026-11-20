import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, newId } from "@/lib/db";
import { addDays, minutesBetween, startOfLocalDay } from "@/lib/rules/time";
import type { CheckIn, FastSession, GlucoseReading, LogData, LogEntry, MealData, NudgeEvent, Settings } from "@/types/domain";

/**
 * The current time, refreshed every `intervalMs` and whenever the app is focused or becomes
 * visible again. In-app prompts (check-ins, nudges, fasting) are computed from this; there are
 * no background timers or server push.
 */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, intervalMs);
    const onVis = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", tick);
    };
  }, [intervalMs]);
  return now;
}

// ---------- Writes ----------
export async function addLog<D extends LogData>(data: D, at: Date = new Date()): Promise<LogEntry<D>> {
  const entry: LogEntry<D> = { id: newId(), kind: data.kind, at: at.toISOString(), createdAt: new Date().toISOString(), data };
  await db.logs.add(entry as LogEntry);
  return entry;
}

export async function updateLog<D extends LogData>(id: string, data: D, at?: Date): Promise<void> {
  await db.logs.update(id, { data, kind: data.kind, ...(at ? { at: at.toISOString() } : {}) });
}

export async function deleteLog(id: string): Promise<void> {
  const log = await db.logs.get(id);
  await db.transaction("rw", db.logs, db.checkins, db.photos, async () => {
    await db.logs.delete(id);
    if (log?.data.kind === "meal") {
      await db.checkins.where("mealId").equals(id).delete();
      if (log.data.photoId) await db.photos.delete(log.data.photoId);
    }
  });
}

export async function addCheckIn(c: Omit<CheckIn, "id">): Promise<CheckIn> {
  const entry = { ...c, id: newId() };
  await db.checkins.add(entry);
  return entry;
}

export async function recordNudge(e: Omit<NudgeEvent, "id" | "at"> & { at?: Date }): Promise<void> {
  await db.nudges.add({ ...e, id: newId(), at: (e.at ?? new Date()).toISOString() });
}

// ---------- Reads ----------
export function useLogsBetween(from: Date, to: Date): LogEntry[] | undefined {
  const a = from.toISOString();
  const b = to.toISOString();
  return useLiveQuery(() => db.logs.where("at").between(a, b, true, true).sortBy("at"), [a, b]);
}

/** Everything the rules engines need, from `days` days back (local midnight) until now. */
export function useRecent(days: number, now: Date) {
  const from = startOfLocalDay(addDays(now, -days)).toISOString();
  return useLiveQuery(async () => {
    const [logs, checkins, nudges, readings, fasts] = await Promise.all([
      db.logs.where("at").aboveOrEqual(from).sortBy("at"),
      db.checkins.where("at").aboveOrEqual(from).sortBy("at"),
      db.nudges.where("at").aboveOrEqual(from).sortBy("at"),
      db.readings.where("at").aboveOrEqual(from).sortBy("at"),
      db.fasts.orderBy("startedAt").reverse().limit(60).toArray(),
    ]);
    return { logs, checkins, nudges, readings, fasts };
  }, [from]);
}

export function useAllReadings(): GlucoseReading[] | undefined {
  return useLiveQuery(() => db.readings.orderBy("at").toArray(), []);
}

/** The fast that's running (not ended), if any. */
export function useActiveFast(): FastSession | undefined | null {
  return useLiveQuery(async () => {
    const all = await db.fasts.orderBy("startedAt").reverse().limit(5).toArray();
    return all.find((f) => !f.endedAt) ?? null;
  }, []);
}

/** Envelope number: readings are numbered in the order they were taken. */
export async function envelopeNumber(id: string): Promise<number> {
  const all = await db.readings.orderBy("at").primaryKeys();
  return all.indexOf(id) + 1;
}

// ---------- After-meal check-in (B3) ----------
export const CHECKIN_FROM_MIN = 100;
export const CHECKIN_TO_MIN = 180;

/** The meal whose check-in is due now, if any. After 180 min the prompt expires silently. */
export function dueCheckIn(
  now: Date,
  logs: LogEntry[],
  checkins: CheckIn[],
  settings: Pick<Settings, "checkinSnooze" | "checkinDismissed">,
): LogEntry<MealData> | null {
  const done = new Set(checkins.map((c) => c.mealId));
  const meals = logs
    .filter((l): l is LogEntry<MealData> => l.data.kind === "meal")
    .filter((m) => {
      const mins = minutesBetween(m.at, now);
      return mins >= CHECKIN_FROM_MIN && mins <= CHECKIN_TO_MIN && !done.has(m.id);
    })
    .sort((a, b) => b.at.localeCompare(a.at));
  const meal = meals[0];
  if (!meal) return null;
  const snooze = settings.checkinSnooze;
  if (snooze?.mealId === meal.id && now < new Date(snooze.until)) return null;
  return meal;
}

export const checkInDismissed = (mealId: string, s: Pick<Settings, "checkinDismissed">) => !!s.checkinDismissed?.includes(mealId);
