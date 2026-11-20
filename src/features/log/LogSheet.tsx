import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { addLog, deleteLog, updateLog } from "@/lib/data";
import { useSettings } from "@/lib/settings";
import { t } from "@/copy/en";
import type { FeelingData, LogData, LogEntry, LogKind, MealData, MedicinesData, MoveData, SleepData, WaterData } from "@/types/domain";
import { MealSheet } from "./MealSheet";
import { FeelingSheet, MedicinesSheet, MoveSheet, SleepSheet, WaterSheet } from "./SimpleSheets";

const KINDS: LogKind[] = ["meal", "sleep", "feeling", "move", "water", "medicines"];

export interface SheetProps<D extends LogData> {
  initial?: LogEntry<D>;
  onSave: (data: D, at: Date) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

/** #/log/:kind (sheet over Today). `?edit=<id>` edits an existing entry. */
export default function LogSheet() {
  const { kind } = useParams();
  const [params] = useSearchParams();
  const editId = params.get("edit");
  const navigate = useNavigate();
  const settings = useSettings();
  const [initial, setInitial] = useState<LogEntry | null | undefined>(editId ? undefined : null);

  useEffect(() => {
    if (!editId) return setInitial(null);
    db.logs.get(editId).then((l) => setInitial(l ?? null));
  }, [editId]);

  const close = () => navigate("/", { replace: true });
  if (!kind || !KINDS.includes(kind as LogKind) || !settings || initial === undefined) return null;

  const onSave = async (data: LogData, at: Date) => {
    if (initial) await updateLog(initial.id, data, at);
    else await addLog(data, at);
    toast(t.meal.saved);
    close();
  };
  const onDelete = initial
    ? async () => {
        await deleteLog(initial.id);
        close();
      }
    : undefined;

  // Each sheet narrows `initial` and `onSave` to its own kind.
  const props = { onSave, onDelete, onClose: close, initial: initial ?? undefined } as unknown as SheetProps<never>;
  switch (kind as LogKind) {
    case "meal":
      return <MealSheet {...(props as unknown as SheetProps<MealData>)} settings={settings} />;
    case "sleep":
      return <SleepSheet {...(props as unknown as SheetProps<SleepData>)} />;
    case "feeling":
      return <FeelingSheet {...(props as unknown as SheetProps<FeelingData>)} />;
    case "move":
      return <MoveSheet {...(props as unknown as SheetProps<MoveData>)} />;
    case "water":
      return <WaterSheet {...(props as unknown as SheetProps<WaterData>)} />;
    case "medicines":
      return <MedicinesSheet {...(props as unknown as SheetProps<MedicinesData>)} />;
  }
}
