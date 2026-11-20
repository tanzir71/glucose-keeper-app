import { describe, expect, it } from "vitest";
import { pickNudge, type NudgeInput } from "./smart-timing";
import type { CheckIn, HabitId, LogEntry, LogData, NudgeEvent, Rhythm, Settings } from "@/types/domain";
import { ALL_HABIT_IDS } from "@/lib/habits";

// TZ is pinned to Asia/Dhaka in vitest.config.ts. 2026-11-19 is a Thursday.
const DAYS = { thu: "2026-11-19", fri: "2026-11-20", sat: "2026-11-21", sun: "2026-11-22", mon: "2026-11-23" } as const;
const at = (day: keyof typeof DAYS, time: string) => new Date(`${DAYS[day]}T${time}:00`);
const TZ = "Asia/Dhaka";

let seq = 0;
const log = (when: Date, data: LogData, id = `l${seq++}`): LogEntry => ({
  id,
  kind: data.kind,
  at: when.toISOString(),
  createdAt: when.toISOString(),
  data,
});
const meal = (when: Date, size: "light" | "regular" | "big", slot: "lunch" | "dinner" | "snack" | "breakfast", extra: Partial<Extract<LogData, { kind: "meal" }>> = {}, id?: string) =>
  log(when, { kind: "meal", size, slot, ...extra }, id);
const walk = (when: Date) => log(when, { kind: "move", type: "walk", minutes: 10 });
const nudgeEvent = (when: Date, habitId: HabitId, outcome: NudgeEvent["outcome"], place: "desk" | "home", mealId?: string): NudgeEvent => ({
  id: `n${seq++}`,
  at: when.toISOString(),
  habitId,
  outcome,
  place,
  mealId,
  reason: "",
});

const DESK: Rhythm = { workday: "desk", workHours: { start: "09:00", end: "17:00" } };
const HOME: Rhythm = { workday: "home" };

function input(over: Partial<NudgeInput> & { rhythm?: Rhythm; tinyHabits?: boolean; habitsEnabled?: HabitId[] }): NudgeInput {
  const settings: Pick<Settings, "tinyHabits" | "habitsEnabled" | "rhythm"> = {
    tinyHabits: over.tinyHabits ?? true,
    habitsEnabled: over.habitsEnabled ?? [...ALL_HABIT_IDS],
    rhythm: over.rhythm,
  };
  return {
    now: over.now!,
    settings,
    logs: over.logs ?? [],
    checkins: over.checkins ?? [],
    nudges: over.nudges ?? [],
    activeFast: over.activeFast,
    tz: TZ,
  };
}

describe("pickNudge: test table (04 §1)", () => {
  it("#1 tinyHabits off → null", () => {
    expect(pickNudge(input({ tinyHabits: false, now: at("thu", "13:40"), rhythm: DESK, logs: [meal(at("thu", "13:15"), "big", "lunch")] }))).toBeNull();
  });

  it("#2 Thu 13:40 desk, big lunch 13:15 → calf-raises 20 reps", () => {
    const n = pickNudge(input({ now: at("thu", "13:40"), rhythm: DESK, logs: [meal(at("thu", "13:15"), "big", "lunch")] }));
    expect(n).toMatchObject({ habitId: "calf-raises", reps: 20, place: "desk", kind: "count" });
    expect(n!.reason).toBe("25 min after a big lunch · desk day");
  });

  it("#3 Thu 13:25 desk, big lunch 13:15 → stairs-stroll 5 min", () => {
    const n = pickNudge(input({ now: at("thu", "13:25"), rhythm: DESK, logs: [meal(at("thu", "13:15"), "big", "lunch")] }));
    expect(n).toMatchObject({ habitId: "stairs-stroll", durationSec: 300 });
  });

  it("#4 Thu 13:25 desk, light snack 13:15 → null", () => {
    expect(pickNudge(input({ now: at("thu", "13:25"), rhythm: DESK, logs: [meal(at("thu", "13:15"), "light", "snack")] }))).toBeNull();
  });

  it("#5 never stack: walk logged 13:30 → null", () => {
    expect(
      pickNudge(input({ now: at("thu", "13:40"), rhythm: DESK, logs: [meal(at("thu", "13:15"), "big", "lunch"), walk(at("thu", "13:30"))] })),
    ).toBeNull();
  });

  it("#6 Thu 14:50, lunch 13:15 → null (expired after 90 min)", () => {
    expect(pickNudge(input({ now: at("thu", "14:50"), logs: [meal(at("thu", "13:15"), "regular", "lunch")] }))).toBeNull();
  });

  it("#7 Friday is the weekend in Bangladesh: desk rhythm counts as home → stroll 2 min", () => {
    const n = pickNudge(input({ now: at("fri", "13:20"), rhythm: DESK, logs: [meal(at("fri", "13:00"), "regular", "lunch")] }));
    expect(n).toMatchObject({ habitId: "stroll", durationSec: 120, place: "home" });
  });

  it("#8 Sun 21:00 home, dinner 20:45, evening-walk anchor → stroll 10 min", () => {
    const n = pickNudge(
      input({ now: at("sun", "21:00"), rhythm: { ...HOME, anchors: ["evening-walk"] }, logs: [meal(at("sun", "20:45"), "regular", "dinner")] }),
    );
    expect(n).toMatchObject({ habitId: "stroll", durationSec: 600 });
    expect(n!.reason).toContain("your evening-walk anchor");
  });

  it("#9 23:10 quiet hours (sleep 23:00) → null", () => {
    expect(
      pickNudge(input({ now: at("thu", "23:10"), rhythm: { ...HOME, sleep: "23:00" }, logs: [meal(at("thu", "23:00"), "regular", "snack")] })),
    ).toBeNull();
  });

  it("#10 Mon 11:00 desk, no meal since 08:00, no move since 09:20 → desk-moves 3 min", () => {
    const n = pickNudge(
      input({ now: at("mon", "11:00"), rhythm: DESK, logs: [meal(at("mon", "08:00"), "regular", "breakfast"), walk(at("mon", "09:20"))] }),
    );
    expect(n).toMatchObject({ habitId: "desk-moves", durationSec: 180 });
    expect(n!.reason).toBe("90 min of sitting · desk day");
  });

  it("#11 as #2, but calf-raises skipped 3× at desk in 14 days → desk-moves", () => {
    const skips = [1, 3, 5].map((d) => nudgeEvent(new Date(at("thu", "13:40").getTime() - d * 86_400_000), "calf-raises", "skipped", "desk"));
    const n = pickNudge(input({ now: at("thu", "13:40"), rhythm: DESK, logs: [meal(at("thu", "13:15"), "big", "lunch")], nudges: skips }));
    expect(n?.habitId).toBe("desk-moves");
  });

  it("#12 Ramadan fast active at 15:00 → null", () => {
    const n = pickNudge(
      input({
        now: at("thu", "15:00"),
        rhythm: HOME,
        logs: [meal(at("thu", "14:30"), "big", "lunch")],
        activeFast: {
          id: "f",
          track: "ramadan",
          startedAt: at("thu", "04:58").toISOString(),
          plannedEndAt: at("thu", "17:30").toISOString(),
          feelings: [],
          drinks: [],
          inEatingWindow: false,
        },
      }),
    );
    expect(n).toBeNull();
  });

  it("#13 as #2, meal feeling sleepy → calf-raises and the reason says so", () => {
    const n = pickNudge(input({ now: at("thu", "13:40"), rhythm: DESK, logs: [meal(at("thu", "13:15"), "big", "lunch", { feeling: "sleepy" })] }));
    expect(n?.habitId).toBe("calf-raises");
    expect(n!.reason).toContain("you felt sleepy");
  });

  it("#14 Sat 13:30 home, big lunch 13:15, slept 5 h → stroll 2 min (5 halved, min 2)", () => {
    const n = pickNudge(
      input({
        now: at("sat", "13:30"),
        rhythm: HOME,
        logs: [log(at("sat", "07:00"), { kind: "sleep", hours: 5 }), meal(at("sat", "13:15"), "big", "lunch")],
      }),
    );
    expect(n).toMatchObject({ habitId: "stroll", durationSec: 120 });
  });

  it("#15 12:50, usual lunch 13:15, veggies-first on → tip", () => {
    const n = pickNudge(input({ now: at("thu", "12:50"), rhythm: { meals: { lunch: "13:15" } } }));
    expect(n).toMatchObject({ habitId: "veggies-first", kind: "tip" });
    expect(n!.reason).toBe("your usual lunch is 13:15");
    expect(n!.body).toBe("Lunch soon? Shak and fish first, rice last.");
  });

  it("#16 latest feeling today low + unwell → null", () => {
    const n = pickNudge(
      input({
        now: at("thu", "13:40"),
        rhythm: HOME,
        logs: [log(at("thu", "12:00"), { kind: "feeling", mood: "low", tags: ["unwell"] }), meal(at("thu", "13:15"), "big", "lunch")],
      }),
    );
    expect(n).toBeNull();
  });
});

describe("pickNudge: more cases", () => {
  it("returns the same habit while the meal's nudge has only been shown", () => {
    const m = meal(at("thu", "13:15"), "big", "lunch", {}, "lunch-1");
    const shown = nudgeEvent(at("thu", "13:26"), "stairs-stroll", "shown", "desk", "lunch-1");
    // At 13:40 the desk order would put calf-raises first, but the card stays stable.
    const n = pickNudge(input({ now: at("thu", "13:40"), rhythm: DESK, logs: [m], nudges: [shown] }));
    expect(n?.habitId).toBe("stairs-stroll");
  });

  it("one per meal: skipped → null", () => {
    const m = meal(at("thu", "13:15"), "big", "lunch", {}, "lunch-2");
    const skipped = nudgeEvent(at("thu", "13:30"), "calf-raises", "skipped", "desk", "lunch-2");
    expect(pickNudge(input({ now: at("thu", "13:40"), rhythm: DESK, logs: [m], nudges: [skipped] }))).toBeNull();
  });

  it("on feet during work hours → null", () => {
    expect(
      pickNudge(input({ now: at("thu", "13:40"), rhythm: { workday: "on-feet" }, logs: [meal(at("thu", "13:15"), "big", "lunch")] })),
    ).toBeNull();
  });

  it("evening at home without the anchor → hallway laps first", () => {
    const n = pickNudge(input({ now: at("thu", "20:00"), rhythm: HOME, logs: [meal(at("thu", "19:45"), "regular", "dinner")] }));
    expect(n?.habitId).toBe("hallway-laps");
    expect(n!.reason).toContain("evening");
  });

  it("sleepy at home → stand moves to the front", () => {
    const n = pickNudge(
      input({ now: at("sat", "13:30"), rhythm: HOME, logs: [meal(at("sat", "13:15"), "regular", "lunch", {}, "m-s")], checkins: [{ id: "c", mealId: "m-s", at: at("sat", "13:29").toISOString(), energy: "sleepy", tags: [] } as CheckIn] }),
    );
    expect(n?.habitId).toBe("stand");
  });

  it("a habit picked ≥60% of the time (min 3 shows) moves up one position", () => {
    const base = at("thu", "13:40").getTime();
    const ev: NudgeEvent[] = [];
    for (let i = 1; i <= 3; i++) {
      ev.push(nudgeEvent(new Date(base - i * 86_400_000), "desk-moves", "shown", "desk"));
      ev.push(nudgeEvent(new Date(base - i * 86_400_000 + 60_000), "desk-moves", "accepted", "desk"));
    }
    const n = pickNudge(input({ now: at("thu", "13:40"), rhythm: DESK, logs: [meal(at("thu", "13:15"), "big", "lunch")], nudges: ev }));
    expect(n?.habitId).toBe("desk-moves");
    expect(n!.reason).toContain("you usually pick this");
  });

  it("nothing enabled → null", () => {
    expect(
      pickNudge(input({ now: at("thu", "13:40"), rhythm: DESK, habitsEnabled: ["veggies-first"], logs: [meal(at("thu", "13:15"), "big", "lunch")] })),
    ).toBeNull();
  });

  it("desk break: no more than 2 a day, at least 120 min apart", () => {
    const logs = [walk(at("mon", "09:00"))];
    const shown = [nudgeEvent(at("mon", "10:30"), "desk-moves", "shown", "desk")];
    // 11:00: last desk break 30 min ago → null (and sitting since 09:00 = 120 min).
    expect(pickNudge(input({ now: at("mon", "11:00"), rhythm: DESK, logs, nudges: shown }))).toBeNull();
    // 12:40: 130 min later → allowed.
    expect(pickNudge(input({ now: at("mon", "12:40"), rhythm: DESK, logs, nudges: shown }))?.habitId).toBe("desk-moves");
    const two = [...shown, nudgeEvent(at("mon", "12:40"), "desk-moves", "shown", "desk")];
    expect(pickNudge(input({ now: at("mon", "15:00"), rhythm: DESK, logs, nudges: two }))).toBeNull();
  });

  it("pre-meal tip only once a day", () => {
    const shown = [nudgeEvent(at("thu", "07:00"), "veggies-first", "shown", "home")];
    expect(pickNudge(input({ now: at("thu", "12:50"), rhythm: { meals: { lunch: "13:15" } }, nudges: shown }))).toBeNull();
  });
});
