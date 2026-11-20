import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SafetyScreen } from "@/components/keeper/SafetyScreen";
import { useActiveFast } from "@/lib/data";
import { endFast } from "@/lib/fastingStore";
import { formatGlucose } from "@/lib/clinical/thresholds";
import { emergencyNumber } from "@/lib/readings";
import { useSettings } from "@/lib/settings";
import { t } from "@/copy/en";
import { useReading } from "./useReading";

/**
 * D6 Safety · low reading (Figma 16:716), the High variant (undesigned, same layout) and the
 * "Let's make sure you're okay" screen after an unread envelope + symptoms. [CLINICAL-REVIEW] copy.
 */
export default function Safety() {
  const { id } = useParams();
  const navigate = useNavigate();
  const settings = useSettings();
  const activeFast = useActiveFast();
  const unwell = id === "unwell";
  const view = useReading(unwell ? undefined : id);
  const [showNumber, setShowNumber] = useState(false);

  if (!settings || activeFast === undefined || (!unwell && view === undefined)) return <div className="min-h-dvh bg-safety" />;
  if (!unwell && view === null) return <Navigate to="/" replace />;

  const emergency = emergencyNumber(settings);
  const reading = view?.reading;
  const variant = unwell ? "unwell" : reading?.safety === "low" ? "low" : reading?.safety === "very-high" ? "high" : null;
  if (!variant) return <Navigate to={`/glucose/reading/${id}`} replace />;

  const fast = activeFast && !activeFast.endedAt ? activeFast : null;
  const stopFast = async () => {
    if (fast) await endFast(fast, variant === "unwell" ? "symptom" : "reading");
  };

  const copy =
    variant === "low"
      ? { title: t.safety.lowTitle, steps: t.safety.lowSteps, note: t.safety.lowNote(emergency) }
      : variant === "high"
        ? { title: t.safety.highTitle, steps: t.safety.highSteps, note: t.safety.highNote(emergency) }
        : { title: t.safety.unwellTitle, steps: t.safety.unwellSteps, note: t.safety.unwellNote(emergency) };

  return (
    <SafetyScreen
      overline={variant === "unwell" ? undefined : t.safety.overline}
      title={copy.title}
      steps={copy.steps}
      note={copy.note}
      extra={
        <>
          {fast && (
            <div className="mt-5 rounded-card bg-safety-foreground/[0.12] p-4">
              <p className="t-body-strong">{t.safety.duringFast}</p>
              <Button variant="safety" className="mt-3" onClick={stopFast}>
                {t.safety.endFast}
              </Button>
            </div>
          )}
          {reading?.valueMgdl != null && (
            <div className="mt-4">
              {showNumber ? (
                <p className="flex items-baseline gap-2" aria-live="polite">
                  <span className="t-number">{formatGlucose(reading.valueMgdl, settings.unit)}</span>
                  <span className="t-body">{settings.unit}</span>
                </p>
              ) : (
                <Button variant="safetyGhost" className="-ml-3" onClick={() => setShowNumber(true)}>
                  {t.safety.showNumber}
                </Button>
              )}
            </div>
          )}
        </>
      }
      actions={
        <>
          {variant === "low" && (
            <Button size="lg" variant="safety" onClick={() => navigate("/glucose/timer")}>
              {t.safety.startTimer}
            </Button>
          )}
          {variant === "unwell" && (
            <Button size="lg" variant="safety" onClick={() => navigate("/glucose/check", { replace: true })}>
              {t.safety.checkNow}
            </Button>
          )}
          <Button size="lg" variant={variant === "high" ? "safety" : "safetyGhost"} onClick={() => navigate("/log/feeling", { replace: true })}>
            {t.safety.okay}
          </Button>
        </>
      }
    />
  );
}
