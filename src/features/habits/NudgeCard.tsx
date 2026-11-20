import { useEffect, useRef, useState } from "react";
import { Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { WhyThis } from "@/components/keeper/Layout";
import { recordNudge } from "@/lib/data";
import type { Nudge } from "@/lib/rules/smart-timing";
import { updateSettings } from "@/lib/settings";
import { t } from "@/copy/en";
import { HabitSafetyDialog } from "./HabitSafetyDialog";

export function habitPath(n: Pick<Nudge, "habitId" | "durationSec" | "reps" | "mealId" | "place">) {
  const q = new URLSearchParams();
  if (n.durationSec) q.set("min", String(Math.round(n.durationSec / 60)));
  if (n.reps) q.set("reps", String(n.reps));
  if (n.mealId) q.set("meal", n.mealId);
  q.set("place", n.place);
  return `/habit/${n.habitId}?${q.toString()}`;
}

/** B1 smart nudge card: overline, body, "Let's do it" / "Not now", and "Why this?". */
export function NudgeCard({ nudge, safetyNoteSeen }: { nudge: Nudge; safetyNoteSeen: boolean }) {
  const navigate = useNavigate();
  const recorded = useRef<string>();
  const [hidden, setHidden] = useState(false);
  const [safety, setSafety] = useState(false);
  const key = `${nudge.habitId}:${nudge.mealId ?? nudge.expiresAt.toISOString().slice(0, 13)}`;

  // The UI records "shown" on first render; pickNudge itself never writes.
  useEffect(() => {
    if (recorded.current === key) return;
    recorded.current = key;
    setHidden(false);
    const seenKey = `keeper.shown.${key}`;
    try {
      if (sessionStorage.getItem(seenKey)) return;
      sessionStorage.setItem(seenKey, "1");
    } catch {
      /* ignore */
    }
    void recordNudge({ habitId: nudge.habitId, mealId: nudge.mealId, place: nudge.place, outcome: "shown", reason: nudge.reason });
  }, [key, nudge]);

  if (hidden) return null;

  const base = { habitId: nudge.habitId, mealId: nudge.mealId, place: nudge.place, reason: nudge.reason };
  const go = async () => {
    await recordNudge({ ...base, outcome: "accepted" });
    if (nudge.kind === "tip") {
      setHidden(true);
      return;
    }
    navigate(habitPath(nudge));
  };
  const start = () => (safetyNoteSeen ? go() : setSafety(true));
  const skip = async () => {
    setHidden(true);
    await recordNudge({ ...base, outcome: "skipped" });
  };

  const context =
    nudge.kind === "tip"
      ? t.nudge.contextTip
      : !nudge.mealId
        ? t.nudge.contextDeskBreak
        : nudge.place === "desk"
          ? t.nudge.contextDesk
          : t.nudge.contextHome;

  return (
    <section aria-label={t.nudge.overline(context)} className="rounded-card bg-primary-soft p-4">
      <p className="t-overline flex items-center gap-1.5 text-primary-strong">
        <Leaf aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
        {t.nudge.overline(context)}
      </p>
      <p className="t-body-strong mt-2 text-foreground">{nudge.body}</p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={start}>
          {nudge.kind === "tip" ? t.nudge.gotIt : t.nudge.go}
        </Button>
        <Button size="sm" variant="outline" onClick={skip}>
          {t.nudge.notNow}
        </Button>
      </div>
      <WhyThis reason={nudge.reason} className="mt-3" />
      <HabitSafetyDialog
        open={safety}
        onOpenChange={setSafety}
        onAccept={async () => {
          await updateSettings({ habitSafetyNoteSeen: true });
          setSafety(false);
          await go();
        }}
      />
    </section>
  );
}
