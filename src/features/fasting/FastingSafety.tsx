import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Segmented } from "@/components/keeper/Controls";
import { BackHeader, FlowScreen } from "@/components/keeper/Layout";
import { canStart } from "@/lib/rules/fasting";
import { updateSettings, useSettings } from "@/lib/settings";
import { t } from "@/copy/en";
import type { FastTrack, YesNoNotSure } from "@/types/domain";

const OPTIONS = [
  { value: "yes" as const, label: t.common.yes },
  { value: "no" as const, label: t.common.no },
  { value: "not-sure" as const, label: t.common.notSure },
];

/** C2 Fasting safety check (Figma 21:580). Answers stay on the phone. [CLINICAL-REVIEW] */
export default function FastingSafety() {
  const settings = useSettings();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const track = (params.get("track") as FastTrack) || "window-13";
  const start = params.get("start") || undefined;
  const [q1, setQ1] = useState<YesNoNotSure>();
  const [q2, setQ2] = useState<YesNoNotSure>();
  const [confirmed, setConfirmed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!settings || loaded) return;
    setQ1(settings.fasting.medsLowRisk);
    setQ2(settings.fasting.medsSglt2);
    setConfirmed(!!settings.fasting.careTeamConfirmed);
    setLoaded(true);
  }, [settings, loaded]);

  if (!settings || !loaded) return <FlowScreen>{null}</FlowScreen>;

  const answers = { ...settings.fasting, medsLowRisk: q1, medsSglt2: q2, careTeamConfirmed: confirmed };
  const risky1 = !!q1 && q1 !== "no";
  const risky2 = !!q2 && q2 !== "no";
  const gate = canStart(track, answers);
  // Ramadan with a "-gliflozin" yes/not sure also waits for the care-team checkbox.
  const ramadanNeedsConfirm = track === "ramadan" && (risky1 || risky2) && !confirmed;
  const ok = !!q1 && !!q2 && gate.ok && !ramadanNeedsConfirm;

  const go = async (chosen: FastTrack) => {
    await updateSettings({ fasting: { ...answers, track: chosen, windowStart: chosen === track ? start : undefined } });
    navigate(chosen === "ramadan" && !settings.fasting.ramadan?.startDate ? "/you/fasting/ramadan" : "/", { replace: true });
  };

  return (
    <FlowScreen
      footer={
        <>
          {ok ? (
            <Button size="lg" onClick={() => go(track)}>
              {track === "ramadan" ? t.ramadan.setup : t.fasting.startTrack(t.fasting.trackNames[track])}
            </Button>
          ) : (
            <Button size="lg" onClick={() => go("overnight-12")} disabled={!q1 || !q2}>
              {t.fasting.stay12}
            </Button>
          )}
          <Button asChild size="lg" variant="ghost">
            <Link to="/you/export">{t.fasting.shareDoctor}</Link>
          </Button>
        </>
      }
    >
      <BackHeader label={t.fasting.title} to="/you/fasting" />
      <h1 className="t-title">{t.fasting.safetyTitle}</h1>
      <p className="t-body mt-2 text-muted-foreground">{t.fasting.safetySub}</p>

      <section className="mt-5 rounded-card bg-card p-4">
        <h2 className="t-body-strong">{t.fasting.q1}</h2>
        <Segmented className="mt-3" label={t.fasting.q1} value={q1} onChange={setQ1} options={OPTIONS} />
        {risky1 && (
          <p className="t-caption mt-3 flex gap-2 rounded-2xl bg-safety p-3 text-safety-foreground" role="note">
            <ShieldCheck aria-hidden className="h-4 w-4 shrink-0" /> {t.fasting.q1Note}
          </p>
        )}
      </section>

      <section className="mt-3 rounded-card bg-card p-4">
        <h2 className="t-body-strong">{t.fasting.q2}</h2>
        <Segmented className="mt-3" label={t.fasting.q2} value={q2} onChange={setQ2} options={OPTIONS} />
        {risky2 && <p className="t-caption mt-3 rounded-2xl bg-water-soft p-3 text-foreground">{t.fasting.q2Note}</p>}
      </section>

      <label className="mt-3 flex min-h-11 items-center gap-3 rounded-card bg-card p-4">
        <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(v === true)} aria-label={t.fasting.confirm} className="h-6 w-6 rounded-md" />
        <span className="t-body">{t.fasting.confirm}</span>
      </label>
    </FlowScreen>
  );
}
