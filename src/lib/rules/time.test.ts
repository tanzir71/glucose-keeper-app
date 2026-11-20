import { describe, expect, it } from "vitest";
import { inferSlot, isQuietHours, isWithin, isWorkDay, localDay, minutesBetween, partOfDay } from "./time";

const d = (s: string) => new Date(s);

describe("time helpers", () => {
  it.each([
    ["10:00", "09:00", "17:00", true],
    ["17:00", "09:00", "17:00", false],
    ["23:30", "22:30", "07:00", true],
    ["06:59", "22:30", "07:00", true],
    ["07:00", "22:30", "07:00", false],
    ["12:00", "22:30", "07:00", false],
  ] as const)("isWithin(%s, %s, %s) = %s", (t, s, e, expected) => {
    expect(isWithin(t, s, e)).toBe(expected);
  });

  it("minutesBetween", () => {
    expect(minutesBetween(d("2026-11-19T13:15:00"), d("2026-11-19T13:40:00"))).toBe(25);
  });

  it("localDay uses the device zone (Asia/Dhaka in tests)", () => {
    expect(localDay("2026-11-19T19:30:00.000Z")).toBe("2026-11-20"); // 01:30 Dhaka
  });

  it("work days: Sun–Thu in Dhaka, Mon–Fri elsewhere, overridable", () => {
    const fri = d("2026-11-20T10:00:00");
    const sun = d("2026-11-22T10:00:00");
    expect(isWorkDay(fri, undefined, "Asia/Dhaka")).toBe(false);
    expect(isWorkDay(sun, undefined, "Asia/Dhaka")).toBe(true);
    expect(isWorkDay(fri, undefined, "Europe/London")).toBe(true);
    expect(isWorkDay(sun, undefined, "Europe/London")).toBe(false);
    expect(isWorkDay(fri, { workDays: [5] }, "Asia/Dhaka")).toBe(true);
  });

  it("quiet hours run from sleep − 30 min to wake", () => {
    expect(isQuietHours(d("2026-11-19T22:30:00"))).toBe(true);
    expect(isQuietHours(d("2026-11-19T22:29:00"))).toBe(false);
    expect(isQuietHours(d("2026-11-19T06:59:00"))).toBe(true);
    expect(isQuietHours(d("2026-11-19T07:00:00"))).toBe(false);
  });

  it("infers the meal slot from rhythm, then defaults", () => {
    expect(inferSlot(d("2026-11-19T13:15:00"))).toBe("lunch");
    expect(inferSlot(d("2026-11-19T08:00:00"))).toBe("breakfast");
    expect(inferSlot(d("2026-11-19T20:45:00"))).toBe("dinner");
    expect(inferSlot(d("2026-11-19T15:45:00"), { meals: { lunch: "15:00" } })).toBe("lunch");
  });

  it("part of day", () => {
    expect(partOfDay(d("2026-11-19T08:00:00"))).toBe("morning");
    expect(partOfDay(d("2026-11-19T13:00:00"))).toBe("afternoon");
    expect(partOfDay(d("2026-11-19T19:00:00"))).toBe("evening");
  });
});
