import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BackHeader, FlowScreen } from "@/components/keeper/Layout";
import { updateSettings, useSettings } from "@/lib/settings";
import { t } from "@/copy/en";

/** Doctor's-plan track (24 h+): logging only. Keeper never suggests or coaches it. */
export default function DoctorPlan() {
  const settings = useSettings();
  const navigate = useNavigate();
  const [hours, setHours] = useState("");
  const [checks, setChecks] = useState("");
  const [notes, setNotes] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!settings || loaded) return;
    const p = settings.fasting.doctorPlan;
    if (p) {
      setHours(String(p.hours));
      setChecks(p.checks.join("\n"));
      setNotes(p.notes ?? "");
    }
    setLoaded(true);
  }, [settings, loaded]);

  if (!settings) return <FlowScreen>{null}</FlowScreen>;
  if (settings.fasting.excluded) {
    return (
      <FlowScreen>
        <BackHeader label={t.fasting.title} to="/you/fasting" />
        <p className="t-body-l mt-6">{t.fasting.excludedBody}</p>
      </FlowScreen>
    );
  }

  const h = Number(hours);
  const valid = Number.isFinite(h) && h > 0 && h <= 168;
  const save = async () => {
    await updateSettings((s) => ({
      fasting: {
        ...s.fasting,
        track: "doctor-plan",
        doctorPlan: { hours: h, checks: checks.split("\n").map((x) => x.trim()).filter(Boolean), notes: notes.trim() || undefined },
      },
    }));
    navigate("/", { replace: true });
  };

  return (
    <FlowScreen
      footer={
        <Button size="lg" onClick={save} disabled={!valid}>
          {t.fasting.doctorSave}
        </Button>
      }
    >
      <BackHeader label={t.fasting.title} to="/you/fasting" />
      <h1 className="t-title">{t.fasting.doctorTitle}</h1>
      <p className="t-body mt-2 text-muted-foreground">{t.fasting.doctorSub}</p>
      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="t-label text-muted-foreground">{t.fasting.doctorHours}</span>
          <Input inputMode="numeric" value={hours} onChange={(e) => setHours(e.target.value)} className="mt-2 h-11 w-32 rounded-full bg-card" />
        </label>
        <label className="block">
          <span className="t-label text-muted-foreground">{t.fasting.doctorChecks}</span>
          <Textarea value={checks} onChange={(e) => setChecks(e.target.value)} placeholder={t.fasting.doctorChecksPlaceholder} className="mt-2 rounded-2xl bg-card" />
        </label>
        <label className="block">
          <span className="t-label text-muted-foreground">{t.fasting.doctorNotes}</span>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-2 rounded-2xl bg-card" />
        </label>
      </div>
    </FlowScreen>
  );
}
