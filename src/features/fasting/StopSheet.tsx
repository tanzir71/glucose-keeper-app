import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/keeper/Sheet";
import { useActiveFast } from "@/lib/data";
import { endFast } from "@/lib/fastingStore";
import { t } from "@/copy/en";

/**
 * "Break your fast if…" / "End the fast if…" (05 §4.5–4.6), always one tap away during a fast.
 * Rules plus the 15-minute timer and "I'm okay". [CLINICAL-REVIEW]
 */
export default function StopSheet() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const fast = useActiveFast();
  const ramadan = params.get("ramadan") === "1" || fast?.track === "ramadan";
  const reason = params.get("reason");
  const close = () => navigate("/", { replace: true });

  const stopNow = async () => {
    if (fast) await endFast(fast, reason?.startsWith("reading") ? "reading" : "symptom");
    toast(t.fasting.ended);
    close();
  };

  return (
    <Sheet
      onClose={close}
      tone="safety"
      title={ramadan ? t.fasting.breakIfTitle : t.fasting.stopTitle}
      footer={
        <div className="space-y-2">
          {fast && (
            <Button size="lg" variant="destructive" onClick={stopNow}>
              {t.fasting.stopNow}
            </Button>
          )}
          <Button size="lg" variant="outline" onClick={() => navigate("/glucose/timer", { replace: true })}>
            {t.safety.startTimer}
          </Button>
          <Button size="lg" variant="ghost" onClick={close}>
            {t.fasting.stopOkay}
          </Button>
        </div>
      }
    >
      <ul className="space-y-3">
        {t.fasting.stopRules.map((r) => (
          <li key={r} className="t-body-l flex gap-3 rounded-card bg-card p-4">
            <span aria-hidden className="mt-2 h-2 w-2 shrink-0 rounded-full bg-safety" />
            {r}
          </li>
        ))}
      </ul>
      <p className="t-body-strong mt-4">{t.fasting.stopFooter}</p>
    </Sheet>
  );
}
