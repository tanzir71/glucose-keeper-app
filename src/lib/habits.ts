// Tiny-habit library (05 §5). Display strings live in src/copy/en.ts under `habits`.
// [CLINICAL-REVIEW] habit descriptions, evidence tags and the safety note.
import type { HabitId, MoveType } from "@/types/domain";

export type EvidenceTag = "Meta-analysis" | "Small trial" | "Early research" | "Small trials" | "Expert opinion";
export type HabitKind = "timer" | "count" | "tip";

export interface HabitDef {
  id: HabitId;
  evidence: EvidenceTag;
  source: string;
  kind: HabitKind;
  /** Move log type written when the habit is finished. */
  moveType?: MoveType;
  /** Shown in the after-meal / desk nudges (calm-minute is library-only). */
  nudgeable: boolean;
}

export const HABITS: Record<HabitId, HabitDef> = {
  stroll: { id: "stroll", evidence: "Meta-analysis", source: "Buffey et al., Sports Medicine 2022", kind: "timer", moveType: "walk", nudgeable: true },
  "stairs-stroll": { id: "stairs-stroll", evidence: "Meta-analysis", source: "Buffey et al., Sports Medicine 2022", kind: "timer", moveType: "stairs", nudgeable: true },
  "hallway-laps": { id: "hallway-laps", evidence: "Meta-analysis", source: "Buffey et al., Sports Medicine 2022", kind: "timer", moveType: "walk", nudgeable: true },
  "desk-moves": { id: "desk-moves", evidence: "Small trial", source: "Dempsey et al., Diabetes Care 2016", kind: "timer", moveType: "desk-moves", nudgeable: true },
  "calf-raises": { id: "calf-raises", evidence: "Early research", source: "Hamilton et al., iScience 2022", kind: "count", moveType: "calf-raises", nudgeable: true },
  stand: { id: "stand", evidence: "Meta-analysis", source: "Buffey et al., Sports Medicine 2022", kind: "timer", moveType: "stand", nudgeable: true },
  "veggies-first": { id: "veggies-first", evidence: "Small trials", source: "Shukla et al., Diabetes Care 2015; BMJ Open Diabetes Res Care 2017", kind: "tip", nudgeable: true },
  "calm-minute": { id: "calm-minute", evidence: "Expert opinion", source: "Keeper fasting companion", kind: "tip", nudgeable: false },
};

export const ALL_HABIT_IDS: HabitId[] = [
  "stroll",
  "stairs-stroll",
  "hallway-laps",
  "desk-moves",
  "calf-raises",
  "stand",
  "veggies-first",
  "calm-minute",
];

export const isHabitId = (v: string | undefined): v is HabitId => !!v && (ALL_HABIT_IDS as string[]).includes(v);
