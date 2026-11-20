import { db, newId } from "@/lib/db";
import { plannedEnd } from "@/lib/rules/fasting";
import { addDays } from "@/lib/rules/time";
import { updateSettings } from "@/lib/settings";
import type { Drink, FastFeeling, FastSession, FastTrack, Settings } from "@/types/domain";

export async function startFast(track: FastTrack, settings: Settings, startedAt = new Date(), end?: Date): Promise<FastSession> {
  const s: FastSession = {
    id: newId(),
    track,
    startedAt: startedAt.toISOString(),
    plannedEndAt: (end ?? plannedEnd(track, startedAt, settings.fasting)).toISOString(),
    feelings: [],
    drinks: [],
  };
  await db.fasts.add(s);
  return s;
}

/** Ending early always counts. A symptom or reading pauses step-up offers for 7 days. */
export async function endFast(session: FastSession, reason: NonNullable<FastSession["endReason"]>, at = new Date()): Promise<void> {
  const early = reason !== "planned" && at < new Date(session.plannedEndAt);
  await db.fasts.update(session.id, { endedAt: at.toISOString(), endedEarly: early || reason === "symptom" || reason === "reading", endReason: reason });
  if (reason === "symptom" || reason === "reading") {
    await updateSettings((s) => ({ fasting: { ...s.fasting, stepUp: { ...s.fasting.stepUp, pausedUntil: addDays(at, 7).toISOString() } } }));
  }
}

export async function addFastFeeling(id: string, tag: FastFeeling): Promise<void> {
  const s = await db.fasts.get(id);
  if (!s) return;
  await db.fasts.update(id, { feelings: [...s.feelings, { at: new Date().toISOString(), tag }] });
}

export async function addFastDrink(id: string, drink: Drink): Promise<void> {
  const s = await db.fasts.get(id);
  if (!s) return;
  await db.fasts.update(id, { drinks: [...s.drinks, { at: new Date().toISOString(), drink }] });
}

/** Close any fast whose planned end has passed (completed, not early). */
export async function settleFinishedFasts(now = new Date()): Promise<void> {
  const open = await db.fasts.filter((f) => !f.endedAt).toArray();
  for (const f of open) {
    if (now >= new Date(f.plannedEndAt) && f.track !== "doctor-plan") await endFast(f, "planned", new Date(f.plannedEndAt));
  }
}
