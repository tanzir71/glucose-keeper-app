import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BackHeader, FlowScreen } from "@/components/keeper/Layout";
import { ladderStepFor, updateSettings, useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { t } from "@/copy/en";
import type { GlucoseComfort } from "@/types/domain";
import { LadderIndicator } from "./LadderIndicator";

type Choice = "sealed" | "ranges" | "numbers" | "not-now";

function OptionIcon({ c }: { c: Choice }) {
  const box = "flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px]";
  if (c === "sealed")
    return (
      <span className={cn(box, "bg-primary-soft")}>
        <Mail aria-hidden className="h-5 w-5 text-primary-strong" />
      </span>
    );
  if (c === "ranges")
    return (
      <span className={cn(box, "gap-1 bg-muted")} aria-hidden>
        <span className="h-2 w-2 rounded-full bg-range-below" />
        <span className="h-2 w-4 rounded-full bg-range-in" />
        <span className="h-2 w-2 rounded-full bg-range-above" />
      </span>
    );
  if (c === "numbers")
    return (
      <span className={cn(box, "bg-muted font-serif text-lg")} aria-hidden>
        6.4
      </span>
    );
  return <span className={cn(box, "bg-muted")} aria-hidden />;
}

/** D2 Glucose comfort (Figma 16:508). Step up or down any time. */
export default function Comfort() {
  const settings = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const fromInvite = (location.state as { from?: string } | null)?.from === "invitation";
  const [choice, setChoice] = useState<Choice>();

  useEffect(() => {
    if (!settings || choice) return;
    const c = settings.glucoseComfort;
    setChoice(c === "sealed" || c === "ranges" || c === "numbers" ? c : "sealed");
  }, [settings, choice]);

  if (!settings || !choice) return <FlowScreen>{null}</FlowScreen>;

  const already = ["sealed", "ranges", "numbers"].includes(settings.glucoseComfort);
  const options: Choice[] = already ? ["sealed", "ranges", "numbers", "not-now"] : ["sealed", "ranges", "numbers"];
  const preview = choice === "not-now" ? ladderStepFor("not-now", settings.ladderStep) : ladderStepFor(choice, settings.ladderStep);

  const save = async (c: GlucoseComfort) => {
    await updateSettings({ glucoseComfort: c, ladderStep: ladderStepFor(c, settings.ladderStep) });
  };
  const cont = async () => {
    await save(choice);
    if (fromInvite && choice !== "not-now") navigate("/glucose/check", { replace: true, state: { first: true } });
    else navigate(-1);
  };
  const later = async () => {
    await save("maybe-later");
    navigate(-1);
  };

  return (
    <FlowScreen
      footer={
        <>
          <Button size="lg" onClick={cont}>
            {t.common.continue}
          </Button>
          {!already && (
            <Button size="lg" variant="ghost" onClick={later}>
              {t.comfort.later}
            </Button>
          )}
        </>
      }
    >
      <BackHeader label={fromInvite ? t.tabs.week : t.tabs.you} />
      <h1 className="t-title">{t.comfort.title}</h1>
      <p className="t-body mt-2 text-muted-foreground">{already ? t.comfort.youSub : t.comfort.sub}</p>

      <div role="radiogroup" aria-label={t.comfort.title} className="mt-5 space-y-3">
        {options.map((c) => {
          const copy = c === "not-now" ? t.comfort.notNowOption : t.comfort.options[c];
          const selected = choice === c;
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setChoice(c)}
              className={cn(
                "flex w-full items-center gap-3 rounded-card bg-card p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected ? "border-[1.5px] border-primary" : "border-[1.5px] border-transparent",
              )}
            >
              <OptionIcon c={c} />
              <span className="flex-1">
                <span className="t-body-strong block">{copy.title}</span>
                <span className="t-caption block text-muted-foreground">{copy.body}</span>
              </span>
              <span
                aria-hidden
                className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2", selected ? "border-primary" : "border-border")}
              >
                {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
              </span>
            </button>
          );
        })}
      </div>

      <LadderIndicator step={preview} className="mt-5" />
    </FlowScreen>
  );
}
