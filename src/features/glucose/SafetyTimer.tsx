import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FlowScreen } from "@/components/keeper/Layout";
import { Ring } from "@/components/keeper/Visuals";
import { LOW_RECHECK_MINUTES } from "@/lib/clinical/thresholds";
import { useNow } from "@/lib/data";
import { t } from "@/copy/en";

const KEY = "keeper.lowTimer";

/** The 15-minute recheck timer after a low reading. Kept correct across backgrounding. */
export default function SafetyTimer() {
  const navigate = useNavigate();
  const now = useNow(1000);
  const [startedAt, setStartedAt] = useState<number>();

  useEffect(() => {
    let s: number | undefined;
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw && Date.now() - Number(raw) < 2 * 3_600_000) s = Number(raw);
    } catch {
      /* ignore */
    }
    s ??= Date.now();
    try {
      sessionStorage.setItem(KEY, String(s));
    } catch {
      /* ignore */
    }
    setStartedAt(s);
  }, []);

  const total = LOW_RECHECK_MINUTES * 60;
  const elapsed = startedAt ? Math.max(0, (now.getTime() - startedAt) / 1000) : 0;
  const left = Math.max(0, total - elapsed);
  const done = left <= 0;
  const minutesLeft = Math.ceil(left / 60);
  const announce = useMemo(() => (done ? t.safety.timerDone : `${minutesLeft} min`), [done, minutesLeft]);

  const clear = () => {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  };

  return (
    <FlowScreen
      tone="safety"
      footer={
        <>
          <Button
            size="lg"
            variant="safety"
            onClick={() => {
              clear();
              navigate("/glucose/check", { replace: true });
            }}
          >
            {t.safety.checkAgain}
          </Button>
          <Button
            size="lg"
            variant="safetyGhost"
            onClick={() => {
              clear();
              navigate("/", { replace: true });
            }}
          >
            {t.safety.timerStop}
          </Button>
        </>
      }
    >
      <h1 className="t-title mt-10">{done ? t.safety.timerDone : t.safety.timerTitle}</h1>
      <p className="t-body-l mt-2 text-safety-foreground/90">{t.safety.timerBody}</p>
      <div className="my-10">
        <Ring progress={elapsed / total} size={240} stroke={16} trackClass="stroke-safety-foreground/20" progressClass="stroke-safety-foreground">
          <span className="t-number" aria-hidden>
            {Math.floor(left / 60)}:{String(Math.floor(left % 60)).padStart(2, "0")}
          </span>
        </Ring>
        <p className="sr-only" aria-live="polite">
          {announce}
        </p>
      </div>
    </FlowScreen>
  );
}
