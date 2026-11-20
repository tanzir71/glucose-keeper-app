import { describe, expect, it } from "vitest";
import { shouldInvite, type InviteInput } from "./invitation";
import type { CheckIn, LogEntry, LogData } from "@/types/domain";

const NOW = new Date("2026-11-20T12:00:00");
const daysAgo = (n: number, h = 13) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  d.setHours(h, 0, 0, 0);
  return d;
};

let seq = 0;
const log = (when: Date, data: LogData, id = `l${seq++}`): LogEntry => ({ id, kind: data.kind, at: when.toISOString(), createdAt: when.toISOString(), data });
const checkin = (when: Date, mealId: string, energy: CheckIn["energy"], tags: string[] = []): CheckIn => ({ id: `c${seq++}`, mealId, at: when.toISOString(), energy, tags });

function sleepyLunches(n: number, bigCount: number) {
  const logs: LogEntry[] = [];
  const checkins: CheckIn[] = [];
  for (let i = 0; i < n; i++) {
    const id = `meal-${i}`;
    logs.push(log(daysAgo(i + 1, 13), { kind: "meal", slot: "lunch", size: i < bigCount ? "big" : "regular" }, id));
    checkins.push(checkin(daysAgo(i + 1, 15), id, "sleepy"));
  }
  return { logs, checkins };
}

const oneLogPerDay = (days: number) => Array.from({ length: days }, (_, i) => log(daysAgo(i, 9), { kind: "water", glasses: 1 }));

function input(over: Partial<Omit<InviteInput, "settings">> & { settings?: Partial<InviteInput["settings"]> } = {}): InviteInput {
  return {
    now: NOW,
    logs: over.logs ?? [],
    checkins: over.checkins ?? [],
    activeFast: over.activeFast,
    settings: { ladderStep: 1, glucoseComfort: "not-now", invitation: {}, learnOpens: [], ...over.settings },
  };
}

describe("shouldInvite triggers", () => {
  it("T1: 3 sleepy big lunches", () => {
    const r = shouldInvite(input(sleepyLunches(3, 2)));
    expect(r?.trigger).toBe("T1");
    expect(r?.pattern).toBe("You felt sleepy after 3 big lunches.");
  });

  it("every trigger carries a human-readable reason with counts", () => {
    expect(shouldInvite(input(sleepyLunches(3, 2)))?.reason).toBe("3 sleepy or heavy check-ins in the last two weeks");
    expect(shouldInvite(input({ logs: oneLogPerDay(8) }))?.reason).toBe("8 days with something logged in the last two weeks");
  });

  it("T1: 'big' only when at least 2 of those meals were big", () => {
    expect(shouldInvite(input(sleepyLunches(3, 1)))?.pattern).toBe("You felt sleepy after 3 lunches.");
  });

  it("T1 counts the 'heavy' tag too", () => {
    const { logs, checkins } = sleepyLunches(2, 0);
    logs.push(log(daysAgo(5), { kind: "meal", slot: "lunch", size: "regular" }, "m-heavy"));
    checkins.push(checkin(daysAgo(5, 15), "m-heavy", "steady", ["heavy"]));
    expect(shouldInvite(input({ logs, checkins }))?.trigger).toBe("T1");
  });

  it("T3: two glucose Learn cards in 14 days", () => {
    const r = shouldInvite(
      input({ settings: { learnOpens: [{ cardId: "what-glucose-is", at: daysAgo(2).toISOString() }, { cardId: "your-range", at: daysAgo(3).toISOString() }] } }),
    );
    expect(r?.trigger).toBe("T3");
  });

  it("T3 ignores the same card twice and habit cards", () => {
    const r = shouldInvite(
      input({ settings: { learnOpens: [{ cardId: "what-glucose-is", at: daysAgo(2).toISOString() }, { cardId: "what-glucose-is", at: daysAgo(1).toISOString() }, { cardId: "stroll", at: daysAgo(1).toISOString() }] } }),
    );
    expect(r).toBeNull();
  });

  it("T2: 7 distinct days with a log", () => {
    expect(shouldInvite(input({ logs: oneLogPerDay(7) }))?.trigger).toBe("T2");
    expect(shouldInvite(input({ logs: oneLogPerDay(6) }))).toBeNull();
  });

  it("priority: T1 > T3 > T2", () => {
    const s = sleepyLunches(3, 0);
    const learn = { learnOpens: [{ cardId: "what-glucose-is", at: daysAgo(2).toISOString() }, { cardId: "your-range", at: daysAgo(3).toISOString() }] };
    expect(shouldInvite(input({ logs: [...s.logs, ...oneLogPerDay(8)], checkins: s.checkins, settings: learn }))?.trigger).toBe("T1");
    expect(shouldInvite(input({ logs: oneLogPerDay(8), settings: learn }))?.trigger).toBe("T3");
  });
});

describe("shouldInvite gates", () => {
  const eligible = () => ({ logs: oneLogPerDay(8) });

  it("ladderStep 4 never invites", () => {
    expect(shouldInvite(input({ ...eligible(), settings: { ladderStep: 4 } }))).toBeNull();
  });

  it.each(["sealed", "ranges", "numbers"] as const)("comfort %s blocks", (c) => {
    expect(shouldInvite(input({ ...eligible(), settings: { glucoseComfort: c } }))).toBeNull();
  });

  it("maybe-later is allowed", () => {
    expect(shouldInvite(input({ ...eligible(), settings: { glucoseComfort: "maybe-later" } }))).not.toBeNull();
  });

  it("dismissed forever blocks", () => {
    expect(shouldInvite(input({ ...eligible(), settings: { invitation: { dismissedForever: true } } }))).toBeNull();
  });

  it("snooze boundary at exactly 14 days", () => {
    const until = new Date(NOW.getTime() + 1);
    expect(shouldInvite(input({ ...eligible(), settings: { invitation: { snoozedUntil: until.toISOString() } } }))).toBeNull();
    expect(shouldInvite(input({ ...eligible(), settings: { invitation: { snoozedUntil: NOW.toISOString() } } }))).not.toBeNull();
  });

  it("at least 14 days since it was last shown", () => {
    const justUnder = new Date(NOW.getTime() - 14 * 86_400_000 + 60_000).toISOString();
    const exactly = new Date(NOW.getTime() - 14 * 86_400_000).toISOString();
    expect(shouldInvite(input({ ...eligible(), settings: { invitation: { lastShownAt: justUnder } } }))).toBeNull();
    expect(shouldInvite(input({ ...eligible(), settings: { invitation: { lastShownAt: exactly } } }))).not.toBeNull();
  });

  it("an active fast blocks", () => {
    expect(shouldInvite(input({ ...eligible(), activeFast: true }))).toBeNull();
  });

  it("a low feeling in the last 24 h blocks", () => {
    const logs = [...oneLogPerDay(8), log(new Date(NOW.getTime() - 3 * 3_600_000), { kind: "feeling", mood: "low" })];
    expect(shouldInvite(input({ logs }))).toBeNull();
  });
});
