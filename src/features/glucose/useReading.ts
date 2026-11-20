import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { contextLabel } from "@/lib/readings";
import type { GlucoseReading, LogEntry, MealData } from "@/types/domain";

export interface ReadingView {
  reading: GlucoseReading;
  n: number;
  context?: string;
  meal?: LogEntry<MealData>;
}

/** A reading with its envelope number, context label and meal. null = not found. */
export function useReading(id: string | undefined): ReadingView | null | undefined {
  return useLiveQuery(async () => {
    if (!id) return null;
    const reading = await db.readings.get(id);
    if (!reading) return null;
    const keys = await db.readings.orderBy("at").primaryKeys();
    const meal = reading.mealId ? ((await db.logs.get(reading.mealId)) as LogEntry<MealData> | undefined) : undefined;
    return { reading, n: keys.indexOf(id) + 1, context: await contextLabel(reading), meal };
  }, [id]);
}
