import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BackHeader, FlowScreen } from "@/components/keeper/Layout";
import { RhythmForm } from "@/features/onboarding/RhythmForm";
import { rhythmIsEmpty } from "@/features/onboarding/rhythm";
import { updateSettings, useSettings } from "@/lib/settings";
import { t } from "@/copy/en";
import type { Rhythm } from "@/types/domain";

/** You → Your rhythm: the A3 form plus work days, work hours and indoor preference. */
export default function YouRhythm() {
  const settings = useSettings();
  const navigate = useNavigate();
  const [rhythm, setRhythm] = useState<Rhythm | null>(null);
  useEffect(() => {
    if (settings && !rhythm) setRhythm(settings.rhythm ?? {});
  }, [settings, rhythm]);
  if (!rhythm) return <FlowScreen>{null}</FlowScreen>;

  const save = async () => {
    await updateSettings({ rhythm: rhythmIsEmpty(rhythm) && !rhythm.indoorPreferred && !rhythm.workDays ? undefined : rhythm });
    navigate("/you");
  };

  return (
    <FlowScreen
      footer={
        <Button size="lg" onClick={save}>
          {t.rhythm.save}
        </Button>
      }
    >
      <BackHeader label={t.tabs.you} to="/you" />
      <h1 className="t-title">{t.rhythm.title}</h1>
      <p className="t-body-l mb-5 mt-2 text-muted-foreground">{t.rhythm.sub}</p>
      <RhythmForm value={rhythm} onChange={setRhythm} extended />
    </FlowScreen>
  );
}
