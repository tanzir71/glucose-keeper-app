import Dexie, { type Table } from "dexie";
import type {
  CheckIn,
  FastSession,
  GlucoseReading,
  LogEntry,
  NudgeEvent,
  Photo,
  WeightEntry,
} from "@/types/domain";

// Local-first: everything lives on the device in IndexedDB. No sync, no backend.
export type KeeperDB = Dexie & {
  logs: Table<LogEntry, string>;
  checkins: Table<CheckIn, string>;
  readings: Table<GlucoseReading, string>;
  photos: Table<Photo, string>;
  nudges: Table<NudgeEvent, string>;
  fasts: Table<FastSession, string>;
  weights: Table<WeightEntry, string>;
  kv: Table<{ key: string; value: unknown }, string>;
};

export function createDb(name = "keeper"): KeeperDB {
  const d = new Dexie(name) as KeeperDB;
  d.version(1).stores({
    logs: "id, kind, at",
    checkins: "id, mealId, at",
    readings: "id, at, state",
    photos: "id, kind",
    nudges: "id, at, habitId, outcome",
    fasts: "id, startedAt, track",
    weights: "id, at",
    kv: "key",
  });
  return d;
}

export const db = createDb();

export const newId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** Delete everything Keeper stores on this device, including the v1 localStorage keys. */
export async function deleteAllData(database: KeeperDB = db, storage: Storage = localStorage): Promise<void> {
  await database.transaction(
    "rw",
    [database.logs, database.checkins, database.readings, database.photos, database.nudges, database.fasts, database.weights, database.kv],
    async () => {
      await Promise.all([
        database.logs.clear(),
        database.checkins.clear(),
        database.readings.clear(),
        database.photos.clear(),
        database.nudges.clear(),
        database.fasts.clear(),
        database.weights.clear(),
        database.kv.clear(),
      ]);
    },
  );
  storage.removeItem("glucose_readings");
  storage.removeItem("glucose_unit");
}
