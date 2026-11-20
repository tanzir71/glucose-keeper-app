// Keeper v2 domain model. Source: docs/keeper-v2/03-architecture.md §4.
// Glucose is always stored in mg/dL and converted only for display.

export type LogKind = "meal" | "sleep" | "feeling" | "move" | "water" | "medicines";
export type Energy = "sleepy" | "steady" | "buzzy";
export type MealSize = "light" | "regular" | "big";
export type Plate = "veg-protein" | "some-carbs" | "carb-heavy";
export type MealSlot = "breakfast" | "lunch" | "tea" | "dinner" | "snack" | "suhoor" | "iftar";
export type Mood = "low" | "okay" | "good";
export type MoveType = "walk" | "stairs" | "desk-moves" | "calf-raises" | "stand" | "other";
export type Drink = "water" | "tea" | "coffee";

export type MealData = {
  kind: "meal";
  slot?: MealSlot;
  quickPick?: string;
  size: MealSize;
  feeling?: Energy;
  photoId?: string;
  plate?: Plate;
};
export type SleepData = { kind: "sleep"; hours: number; quality?: "rested" | "okay" | "poor" };
export type FeelingData = { kind: "feeling"; mood: Mood; tags?: string[] }; // tags may include "unwell"
export type MoveData = {
  kind: "move";
  type: MoveType;
  minutes?: number;
  reps?: number;
  habitId?: HabitId;
  endedEarly?: boolean;
};
export type WaterData = { kind: "water"; glasses: number; drink?: Drink };
export type MedicinesData = { kind: "medicines"; taken: boolean };

export type LogData = MealData | SleepData | FeelingData | MoveData | WaterData | MedicinesData;

export interface LogEntry<D extends LogData = LogData> {
  id: string; // crypto.randomUUID()
  kind: LogKind;
  at: string; // ISO time the thing happened
  createdAt: string;
  data: D;
}

export interface CheckIn {
  id: string;
  mealId: string;
  at: string;
  energy: Energy;
  tags: string[];
}

export type Visibility = "sealed" | "opened";
export type ReadingSafety = "none" | "low" | "very-high" | "unknown";
export type ReadingContext = "fasting" | "before-meal" | "after-meal" | "bedtime" | "other";

export interface GlucoseReading {
  id: string;
  at: string;
  valueMgdl: number | null; // null = sealed and unread (OCR failed and not typed)
  source: "photo" | "typed" | "legacy";
  photoId?: string;
  ocrConfidence?: number;
  state: Visibility;
  safety: ReadingSafety;
  context?: ReadingContext;
  mealId?: string;
  note?: string;
}

export interface Photo {
  id: string;
  kind: "meal" | "meter";
  blob: Blob;
  createdAt: string;
}

export type HabitId =
  | "stroll"
  | "stairs-stroll"
  | "hallway-laps"
  | "desk-moves"
  | "calf-raises"
  | "stand"
  | "veggies-first"
  | "calm-minute";

export type NudgeOutcome = "shown" | "accepted" | "skipped" | "completed" | "ended-early";
export interface NudgeEvent {
  id: string;
  at: string;
  habitId: HabitId;
  mealId?: string;
  place: "desk" | "home";
  outcome: NudgeOutcome;
  reason: string;
}

export type FastTrack = "overnight-12" | "window-13" | "window-14" | "window-16" | "ramadan" | "doctor-plan";
export type FastFeeling = "fine" | "hungry" | "headache" | "shaky-dizzy";
export interface FastSession {
  id: string;
  track: FastTrack;
  startedAt: string;
  plannedEndAt: string;
  endedAt?: string;
  endedEarly?: boolean;
  endReason?: "planned" | "chose" | "symptom" | "reading";
  feelings: { at: string; tag: FastFeeling }[];
  drinks: { at: string; drink: Drink }[];
}

export interface WeightEntry {
  id: string;
  at: string;
  kg: number;
}

export type Workday = "desk" | "on-feet" | "home" | "shifts";
export type RhythmMealSlot = "breakfast" | "lunch" | "tea" | "dinner";

export interface Rhythm {
  wake?: string; // "HH:mm"
  sleep?: string; // "HH:mm"
  meals?: Partial<Record<RhythmMealSlot, string>>;
  workday?: Workday;
  workHours?: { start: string; end: string }; // default 09:00–17:00 when workday=desk
  workDays?: number[]; // 0 = Sunday … 6 = Saturday. Overrides the time-zone default.
  anchors?: string[]; // "morning-tea" | "commute" | "prayer-times" | "evening-walk" | custom
  fastingDays?: boolean;
  indoorPreferred?: boolean;
  city?: { name: string; lat: number; lng: number };
}

export type GlucoseComfort = "not-now" | "maybe-later" | "sealed" | "ranges" | "numbers";
export type LadderStep = 1 | 2 | 3 | 4 | 5 | 6;
export type YesNoNotSure = "yes" | "no" | "not-sure";
export type GlucoseUnit = "mmol/L" | "mg/dL";

export interface RamadanSettings {
  startDate?: string; // user-confirmed local date "YYYY-MM-DD" (moon sighting, never predicted)
  days?: 29 | 30;
  method: "Karachi" | "MuslimWorldLeague" | "UmmAlQura" | "Egyptian" | "NorthAmerica" | "Dubai";
  suhoorOffsetMin: number; // [REVIEW] local Sehri convention; default 0
  water?: Record<string, number>; // local day → glasses between iftar and suhoor
}

export interface Settings {
  onboarded: boolean;
  name?: string;
  easyKinds: LogKind[];
  unit: GlucoseUnit;
  glucoseComfort: GlucoseComfort;
  ladderStep: LadderStep;
  targetRange: { lowMgdl: number; highMgdl: number }; // default 70–180 [CLINICAL-REVIEW]
  tinyHabits: boolean;
  habitsEnabled: HabitId[];
  habitSafetyNoteSeen: boolean;
  rhythm?: Rhythm;
  invitation: { lastShownAt?: string; snoozedUntil?: string; dismissedForever?: boolean };
  fasting: {
    track?: FastTrack;
    excluded?: boolean;
    exclusionAsked?: boolean;
    medsLowRisk?: YesNoNotSure;
    medsSglt2?: YesNoNotSure;
    careTeamConfirmed?: boolean;
    doctorPlan?: { hours: number; checks: string[]; notes?: string };
    windowStart?: string; // "HH:mm" eating window opens (window tracks)
    stepUp?: { lastOfferAt?: string; pausedUntil?: string };
    ramadan?: RamadanSettings;
  };
  weightTracking: boolean;
  showWeightNumber: boolean;
  migratedV2: boolean;
  /** Learn cards opened, for the invitation engine's T3 trigger. Capped to the last 50. */
  learnOpens?: { cardId: string; at: string }[];
  /** "Ask me later" on the after-meal check-in: re-prompt once, 30 min later. */
  checkinSnooze?: { mealId: string; until: string };
  /** Check-ins dismissed with the close button (never prompt again for that meal). */
  checkinDismissed?: string[];
  /** Daily reminder time for the optional .ics calendar nudge. */
  reminderTime?: string;
  /** "Not now" on the install card hides it for a while. */
  installPrompt?: { snoozedUntil?: string };
}
