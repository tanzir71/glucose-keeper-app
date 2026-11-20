import { db, type KeeperDB } from "@/lib/db";
import { classifyReading } from "@/lib/clinical/thresholds";
import { getSettings, updateSettings } from "@/lib/settings";
import type { GlucoseReading, GlucoseUnit } from "@/types/domain";

const READINGS_KEY = "glucose_readings";
const UNIT_KEY = "glucose_unit";

type V1Reading = { id: string; value: number; timestamp: string; note?: string };

function isV1Reading(r: unknown): r is V1Reading {
  if (!r || typeof r !== "object") return false;
  const o = r as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    o.id.length > 0 &&
    typeof o.value === "number" &&
    Number.isFinite(o.value) &&
    o.value > 0 &&
    typeof o.timestamp === "string" &&
    !Number.isNaN(new Date(o.timestamp).getTime())
  );
}

export interface MigrationResult {
  migrated: number;
  skipped: number;
  ran: boolean;
}

/**
 * Move v1 localStorage readings into Dexie.
 * - Each reading keeps its v1 id, so running twice creates no duplicates.
 * - Legacy readings are "opened": they already tracked numbers, so their history isn't hidden.
 * - The localStorage keys are left in place until v2.1.
 */
export async function migrateV1(storage: Storage = localStorage, database: KeeperDB = db): Promise<MigrationResult> {
  const settings = await getSettings(database);
  if (settings.migratedV2) return { migrated: 0, skipped: 0, ran: false };

  let parsed: unknown = [];
  const raw = storage.getItem(READINGS_KEY);
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.warn("[keeper] v1 readings were not valid JSON; skipping them.", e);
      parsed = [];
    }
  }

  const list = Array.isArray(parsed) ? parsed : [];
  const good: V1Reading[] = [];
  let skipped = 0;
  for (const item of list) {
    if (isV1Reading(item)) good.push(item);
    else {
      skipped++;
      console.warn("[keeper] skipping a malformed v1 reading", item);
    }
  }

  const readings: GlucoseReading[] = good.map((r) => ({
    id: r.id,
    at: new Date(r.timestamp).toISOString(),
    valueMgdl: r.value,
    source: "legacy",
    state: "opened",
    safety: classifyReading(r.value).safety,
    note: r.note || undefined,
  }));

  const unit = storage.getItem(UNIT_KEY);
  const validUnit: GlucoseUnit | undefined = unit === "mmol/L" || unit === "mg/dL" ? unit : undefined;

  await database.transaction("rw", database.readings, database.kv, async () => {
    if (readings.length > 0) await database.readings.bulkPut(readings);
    await updateSettings(
      readings.length > 0
        ? { glucoseComfort: "numbers", ladderStep: 6, migratedV2: true, ...(validUnit ? { unit: validUnit } : {}) }
        : { migratedV2: true },
      database,
    );
  });

  return { migrated: readings.length, skipped, ran: true };
}
