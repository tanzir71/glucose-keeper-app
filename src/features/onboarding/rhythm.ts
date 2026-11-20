import type { Rhythm } from "@/types/domain";

/** True when nothing in the rhythm form has been filled in. */
export const rhythmIsEmpty = (r: Rhythm) =>
  !r.wake && !r.sleep && !Object.values(r.meals ?? {}).some(Boolean) && !r.workday && !(r.anchors?.length) && !r.fastingDays;
