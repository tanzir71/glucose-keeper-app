// Glucose invitation: shouldInvite() (docs/keeper-v2/04 §2). Shown only on Week (D1), never on
// Today, never as a notification. Pure: `now` comes in.
import { t } from "@/copy/en";
import type { CheckIn, FeelingData, LogEntry, MealData, MealSlot, Settings } from "@/types/domain";
import { localDay, minutesBetween } from "./time";

/** Learn cards that count as "glucose" reading for trigger T3. */
export const GLUCOSE_LEARN_CARDS = ["what-glucose-is", "why-everyone-rises", "checking-vs-looking", "your-range"];

export interface InviteInput {
  now: Date;
  settings: Pick<Settings, "ladderStep" | "glucoseComfort" | "invitation" | "learnOpens">;
  logs: LogEntry[]; // last 14 days (meals for slot/size, feelings for the low gate, any for T2)
  checkins: CheckIn[]; // last 14 days
  activeFast?: boolean;
}

export interface Invitation {
  trigger: "T1" | "T2" | "T3";
  pattern: string;
  body: string;
  reason: string;
}

const DAY_MIN = 24 * 60;
const within = (iso: string, now: Date, days: number) => {
  const m = minutesBetween(iso, now);
  return m >= 0 && m <= days * DAY_MIN;
};

export function invitationEligible(input: InviteInput): boolean {
  const { now, settings, logs, activeFast } = input;
  const inv = settings.invitation ?? {};
  if (settings.ladderStep > 3) return false;
  if (settings.glucoseComfort !== "not-now" && settings.glucoseComfort !== "maybe-later") return false;
  if (inv.dismissedForever) return false;
  if (inv.snoozedUntil && now < new Date(inv.snoozedUntil)) return false;
  if (inv.lastShownAt && minutesBetween(inv.lastShownAt, now) < 14 * DAY_MIN) return false;
  if (activeFast) return false;
  const lowRecently = logs.some(
    (l) => l.data.kind === "feeling" && (l.data as FeelingData).mood === "low" && within(l.at, now, 1),
  );
  if (lowRecently) return false;
  return true;
}

export function shouldInvite(input: InviteInput): Invitation | null {
  if (!invitationEligible(input)) return null;
  const { now, logs, checkins, settings } = input;
  const body = t.week.invitationBody;

  // T1: ≥ 3 check-ins in 14 days that felt sleepy or heavy.
  const meals = new Map(logs.filter((l) => l.data.kind === "meal").map((l) => [l.id, l as LogEntry<MealData>]));
  const heavy = checkins.filter((c) => within(c.at, now, 14) && (c.energy === "sleepy" || c.tags.includes("heavy")));
  if (heavy.length >= 3) {
    const theirMeals = heavy.map((c) => meals.get(c.mealId)).filter((m): m is LogEntry<MealData> => !!m);
    const big = theirMeals.filter((m) => m.data.size === "big").length >= 2;
    const counts = new Map<MealSlot, number>();
    for (const m of theirMeals) if (m.data.slot) counts.set(m.data.slot, (counts.get(m.data.slot) ?? 0) + 1);
    const slot = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const slotsWord = slot ? t.slotsPlural[slot] : "meals";
    const pattern = t.invitation.t1(heavy.length, big, slotsWord);
    return { trigger: "T1", pattern, body, reason: pattern };
  }

  // T3: ≥ 2 glucose Learn cards opened in 14 days.
  const opened = new Set(
    (settings.learnOpens ?? []).filter((o) => GLUCOSE_LEARN_CARDS.includes(o.cardId) && within(o.at, now, 14)).map((o) => o.cardId),
  );
  if (opened.size >= 2) return { trigger: "T3", pattern: t.invitation.t3, body, reason: t.invitation.t3 };

  // T2: ≥ 7 distinct local days with a log in 14 days.
  const days = new Set(logs.filter((l) => within(l.at, now, 14)).map((l) => localDay(l.at)));
  if (days.size >= 7) return { trigger: "T2", pattern: t.invitation.t2, body, reason: t.invitation.t2 };

  return null;
}
