import { useEffect, useState } from "react";
import { Droplet, Leaf } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/keeper/Chip";
import { Segmented, Toggle } from "@/components/keeper/Controls";
import { FlowScreen } from "@/components/keeper/Layout";
import { TILE_KINDS } from "@/components/keeper/kinds";
import { ladderStepFor, updateSettings, useSettings } from "@/lib/settings";
import { t } from "@/copy/en";
import type { GlucoseComfort, LogKind } from "@/types/domain";
import { StepDots } from "./StepDots";

type GlucoseChoice = "not-now" | "maybe-later" | "ready";

const choiceFrom = (c: GlucoseComfort): GlucoseChoice =>
  c === "sealed" || c === "ranges" || c === "numbers" ? "ready" : c;

/** A2 What feels easy (Figma 13:75). */
export default function WhatFeelsEasy() {
  const navigate = useNavigate();
  const location = useLocation();
  const settings = useSettings();
  const [kinds, setKinds] = useState<LogKind[] | null>(null);
  const [glucose, setGlucose] = useState<GlucoseChoice>("not-now");
  const [habits, setHabits] = useState(false);

  useEffect(() => {
    if (!settings || kinds) return;
    setKinds(settings.easyKinds);
    setGlucose((location.state as { glucoseReady?: boolean } | null)?.glucoseReady ? "ready" : choiceFrom(settings.glucoseComfort));
    setHabits(settings.tinyHabits);
  }, [settings, kinds, location.state]);

  if (!settings || !kinds) return null;

  const toggle = (k: LogKind) => setKinds((ks) => (ks!.includes(k) ? ks!.filter((x) => x !== k) : [...ks!, k]));

  const save = async () => {
    // "I'm ready" means Sealed (step 4), never straight to numbers — unless they already track.
    const current = settings.glucoseComfort;
    const comfort: GlucoseComfort =
      glucose === "ready" ? (current === "sealed" || current === "ranges" || current === "numbers" ? current : "sealed") : glucose;
    await updateSettings({
      easyKinds: kinds.length ? TILE_KINDS.filter((k) => kinds.includes(k)) : ["meal"],
      glucoseComfort: comfort,
      ladderStep: ladderStepFor(comfort, settings.ladderStep),
      tinyHabits: habits,
    });
    navigate("/onboarding/rhythm");
  };

  return (
    <FlowScreen
      footer={
        <Button size="lg" onClick={save}>
          {t.common.continue}
        </Button>
      }
    >
      <div className="flex items-center justify-between">
        <StepDots step={1} />
        <Button variant="ghost" size="sm" className="-mr-3 text-muted-foreground" onClick={() => navigate("/onboarding/rhythm")}>
          {t.common.skip}
        </Button>
      </div>
      <h1 className="t-title mt-4">{t.easy.title}</h1>
      <p className="t-body-l mt-2 text-muted-foreground">{t.easy.sub}</p>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label={t.easy.title}>
        {TILE_KINDS.map((k) => (
          <Chip key={k} selected={kinds.includes(k)} onClick={() => toggle(k)}>
            {t.kindChips[k]}
          </Chip>
        ))}
      </div>

      <section className="mt-6 rounded-card bg-card p-4">
        <div className="flex gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-sleep-soft">
            <Droplet aria-hidden className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <h2 className="t-body-strong">{t.easy.glucoseTitle}</h2>
            <p className="t-caption text-muted-foreground">{t.easy.glucoseBody}</p>
          </div>
        </div>
        <Segmented
          className="mt-4"
          label={t.easy.glucoseTitle}
          value={glucose}
          onChange={setGlucose}
          options={[
            { value: "not-now", label: t.easy.glucoseOptions["not-now"] },
            { value: "maybe-later", label: t.easy.glucoseOptions["maybe-later"] },
            { value: "ready", label: t.easy.glucoseOptions.ready },
          ]}
        />
      </section>

      <section className="mt-4 flex items-center gap-3 rounded-card bg-card p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-move-soft">
          <Leaf aria-hidden className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <div className="flex-1">
          <h2 className="t-body-strong">{t.easy.habitsTitle}</h2>
          <p className="t-caption text-muted-foreground">{t.easy.habitsBody}</p>
        </div>
        <Toggle checked={habits} onCheckedChange={setHabits} label={t.easy.habitsTitle} />
      </section>
    </FlowScreen>
  );
}
