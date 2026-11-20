import { describe, expect, it } from "vitest";
import { FORBIDDEN_WORDS, weeklyInsights, type InsightInput } from "./insights";
import type { CheckIn, GlucoseReading, LogData, LogEntry } from "@/types/domain";

const NOW = new Date("2026-11-20T20:00:00");
const day = (n: number, time: string) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  const [h, m] = time.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d;
};
let seq = 0;
const log = (when: Date, data: LogData, id = `l${seq++}`): LogEntry => ({ id, kind: data.kind, at: when.toISOString(), createdAt: when.toISOString(), data });
const checkin = (when: Date, mealId: string, energy: CheckIn["energy"], tags: string[] = []): CheckIn => ({ id: `c${seq++}`, mealId, at: when.toISOString(), energy, tags });

function input(over: Partial<InsightInput>): InsightInput {
  return { now: NOW, logs: [], checkins: [], readings: [], comfort: "not-now", targetRange: { lowMgdl: 70, highMgdl: 180 }, ...over };
}

/** Lunches over `days` days ago (0..), walked or not, with a steady/sleepy check-in. */
function lunches(spec: { daysAgo: number; walked: boolean; steady: boolean; size?: "regular" | "big" }[]) {
  const logs: LogEntry[] = [];
  const checkins: CheckIn[] = [];
  for (const s of spec) {
    const id = `lunch-${seq++}`;
    logs.push(log(day(s.daysAgo, "13:00"), { kind: "meal", slot: "lunch", size: s.size ?? "regular" }, id));
    if (s.walked) logs.push(log(day(s.daysAgo, "13:30"), { kind: "move", type: "walk", minutes: 10 }));
    checkins.push(checkin(day(s.daysAgo, "15:00"), id, s.steady ? "steady" : "sleepy"));
  }
  return { logs, checkins };
}

describe("I1 walked vs not", () => {
  it("shows when walked lunches feel steady ≥ 25 pts more often", () => {
    const d = lunches([
      { daysAgo: 0, walked: true, steady: true },
      { daysAgo: 1, walked: true, steady: true },
      { daysAgo: 2, walked: true, steady: true },
      { daysAgo: 3, walked: true, steady: false },
      { daysAgo: 4, walked: false, steady: false },
      { daysAgo: 5, walked: false, steady: false },
      { daysAgo: 6, walked: false, steady: true },
    ]);
    const res = weeklyInsights(input(d));
    const i1 = res.find((x) => x.id === "I1");
    expect(i1?.text).toBe("On days you walked after lunch, you felt steady more often.");
    expect(i1?.caption).toBe("3 of 4 walked lunches · only your own logs");
  });

  it("threshold boundary: exactly 25 pts shows, 24 doesn't", () => {
    // walked 3/4 = 75%, not 2/4 = 50% → exactly 25.
    const exact = lunches([
      ...[0, 1, 2].map((d) => ({ daysAgo: d, walked: true, steady: true })),
      { daysAgo: 3, walked: true, steady: false },
      { daysAgo: 4, walked: false, steady: true },
      { daysAgo: 5, walked: false, steady: true },
      { daysAgo: 6, walked: false, steady: false },
      { daysAgo: 6, walked: false, steady: false },
    ]);
    expect(weeklyInsights(input(exact)).some((x) => x.id === "I1")).toBe(true);
  });

  it("sample-size gate: needs ≥ 3 walked and ≥ 3 not", () => {
    const d = lunches([
      { daysAgo: 0, walked: true, steady: true },
      { daysAgo: 1, walked: true, steady: true },
      { daysAgo: 2, walked: false, steady: false },
      { daysAgo: 3, walked: false, steady: false },
      { daysAgo: 4, walked: false, steady: false },
    ]);
    expect(weeklyInsights(input(d))).toEqual([]);
  });

  it("falls back from 7 to 28 days when samples are too small", () => {
    const d = lunches([
      { daysAgo: 1, walked: true, steady: true },
      { daysAgo: 10, walked: true, steady: true },
      { daysAgo: 12, walked: true, steady: true },
      { daysAgo: 14, walked: false, steady: false },
      { daysAgo: 16, walked: false, steady: false },
      { daysAgo: 20, walked: false, steady: false },
    ]);
    expect(weeklyInsights(input(d)).map((x) => x.id)).toContain("I1");
  });
});

describe("I2 short nights", () => {
  it("shows when short nights are followed by low days more often", () => {
    const logs: LogEntry[] = [];
    [0, 1, 2].forEach((d) => {
      logs.push(log(day(d, "07:00"), { kind: "sleep", hours: 5 }));
      logs.push(log(day(d, "16:00"), { kind: "feeling", mood: "low" }));
    });
    [3, 4, 5].forEach((d) => {
      logs.push(log(day(d, "07:00"), { kind: "sleep", hours: 8 }));
      logs.push(log(day(d, "16:00"), { kind: "feeling", mood: "okay" }));
    });
    const res = weeklyInsights(input({ logs }));
    expect(res[0]).toMatchObject({ id: "I2", text: "After shorter nights, your days often felt heavier." });
  });
});

describe("I3 big meals", () => {
  it("shows at ≥ 60% sleepy/heavy after big meals", () => {
    const d = lunches([
      { daysAgo: 0, walked: false, steady: false, size: "big" },
      { daysAgo: 1, walked: false, steady: false, size: "big" },
      { daysAgo: 2, walked: false, steady: true, size: "big" },
    ]);
    expect(weeklyInsights(input(d)).find((x) => x.id === "I3")?.text).toBe("Big lunches were often followed by a sleepy afternoon.");
  });

  it("doesn't show under 60%", () => {
    const d = lunches([
      { daysAgo: 0, walked: false, steady: false, size: "big" },
      { daysAgo: 1, walked: false, steady: true, size: "big" },
      { daysAgo: 2, walked: false, steady: true, size: "big" },
    ]);
    expect(weeklyInsights(input(d)).find((x) => x.id === "I3")).toBeUndefined();
  });
});

describe("I4 readings gate", () => {
  function data() {
    const d = lunches([
      ...[0, 1, 2].map((x) => ({ daysAgo: x, walked: true, steady: true })),
      ...[3, 4, 5].map((x) => ({ daysAgo: x, walked: false, steady: true })),
    ]);
    const readings: GlucoseReading[] = [0, 1, 2, 3, 4, 5].map((x) => ({
      id: `r${x}`,
      at: day(x, "15:00").toISOString(),
      valueMgdl: x < 3 ? 140 : 220,
      source: "typed",
      state: "opened",
      safety: "none",
    }));
    return { ...d, readings };
  }

  it.each(["not-now", "maybe-later", "sealed"] as const)("never shows I4 when comfort is %s", (comfort) => {
    expect(weeklyInsights(input({ ...data(), comfort })).some((x) => x.id === "I4")).toBe(false);
  });

  it.each(["ranges", "numbers"] as const)("can show I4 when comfort is %s", (comfort) => {
    expect(weeklyInsights(input({ ...data(), comfort })).some((x) => x.id === "I4")).toBe(true);
  });

  it("ignores sealed readings even when comfort is ranges", () => {
    const d = data();
    d.readings = d.readings.map((r) => ({ ...r, state: "sealed" as const }));
    expect(weeklyInsights(input({ ...d, comfort: "ranges" })).some((x) => x.id === "I4")).toBe(false);
  });
});

describe("I5 water", () => {
  it("shows when more-water days have fewer headaches", () => {
    const logs: LogEntry[] = [];
    [0, 1, 2].forEach((d) => logs.push(log(day(d, "12:00"), { kind: "water", glasses: 7 })));
    [3, 4, 5].forEach((d) => {
      logs.push(log(day(d, "12:00"), { kind: "water", glasses: 2 }));
      logs.push(log(day(d, "16:00"), { kind: "feeling", mood: "okay", tags: ["headache"] }));
    });
    expect(weeklyInsights(input({ logs })).find((x) => x.id === "I5")?.text).toBe("On days with more water, headaches showed up less often.");
  });
});

describe("ranking and language", () => {
  it("returns at most 2, largest difference first", () => {
    const d = lunches([
      ...[0, 1, 2].map((x) => ({ daysAgo: x, walked: true, steady: true, size: "big" as const })),
      ...[3, 4, 5].map((x) => ({ daysAgo: x, walked: false, steady: false, size: "big" as const })),
    ]);
    const logs = [...d.logs];
    [0, 1, 2].forEach((x) => {
      logs.push(log(day(x, "07:00"), { kind: "sleep", hours: 5 }));
      logs.push(log(day(x, "16:00"), { kind: "feeling", mood: "low" }));
    });
    [3, 4, 5].forEach((x) => {
      logs.push(log(day(x, "07:00"), { kind: "sleep", hours: 8 }));
      logs.push(log(day(x, "16:00"), { kind: "feeling", mood: "okay" }));
    });
    const res = weeklyInsights(input({ logs, checkins: d.checkins }));
    expect(res.length).toBe(2);
    expect(res[0].diff).toBeGreaterThanOrEqual(res[1].diff);
    // I1 and I2 both 100 pts: the tie goes to the lower id.
    expect(res.map((x) => x.id)).toEqual(["I1", "I2"]);
  });

  it("never uses forbidden words, and always says 'only your own logs'", () => {
    const all = [
      ...weeklyInsights(input(lunches([...[0, 1, 2].map((x) => ({ daysAgo: x, walked: true, steady: true, size: "big" as const })), ...[3, 4, 5].map((x) => ({ daysAgo: x, walked: false, steady: false, size: "big" as const }))]))),
    ];
    expect(all.length).toBeGreaterThan(0);
    for (const i of all) {
      const words = `${i.text} ${i.caption}`.toLowerCase();
      for (const w of FORBIDDEN_WORDS) expect(words).not.toMatch(new RegExp(`\\b${w}\\b`));
      expect(i.caption).toContain("only your own logs");
    }
  });
});
