import { Footprints, GlassWater, Moon, Pill, Smile, Utensils, Mail, Leaf, type LucideIcon } from "lucide-react";
import type { LogKind } from "@/types/domain";

export type DotKind = LogKind | "envelope" | "habit";

export const KIND_ICON: Record<DotKind, LucideIcon> = {
  meal: Utensils,
  sleep: Moon,
  feeling: Smile,
  move: Footprints,
  water: GlassWater,
  medicines: Pill,
  envelope: Mail,
  habit: Leaf,
};

/** Soft fill per kind. Accent colours are fills only, never text. */
export const KIND_SOFT: Record<DotKind, string> = {
  meal: "bg-meal-soft",
  sleep: "bg-sleep-soft",
  feeling: "bg-feeling-soft",
  move: "bg-move-soft",
  water: "bg-water-soft",
  medicines: "bg-primary-soft",
  envelope: "bg-primary-soft",
  habit: "bg-move-soft",
};

export const KIND_SOLID: Record<DotKind, string> = {
  meal: "bg-meal",
  sleep: "bg-sleep",
  feeling: "bg-feeling",
  move: "bg-move",
  water: "bg-water",
  medicines: "bg-primary",
  envelope: "bg-primary",
  habit: "bg-move",
};

export const TILE_KINDS: LogKind[] = ["meal", "sleep", "feeling", "move", "water", "medicines"];
