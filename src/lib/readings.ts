// Sealed-reading flow (05 §2): how a new reading is stored and where it goes next.
// Safety beats gentleness: a reading outside the safety bounds is never sealed or hidden.
import { db, newId } from "@/lib/db";
import { classifyReading, EMERGENCY_NUMBERS, type TargetRange } from "@/lib/clinical/thresholds";
import { minutesBetween, deviceTimeZone } from "@/lib/rules/time";
import { t } from "@/copy/en";
import type { FastSession, GlucoseComfort, GlucoseReading, LogEntry, MealData, ReadingContext, Settings } from "@/types/domain";

export type ReadingRoute = "low" | "high" | "sealed" | "ranges" | "numbers";

export interface ReadingDecision {
  state: GlucoseReading["state"];
  safety: GlucoseReading["safety"];
  route: ReadingRoute;
}

/** Decide storage and the next screen for a reading. `null` = unread (OCR failed, not typed). */
export function decideReading(valueMgdl: number | null, comfort: GlucoseComfort, range: TargetRange): ReadingDecision {
  if (valueMgdl == null) return { state: "sealed", safety: "unknown", route: "sealed" };
  const { safety } = classifyReading(valueMgdl, range);
  if (safety === "low") return { state: "opened", safety: "low", route: "low" };
  if (safety === "very-high") return { state: "opened", safety: "very-high", route: "high" };
  if (comfort === "ranges") return { state: "opened", safety: "none", route: "ranges" };
  if (comfort === "numbers") return { state: "opened", safety: "none", route: "numbers" };
  // Sealed — and the safest default for anyone who hasn't chosen yet.
  return { state: "sealed", safety: "none", route: "sealed" };
}

/** Context is inferred, so checking never needs an extra question. */
export function inferContext(now: Date, logs: LogEntry[], activeFast?: FastSession | null): { context: ReadingContext; mealId?: string } {
  if (activeFast && !activeFast.endedAt && now < new Date(activeFast.plannedEndAt)) return { context: "fasting" };
  const meal = logs
    .filter((l): l is LogEntry<MealData> => l.data.kind === "meal" && new Date(l.at) <= now)
    .sort((a, b) => b.at.localeCompare(a.at))[0];
  if (meal && minutesBetween(meal.at, now) <= 180) return { context: "after-meal", mealId: meal.id };
  const h = now.getHours();
  if (h >= 21 || h < 3) return { context: "bedtime" };
  return { context: "other" };
}

export async function saveReading(input: {
  valueMgdl: number | null;
  source: GlucoseReading["source"];
  settings: Settings;
  photoId?: string;
  ocrConfidence?: number;
  at?: Date;
  activeFast?: FastSession | null;
}): Promise<{ reading: GlucoseReading; decision: ReadingDecision }> {
  const at = input.at ?? new Date();
  const decision = decideReading(input.valueMgdl, input.settings.glucoseComfort, input.settings.targetRange);
  const since = new Date(at.getTime() - 4 * 3_600_000).toISOString();
  const logs = await db.logs.where("at").aboveOrEqual(since).toArray();
  const ctx = inferContext(at, logs, input.activeFast);
  const reading: GlucoseReading = {
    id: newId(),
    at: at.toISOString(),
    valueMgdl: input.valueMgdl,
    source: input.source,
    photoId: input.photoId,
    ocrConfidence: input.ocrConfidence,
    state: decision.state,
    safety: decision.safety,
    context: ctx.context,
    mealId: ctx.mealId,
  };
  await db.readings.add(reading);
  return { reading, decision };
}

/** Opening an envelope never changes glucoseComfort. */
export async function openEnvelope(id: string): Promise<void> {
  await db.readings.update(id, { state: "opened" });
}

export function routePath(route: ReadingRoute, id: string): string {
  if (route === "low" || route === "high") return `/glucose/safety/${id}`;
  if (route === "sealed") return `/glucose/sealed/${id}`;
  return `/glucose/reading/${id}`;
}

const BD_CITIES = ["Dhaka", "Chattogram", "Sylhet", "Khulna", "Rajshahi"];

/** [CLINICAL-REVIEW] Emergency line from the time zone or the rhythm city. */
export function emergencyNumber(settings: Pick<Settings, "rhythm">, tz: string = deviceTimeZone()): string {
  const country = tz === "Asia/Dhaka" || (settings.rhythm?.city && BD_CITIES.includes(settings.rhythm.city.name)) ? "BD" : undefined;
  return (country && EMERGENCY_NUMBERS[country]) || t.emergency.fallback;
}

/** "after lunch" etc. for envelope meta lines. */
export async function contextLabel(r: GlucoseReading): Promise<string | undefined> {
  if (r.context === "after-meal" && r.mealId) {
    const meal = await db.logs.get(r.mealId);
    if (meal?.data.kind === "meal" && meal.data.slot) return t.check.afterSlot(t.slots[meal.data.slot]);
  }
  return r.context ? t.check.contextShort[r.context] || undefined : undefined;
}
