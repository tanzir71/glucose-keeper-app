import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FlowScreen } from "@/components/keeper/Layout";
import { updateSettings, useSettings } from "@/lib/settings";
import { t } from "@/copy/en";
import type { Rhythm } from "@/types/domain";
import { RhythmForm, rhythmIsEmpty } from "./RhythmForm";
import { StepDots } from "./StepDots";

const DRAFT_KEY = "keeper.rhythmDraft";

function readDraft(): Rhythm | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Rhythm) : null;
  } catch {
    return null;
  }
}

/** A3 Your rhythm (Figma 13:152). Every field is optional; Back/Skip never lose what's entered. */
export default function YourRhythm() {
  const navigate = useNavigate();
  const settings = useSettings();
  const [rhythm, setRhythm] = useState<Rhythm | null>(null);

  useEffect(() => {
    if (settings && !rhythm) setRhythm(readDraft() ?? settings.rhythm ?? {});
  }, [settings, rhythm]);

  const change = (r: Rhythm) => {
    setRhythm(r);
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(r));
    } catch {
      /* private mode: the draft just isn't kept */
    }
  };

  const finish = async (save: boolean) => {
    const r = rhythm ?? {};
    // Skipping keeps anything already entered; an untouched form leaves rhythm undefined.
    await updateSettings({ onboarded: true, ...(save || !rhythmIsEmpty(r) ? { rhythm: rhythmIsEmpty(r) ? undefined : r } : {}) });
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    navigate("/", { replace: true });
  };

  if (!rhythm) return null;

  return (
    <FlowScreen
      footer={
        <Button size="lg" onClick={() => finish(true)}>
          {t.rhythm.save}
        </Button>
      }
    >
      <div className="flex items-center justify-between">
        <StepDots step={2} />
        <Button variant="ghost" size="sm" className="-mr-3 text-muted-foreground" onClick={() => finish(false)}>
          {t.common.skip}
        </Button>
      </div>
      <h1 className="t-title mt-4">{t.rhythm.title}</h1>
      <p className="t-body-l mb-5 mt-2 text-muted-foreground">{t.rhythm.sub}</p>
      <RhythmForm value={rhythm} onChange={change} />
    </FlowScreen>
  );
}
