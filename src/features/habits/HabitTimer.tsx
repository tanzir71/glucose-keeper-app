import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CloseHeader, FlowScreen } from "@/components/keeper/Layout";
import { Ring } from "@/components/keeper/Visuals";
import { HABITS, isHabitId } from "@/lib/habits";
import { addLog, recordNudge, useNow } from "@/lib/data";
import { t } from "@/copy/en";
import type { HabitId } from "@/types/domain";

interface Run {
  habitId: HabitId;
  startedAt: string;
  count: number;
}
const runKey = (h: string) => `keeper.habitRun.${h}`;

function loadRun(habitId: HabitId): Run {
  try {
    const raw = sessionStorage.getItem(runKey(habitId));
    if (raw) {
      const r = JSON.parse(raw) as Run;
      // A run older than 2 hours is stale.
      if (Date.now() - new Date(r.startedAt).getTime() < 2 * 3_600_000) return r;
    }
  } catch {
    /* ignore */
  }
  return { habitId, startedAt: new Date().toISOString(), count: 0 };
}
const saveRun = (r: Run) => {
  try {
    sessionStorage.setItem(runKey(r.habitId), JSON.stringify(r));
  } catch {
    /* ignore */
  }
};
const clearRun = (h: string) => {
  try {
    sessionStorage.removeItem(runKey(h));
  } catch {
    /* ignore */
  }
};

const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

/**
 * B4 Tiny habit timer (Figma 14:370). Elapsed time is computed from a stored startedAt, so it
 * stays correct across backgrounding. Ending early still counts.
 */
export default function HabitTimer() {
  const { habitId: raw } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const now = useNow(1000);
  const habitId = isHabitId(raw) ? raw : undefined;
  const [run, setRun] = useState<Run | null>(null);

  useEffect(() => {
    if (!habitId) return;
    const r = loadRun(habitId);
    saveRun(r);
    setRun(r);
  }, [habitId]);

  const def = habitId ? HABITS[habitId] : undefined;
  const reps = Number(params.get("reps")) || undefined;
  const isCount = !!reps || def?.kind === "count";
  const minutes = Number(params.get("min")) || (isCount ? 0 : 2);
  const totalReps = reps ?? 10;
  const mealId = params.get("meal") || undefined;
  const place = (params.get("place") as "desk" | "home") || "home";

  const elapsedSec = run ? Math.max(0, (now.getTime() - new Date(run.startedAt).getTime()) / 1000) : 0;
  const totalSec = minutes * 60;
  const elapsedMin = Math.floor(elapsedSec / 60);
  const announce = useMemo(() => (elapsedMin > 0 ? t.habitTimer.elapsedAnnounce(elapsedMin) : ""), [elapsedMin]);

  if (!habitId || !def || def.kind === "tip" || !run) return <FlowScreen>{null}</FlowScreen>;

  const copy = t.habits[habitId];
  const title = isCount ? t.habitTimer.titleCount(totalReps, copy.short) : t.habitTimer.titleTimer(minutes, copy.short);
  const doneEnough = isCount ? run.count >= totalReps : elapsedSec >= totalSec;

  const finish = async (endedEarly: boolean) => {
    const mins = Math.max(1, Math.round(elapsedSec / 60));
    await addLog({
      kind: "move",
      type: def.moveType ?? "other",
      habitId,
      ...(isCount ? { reps: run.count || undefined, minutes: mins } : { minutes: endedEarly ? mins : minutes }),
      endedEarly: endedEarly || undefined,
    });
    await recordNudge({ habitId, mealId, place, outcome: endedEarly ? "ended-early" : "completed", reason: "" });
    clearRun(habitId);
    toast(t.habitTimer.finished);
    navigate("/", { replace: true });
  };

  const tap = () => {
    const next = { ...run, count: run.count + 1 };
    saveRun(next);
    setRun(next);
  };

  return (
    <FlowScreen
      footer={
        <>
          <Button size="lg" onClick={() => finish(!doneEnough)}>
            {t.habitTimer.done}
          </Button>
          {!doneEnough && (
            <Button size="lg" variant="ghost" onClick={() => finish(true)}>
              {t.habitTimer.endEarly}
            </Button>
          )}
        </>
      }
    >
      <CloseHeader
        overline={t.habitTimer.overline}
        onClose={() => {
          clearRun(habitId);
          navigate("/", { replace: true });
        }}
      />
      <h1 className="t-title">{title}</h1>
      <p className="t-body mt-2 text-muted-foreground">
        {isCount ? t.habitTimer.subCount : def.moveType === "walk" || def.moveType === "stairs" ? t.habitTimer.sub : copy.how}
      </p>

      <div className="my-8">
        {isCount ? (
          <div className="flex flex-col items-center gap-4">
            <p className="t-number text-[4.5rem] leading-none" aria-live="polite">
              {run.count}
            </p>
            <p className="t-caption text-muted-foreground">{t.habitTimer.of(String(totalReps))}</p>
            <button
              type="button"
              onClick={tap}
              className="t-body-strong h-32 w-32 rounded-full bg-move-soft text-foreground transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:active:scale-100"
            >
              {t.habitTimer.tap}
            </button>
          </div>
        ) : (
          <Ring progress={totalSec ? elapsedSec / totalSec : 0} size={240} stroke={16} trackClass="stroke-move-soft" progressClass="stroke-primary">
            <span className="t-number" aria-hidden>
              {mmss(Math.min(elapsedSec, totalSec))}
            </span>
            <span className="t-caption text-muted-foreground" aria-hidden>
              {t.habitTimer.of(mmss(totalSec))}
            </span>
          </Ring>
        )}
        {/* Announce once a minute, not every second. */}
        <p className="sr-only" aria-live="polite">
          {announce}
        </p>
      </div>

      <section className="rounded-card bg-card p-4">
        <h2 className="t-label text-muted-foreground">{t.habitTimer.why}</h2>
        <p className="t-body mt-2">{copy.why}</p>
        <p className="t-caption mt-2 text-muted-foreground">
          {def.evidence} · {def.source}
        </p>
      </section>
    </FlowScreen>
  );
}
