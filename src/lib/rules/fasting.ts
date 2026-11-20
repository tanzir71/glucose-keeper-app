// Fasting rules (docs/keeper-v2/05 §4): eligibility, gating, step-up and stop rules.
// Pure functions; `now` comes in. Keeper never auto-advances a step, never coaches an eating
// window under 8 h or a fast over 24 h, and always shows the stop rules.
import {
  MAX_COACHED_FAST_HOURS,
  MIN_EATING_WINDOW_HOURS,
  RAPID_LOSS_KG_PER_WEEK,
  RAPID_LOSS_WEEKS,
  SKIPPED_MEALS_PER_WEEK,
  breaksFast,
} from "@/lib/clinical/thresholds";
import { t } from "@/copy/en";
import type { FastSession, FastTrack, FeelingData, GlucoseReading, LogEntry, Rhythm, Settings, WeightEntry } from "@/types/domain";
import { DEFAULT_RHYTHM, addMinutes, atTime, formatHM, isWithin, localDay, minutesBetween, parseHM } from "./time";

type Fasting = Settings["fasting"];

export const COACHED_TRACKS: FastTrack[] = ["overnight-12", "window-13", "window-14", "window-16"];

export const TRACK_HOURS: Record<Exclude<FastTrack, "ramadan" | "doctor-plan">, number> = {
  "overnight-12": 12,
  "window-13": 13,
  "window-14": 14,
  "window-16": 16, // top rung: no further step-ups
};

/** Default eating-window starts (05 §4.1 examples). */
export const DEFAULT_WINDOW_START: Record<keyof typeof TRACK_HOURS, string> = {
  "overnight-12": "09:00",
  "window-13": "09:00",
  "window-14": "10:00",
  "window-16": "11:00",
};

export function trackHours(track: FastTrack, fasting?: Fasting): number | null {
  if (track === "ramadan") return null;
  if (track === "doctor-plan") return fasting?.doctorPlan?.hours ?? null;
  return TRACK_HOURS[track];
}

export function nextTrack(track: FastTrack): FastTrack | null {
  const i = COACHED_TRACKS.indexOf(track);
  if (i < 0 || i >= COACHED_TRACKS.length - 1) return null;
  return COACHED_TRACKS[i + 1];
}

export interface StartFlags {
  hydrationRule: boolean;
  planCard?: boolean;
  highRisk?: boolean;
  supportOnly?: boolean;
}
export type CanStartResult =
  | { ok: true; flags?: StartFlags }
  | { ok: false; reason: "excluded" | "needs-plan" | "meds"; fallback?: FastTrack; flags?: StartFlags };

/** Medication gate (05 §4.3). "not-sure" is treated like "yes". */
export function canStart(track: FastTrack, fasting: Fasting): CanStartResult {
  if (fasting.excluded && track !== "overnight-12" && track !== "ramadan") return { ok: false, reason: "excluded" };
  if (track === "doctor-plan") return fasting.doctorPlan ? { ok: true } : { ok: false, reason: "needs-plan" };
  const lowRisk = fasting.medsLowRisk; // insulin or sulfonylurea
  const sglt2 = fasting.medsSglt2; // "-gliflozin"
  const confirmed = !!fasting.careTeamConfirmed;
  const flags: StartFlags = { hydrationRule: sglt2 !== "no" };
  if (track === "ramadan") {
    return {
      ok: true,
      flags: { ...flags, planCard: !confirmed, highRisk: lowRisk !== "no" && !confirmed, supportOnly: !!fasting.excluded },
    };
  }
  if (track === "overnight-12") return { ok: true, flags };
  if (lowRisk !== "no" && !confirmed) return { ok: false, reason: "meds", fallback: "overnight-12", flags };
  return { ok: true, flags };
}

/** C1 → C2 when the chosen track is longer than 12 h, or Ramadan. */
export const needsSafetyCheck = (track: FastTrack): boolean => track !== "overnight-12";

/** Eating window for a coached track starting at `start` ("HH:mm"). Never under 8 h. */
export function eatingWindow(track: FastTrack, start?: string): { open: string; close: string; hours: number } | null {
  if (!(track in TRACK_HOURS)) return null;
  const fastH = Math.min(TRACK_HOURS[track as keyof typeof TRACK_HOURS], MAX_COACHED_FAST_HOURS);
  const hours = Math.max(MIN_EATING_WINDOW_HOURS, 24 - fastH);
  const open = start ?? DEFAULT_WINDOW_START[track as keyof typeof TRACK_HOURS];
  return { open, close: formatHM(parseHM(open) + hours * 60), hours };
}

/** A window must never run into sleep time (sleep → wake). */
export function windowFitsRhythm(open: string, close: string, rhythm?: Rhythm): boolean {
  const sleep = rhythm?.sleep ?? DEFAULT_RHYTHM.sleep;
  const wake = rhythm?.wake ?? DEFAULT_RHYTHM.wake;
  // Check every 15 minutes of the window against the sleep period.
  const o = parseHM(open);
  let len = parseHM(close) - o;
  if (len <= 0) len += 1440;
  for (let m = 0; m <= len; m += 15) {
    if (isWithin((o + m) % 1440, sleep, wake)) return false;
  }
  return true;
}

/** The planned end of a fast that starts at `startedAt`. Doctor's-plan hours are logged as-is. */
export function plannedEnd(track: FastTrack, startedAt: Date, fasting?: Fasting): Date {
  const h = trackHours(track, fasting) ?? 12;
  return addMinutes(startedAt, h * 60);
}

/** When tonight's fast starts for a coached track: when the eating window closes. */
export function nextFastStart(now: Date, track: FastTrack, windowStart?: string): Date {
  const w = eatingWindow(track, windowStart);
  const close = atTime(now, w ? w.close : "21:00");
  return close;
}

export function fastProgress(session: FastSession, now: Date) {
  const total = Math.max(1, minutesBetween(session.startedAt, session.plannedEndAt));
  const elapsed = Math.max(0, minutesBetween(session.startedAt, session.endedAt ?? now));
  const remaining = Math.max(0, total - elapsed);
  return { elapsedMin: elapsed, remainingMin: remaining, totalMin: total, progress: Math.min(1, elapsed / total), done: remaining <= 0 };
}

export const isActive = (s: FastSession | undefined, now: Date): boolean =>
  !!s && !s.endedAt && new Date(s.startedAt) <= now;

/** For pickNudge: no food nudges unless the eating window is open. */
export function inEatingWindow(session: FastSession | undefined, now: Date): boolean {
  if (!session || session.endedAt) return true;
  return now >= new Date(session.plannedEndAt) || now < new Date(session.startedAt);
}

// ---------- Stop rules (05 §4.6) ----------
export interface StopInput {
  session: FastSession;
  readings: GlucoseReading[];
  logs: LogEntry[];
  symptomsReported?: boolean;
}
export type StopResult = { stop: false } | { stop: true; endReason: "reading" | "symptom"; trigger: "reading-low" | "reading-high" | "shaky-dizzy" | "low-unwell" | "reported" };

export function shouldStopFast({ session, readings, logs, symptomsReported }: StopInput): StopResult {
  const since = new Date(session.startedAt);
  const end = session.endedAt ? new Date(session.endedAt) : null;
  const during = (iso: string) => new Date(iso) >= since && (!end || new Date(iso) <= end);
  for (const r of readings) {
    if (r.valueMgdl == null || !during(r.at)) continue;
    if (breaksFast(r.valueMgdl)) return { stop: true, endReason: "reading", trigger: r.valueMgdl < 100 ? "reading-low" : "reading-high" };
  }
  if (session.feelings.some((f) => f.tag === "shaky-dizzy" && during(f.at))) return { stop: true, endReason: "symptom", trigger: "shaky-dizzy" };
  const lowUnwell = logs.some(
    (l) => l.data.kind === "feeling" && during(l.at) && (l.data as FeelingData).mood === "low" && !!(l.data as FeelingData).tags?.includes("unwell"),
  );
  if (lowUnwell) return { stop: true, endReason: "symptom", trigger: "low-unwell" };
  if (symptomsReported) return { stop: true, endReason: "symptom", trigger: "reported" };
  return { stop: false };
}

// ---------- Weight softening (05 §4.7) [CLINICAL-REVIEW] ----------
export function weightSoftening(weights: WeightEntry[], skippedMealsThisWeek = 0): boolean {
  if (skippedMealsThisWeek >= SKIPPED_MEALS_PER_WEEK) return true;
  const w = [...weights].sort((a, b) => a.at.localeCompare(b.at));
  if (w.length < RAPID_LOSS_WEEKS + 1) return false;
  const last = w.slice(-(RAPID_LOSS_WEEKS + 1));
  for (let i = 1; i < last.length; i++) {
    const days = minutesBetween(last[i - 1].at, last[i].at) / (24 * 60);
    if (days <= 0) return false;
    const lossPerWeek = ((last[i - 1].kg - last[i].kg) / days) * 7;
    if (lossPerWeek <= RAPID_LOSS_KG_PER_WEEK) return false;
  }
  return true;
}

// ---------- Step-up offer (05 §4.4) ----------
export interface StepUpInput {
  now: Date;
  fasting: Fasting;
  sessions: FastSession[]; // at least the last 7 days
  readings: GlucoseReading[];
  logs: LogEntry[];
  softening: boolean;
}

export function offerNextStep({ now, fasting, sessions, readings, logs, softening }: StepUpInput): { next: FastTrack; hours: number; reason: string } | null {
  const track = fasting.track;
  if (!track || !["overnight-12", "window-13", "window-14"].includes(track)) return null;
  if (fasting.excluded) return null;
  const next = nextTrack(track);
  if (!next) return null;
  if (softening) return null;
  const step = fasting.stepUp ?? {};
  if (step.pausedUntil && now < new Date(step.pausedUntil)) return null;
  if (step.lastOfferAt && minutesBetween(step.lastOfferAt, now) < 7 * 24 * 60) return null;

  const weekAgo = addMinutes(now, -7 * 24 * 60);
  const inWeek = (iso: string) => new Date(iso) >= weekAgo && new Date(iso) <= now;
  const recent = sessions.filter((s) => inWeek(s.startedAt) || (s.endedAt && inWeek(s.endedAt)));
  const completedDays = new Set(recent.filter((s) => s.track === track && s.endedAt && !s.endedEarly).map((s) => localDay(s.endedAt!)));
  if (completedDays.size < 5) return null;

  if (recent.some((s) => s.feelings.some((f) => f.tag === "shaky-dizzy" && inWeek(f.at)))) return null;
  if (readings.some((r) => r.safety === "low" && inWeek(r.at))) return null;
  const lowUnwell = logs.some(
    (l) => l.data.kind === "feeling" && inWeek(l.at) && (l.data as FeelingData).mood === "low" && !!(l.data as FeelingData).tags?.includes("unwell"),
  );
  if (lowUnwell) return null;
  if (!canStart(next, fasting).ok) return null;
  return {
    next,
    hours: TRACK_HOURS[next as keyof typeof TRACK_HOURS],
    reason: t.fasting.stepUpReason(completedDays.size, t.fasting.trackNames[track]),
  };
}
