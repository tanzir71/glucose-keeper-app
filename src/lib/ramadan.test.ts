import { describe, expect, it } from "vitest";
import { CITIES, dayTimes, ramadanPhase } from "./ramadan";

const DHAKA = CITIES[0];
const hm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

describe("Ramadan times (Dhaka, Karachi method)", () => {
  it("fajr and maghrib fall in plausible windows for a March day", () => {
    const t = dayTimes(new Date("2026-03-01T12:00:00"), DHAKA);
    // Dhaka in early March: fajr ≈ 04:5x, maghrib ≈ 18:0x (TZ is Asia/Dhaka in tests).
    expect(hm(t.suhoorEnds) >= "04:30" && hm(t.suhoorEnds) <= "05:15").toBe(true);
    expect(hm(t.iftar) >= "17:50" && hm(t.iftar) <= "18:15").toBe(true);
  });

  it("applies the suhoor offset", () => {
    const a = dayTimes(new Date("2026-03-01T12:00:00"), DHAKA, "Karachi", 0);
    const b = dayTimes(new Date("2026-03-01T12:00:00"), DHAKA, "Karachi", 10);
    expect((a.suhoorEnds.getTime() - b.suhoorEnds.getTime()) / 60000).toBe(10);
  });
});

describe("ramadanPhase", () => {
  const r = { startDate: "2026-02-18", days: 30 as const, method: "Karachi" as const, suhoorOffsetMin: 0 };
  it("before the confirmed start", () => {
    expect(ramadanPhase(new Date("2026-02-10T12:00:00"), r, DHAKA)).toEqual({ phase: "before", daysUntil: 8 });
  });
  it("fasting during the day, with the day number", () => {
    const p = ramadanPhase(new Date("2026-03-01T12:00:00"), r, DHAKA);
    expect(p?.phase).toBe("fasting");
    if (p?.phase === "fasting") expect(p.day).toBe(12);
  });
  it("eating window after iftar, until the next suhoor", () => {
    const p = ramadanPhase(new Date("2026-03-01T20:00:00"), r, DHAKA);
    expect(p?.phase).toBe("window");
    if (p?.phase === "window") expect(p.nextSuhoorEnds.getDate()).toBe(2);
  });
  it("after the last day's iftar it's over", () => {
    expect(ramadanPhase(new Date("2026-03-19T20:00:00"), r, DHAKA)?.phase).toBe("after");
  });
  it("no start date → null (never predicted)", () => {
    expect(ramadanPhase(new Date(), { method: "Karachi", suhoorOffsetMin: 0 }, DHAKA)).toBeNull();
  });
});
