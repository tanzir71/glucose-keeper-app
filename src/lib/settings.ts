import { useLiveQuery } from "dexie-react-hooks";
import { db, type KeeperDB } from "@/lib/db";
import { DEFAULT_TARGET_RANGE } from "@/lib/clinical/thresholds";
import { ALL_HABIT_IDS } from "@/lib/habits";
import type { GlucoseComfort, LadderStep, Settings } from "@/types/domain";

const KEY = "settings";

export const DEFAULT_SETTINGS: Settings = {
  onboarded: false,
  easyKinds: ["meal", "sleep", "feeling", "water"],
  unit: "mmol/L",
  glucoseComfort: "not-now",
  ladderStep: 1,
  targetRange: { ...DEFAULT_TARGET_RANGE },
  tinyHabits: false,
  habitsEnabled: [...ALL_HABIT_IDS],
  habitSafetyNoteSeen: false,
  invitation: {},
  fasting: {},
  weightTracking: false,
  showWeightNumber: false,
  migratedV2: false,
};

function withDefaults(stored: Partial<Settings> | undefined): Settings {
  return {
    ...DEFAULT_SETTINGS,
    ...(stored ?? {}),
    invitation: { ...(stored?.invitation ?? {}) },
    fasting: { ...(stored?.fasting ?? {}) },
  };
}

export async function getSettings(database: KeeperDB = db): Promise<Settings> {
  const row = await database.kv.get(KEY);
  return withDefaults(row?.value as Partial<Settings> | undefined);
}

export type SettingsPatch = Partial<Settings> | ((current: Settings) => Partial<Settings>);

/** Shallow-merge a patch into settings. Nested objects (fasting, invitation…) must be passed whole. */
export async function updateSettings(patch: SettingsPatch, database: KeeperDB = db): Promise<Settings> {
  return database.transaction("rw", database.kv, async () => {
    const current = await getSettings(database);
    const p = typeof patch === "function" ? patch(current) : patch;
    const next = { ...current, ...p };
    await database.kv.put({ key: KEY, value: next });
    return next;
  });
}

/** Live settings. `undefined` while loading. */
export function useSettings(): Settings | undefined {
  return useLiveQuery(() => getSettings(), []);
}

/** The ladder step that goes with a glucose comfort choice (4 Seal · 5 Ranges · 6 Numbers). */
export function ladderStepFor(comfort: GlucoseComfort, current: LadderStep): LadderStep {
  if (comfort === "sealed") return 4;
  if (comfort === "ranges") return 5;
  if (comfort === "numbers") return 6;
  // Stepping back down from the glucose steps returns to Learn (3); otherwise keep Notice/Feel/Learn.
  return (current > 3 ? 3 : current) as LadderStep;
}

/** Raise the ladder to at least `step` (used for Feel = first check-in, Learn = first card). */
export async function reachLadderStep(step: LadderStep, database: KeeperDB = db): Promise<void> {
  await updateSettings((s) => (s.ladderStep < step ? { ladderStep: step } : {}), database);
}

export const showsGlucose = (s: Pick<Settings, "glucoseComfort">): boolean =>
  s.glucoseComfort === "ranges" || s.glucoseComfort === "numbers";
