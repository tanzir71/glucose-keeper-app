import { describe, expect, it } from "vitest";
import { decideReading, emergencyNumber, inferContext } from "./readings";
import { DEFAULT_TARGET_RANGE } from "@/lib/clinical/thresholds";
import type { GlucoseComfort, LogEntry } from "@/types/domain";

const R = DEFAULT_TARGET_RANGE;
const COMFORTS: GlucoseComfort[] = ["not-now", "maybe-later", "sealed", "ranges", "numbers"];

describe("decideReading: safety beats gentleness", () => {
  it.each(COMFORTS)("a low reading is never sealed (comfort %s)", (c) => {
    expect(decideReading(69, c, R)).toEqual({ state: "opened", safety: "low", route: "low" });
  });

  it.each(COMFORTS)("a very high reading is never sealed (comfort %s)", (c) => {
    expect(decideReading(251, c, R)).toEqual({ state: "opened", safety: "very-high", route: "high" });
  });

  it("boundaries: 70 and 250 follow comfort", () => {
    expect(decideReading(70, "sealed", R)).toEqual({ state: "sealed", safety: "none", route: "sealed" });
    expect(decideReading(250, "sealed", R)).toEqual({ state: "sealed", safety: "none", route: "sealed" });
  });

  it("comfort decides the view for safe readings", () => {
    expect(decideReading(140, "sealed", R).route).toBe("sealed");
    expect(decideReading(140, "ranges", R)).toEqual({ state: "opened", safety: "none", route: "ranges" });
    expect(decideReading(140, "numbers", R)).toEqual({ state: "opened", safety: "none", route: "numbers" });
    expect(decideReading(140, "not-now", R).route).toBe("sealed");
  });

  it("an unread reading is sealed with unknown safety", () => {
    expect(decideReading(null, "numbers", R)).toEqual({ state: "sealed", safety: "unknown", route: "sealed" });
  });
});

describe("inferContext", () => {
  const meal = (at: string): LogEntry => ({ id: "m", kind: "meal", at, createdAt: at, data: { kind: "meal", size: "big", slot: "lunch" } });
  it("after a meal within 3 h", () => {
    expect(inferContext(new Date("2026-11-19T15:00:00"), [meal(new Date("2026-11-19T13:15:00").toISOString())])).toEqual({ context: "after-meal", mealId: "m" });
  });
  it("other otherwise", () => {
    expect(inferContext(new Date("2026-11-19T17:00:00"), [meal(new Date("2026-11-19T13:15:00").toISOString())]).context).toBe("other");
  });
  it("fasting during an active fast", () => {
    const now = new Date("2026-11-19T10:00:00");
    expect(
      inferContext(now, [], { id: "f", track: "overnight-12", startedAt: new Date("2026-11-18T21:00:00").toISOString(), plannedEndAt: new Date("2026-11-19T11:00:00").toISOString(), feelings: [], drinks: [] }).context,
    ).toBe("fasting");
  });
});

describe("emergencyNumber", () => {
  it("999 in Bangladesh, a generic line elsewhere", () => {
    expect(emergencyNumber({}, "Asia/Dhaka")).toBe("999");
    expect(emergencyNumber({ rhythm: { city: { name: "Sylhet", lat: 0, lng: 0 } } }, "Europe/London")).toBe("999");
    expect(emergencyNumber({}, "Europe/London")).toBe("your local emergency number");
  });
});
