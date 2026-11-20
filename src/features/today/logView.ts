import { t } from "@/copy/en";
import type { QuiltPatch } from "@/components/keeper/Visuals";
import type { LogEntry } from "@/types/domain";

export function logTitle(l: LogEntry): { title: string; meta?: string } {
  const d = l.data;
  switch (d.kind) {
    case "meal": {
      const slot = d.slot ? t.slots[d.slot] : t.kinds.meal;
      return { title: d.quickPick || slot, meta: t.timeline.mealMeta(slot, t.sizes[d.size], d.feeling ? t.energy[d.feeling] : undefined) };
    }
    case "sleep":
      return { title: t.timeline.sleep(d.hours), meta: t.timeline.sleepMeta(d.quality ? t.sleep.qualities[d.quality].toLowerCase() : undefined) };
    case "feeling":
      return { title: t.timeline.feeling(t.moods[d.mood]), meta: d.tags?.map((x) => t.feeling.tags[x] ?? x).join(" · ") || undefined };
    case "move": {
      const habit = d.habitId ? t.habits[d.habitId].title : t.moveTypes[d.type];
      return { title: t.timeline.move(habit, d.minutes, d.reps), meta: d.endedEarly ? t.timeline.endedEarly : d.habitId ? t.today.habitLeaf : undefined };
    }
    case "water":
      return { title: t.timeline.water(d.glasses, d.drink ? t.water.drinks[d.drink].toLowerCase() : undefined) };
    case "medicines":
      return { title: t.timeline.medicines };
  }
}

/** Today's patches: one per log, newest last, with a leaf on finished tiny habits. */
export function patchesFor(logs: LogEntry[]): QuiltPatch[] {
  return logs.map((l) => ({
    kind: l.kind,
    solid: l.kind === "meal" || l.kind === "move" || l.kind === "water",
    leaf: l.data.kind === "move" && !!l.data.habitId,
  }));
}
