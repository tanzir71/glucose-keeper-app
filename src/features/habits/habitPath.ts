import type { Nudge } from "@/lib/rules/smart-timing";

/** Route for a nudge's timer/count screen; the dose travels in the query string. */
export function habitPath(n: Pick<Nudge, "habitId" | "durationSec" | "reps" | "mealId" | "place">) {
  const q = new URLSearchParams();
  if (n.durationSec) q.set("min", String(Math.round(n.durationSec / 60)));
  if (n.reps) q.set("reps", String(n.reps));
  if (n.mealId) q.set("meal", n.mealId);
  q.set("place", n.place);
  return `/habit/${n.habitId}?${q.toString()}`;
}
