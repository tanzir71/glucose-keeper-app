import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDb, type KeeperDB } from "@/lib/db";
import { migrateV1 } from "@/lib/migrate-v1";
import { getSettings, updateSettings } from "@/lib/settings";

class MemoryStorage implements Storage {
  private m = new Map<string, string>();
  get length() {
    return this.m.size;
  }
  clear() {
    this.m.clear();
  }
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  key(i: number) {
    return Array.from(this.m.keys())[i] ?? null;
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
}

const three = [
  { id: "a", value: 110, timestamp: "2026-11-01T08:00:00.000Z", note: "fasting" },
  { id: "b", value: 65, timestamp: "2026-11-01T13:00:00.000Z" },
  { id: "c", value: 260, timestamp: "2026-11-02T20:00:00.000Z" },
];

let database: KeeperDB;
let storage: MemoryStorage;
let n = 0;

beforeEach(() => {
  database = createDb(`migrate-test-${n++}`);
  storage = new MemoryStorage();
});

afterEach(async () => {
  await database.delete();
});

describe("migrateV1", () => {
  it("handles an empty store", async () => {
    const res = await migrateV1(storage, database);
    expect(res).toEqual({ migrated: 0, skipped: 0, ran: true });
    expect(await database.readings.count()).toBe(0);
    const s = await getSettings(database);
    expect(s.migratedV2).toBe(true);
    expect(s.glucoseComfort).toBe("not-now");
    expect(s.ladderStep).toBe(1);
  });

  it("migrates 3 readings as opened legacy readings with safety, and switches to Numbers", async () => {
    storage.setItem("glucose_readings", JSON.stringify(three));
    storage.setItem("glucose_unit", "mg/dL");
    const res = await migrateV1(storage, database);
    expect(res.migrated).toBe(3);

    const all = await database.readings.orderBy("at").toArray();
    expect(all.map((r) => r.id)).toEqual(["a", "b", "c"]);
    expect(all.every((r) => r.source === "legacy" && r.state === "opened")).toBe(true);
    expect(all.map((r) => r.safety)).toEqual(["none", "low", "very-high"]);
    expect(all[0].valueMgdl).toBe(110);
    expect(all[0].note).toBe("fasting");

    const s = await getSettings(database);
    expect(s.glucoseComfort).toBe("numbers");
    expect(s.ladderStep).toBe(6);
    expect(s.unit).toBe("mg/dL");
    expect(s.migratedV2).toBe(true);

    // The v1 keys stay until v2.1.
    expect(storage.getItem("glucose_readings")).not.toBeNull();
  });

  it("skips malformed JSON and logs to the console", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    storage.setItem("glucose_readings", "{not json");
    const res = await migrateV1(storage, database);
    expect(res.migrated).toBe(0);
    expect(warn).toHaveBeenCalled();
    expect((await getSettings(database)).glucoseComfort).toBe("not-now");
    warn.mockRestore();
  });

  it("skips malformed entries but keeps the good ones", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    storage.setItem(
      "glucose_readings",
      JSON.stringify([three[0], { id: "x" }, { id: "y", value: "high", timestamp: "2026-11-01" }, null, three[1]]),
    );
    const res = await migrateV1(storage, database);
    expect(res).toMatchObject({ migrated: 2, skipped: 3 });
    expect(warn).toHaveBeenCalledTimes(3);
    warn.mockRestore();
  });

  it("is idempotent: a second run creates no duplicates", async () => {
    storage.setItem("glucose_readings", JSON.stringify(three));
    await migrateV1(storage, database);
    const second = await migrateV1(storage, database);
    expect(second.ran).toBe(false);
    expect(await database.readings.count()).toBe(3);

    // Even if the flag were lost, reusing the v1 id means no duplicates.
    await updateSettings({ migratedV2: false }, database);
    await migrateV1(storage, database);
    expect(await database.readings.count()).toBe(3);
  });

  it("ignores an unknown unit", async () => {
    storage.setItem("glucose_readings", JSON.stringify(three));
    storage.setItem("glucose_unit", "mmol");
    await migrateV1(storage, database);
    expect((await getSettings(database)).unit).toBe("mmol/L");
  });
});
