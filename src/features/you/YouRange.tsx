import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BackHeader, FlowScreen } from "@/components/keeper/Layout";
import { DEFAULT_TARGET_RANGE, formatGlucose, parseTypedGlucose } from "@/lib/clinical/thresholds";
import { updateSettings, useSettings } from "@/lib/settings";
import { t } from "@/copy/en";

/** "Set with your care team": the only place the target range can change. */
export default function YouRange() {
  const settings = useSettings();
  const navigate = useNavigate();
  const [low, setLow] = useState<string>();
  const [high, setHigh] = useState<string>();
  useEffect(() => {
    if (!settings || low !== undefined) return;
    setLow(formatGlucose(settings.targetRange.lowMgdl, settings.unit));
    setHigh(formatGlucose(settings.targetRange.highMgdl, settings.unit));
  }, [settings, low]);
  if (!settings || low === undefined || high === undefined) return <FlowScreen>{null}</FlowScreen>;

  const l = parseTypedGlucose(low, settings.unit);
  const h = parseTypedGlucose(high, settings.unit);
  const valid = l != null && h != null && l < h;

  const save = async () => {
    if (!valid) return;
    await updateSettings({ targetRange: { lowMgdl: l!, highMgdl: h! } });
    navigate("/you");
  };

  return (
    <FlowScreen
      footer={
        <>
          <Button size="lg" onClick={save} disabled={!valid}>
            {t.you.rangeSave}
          </Button>
          <Button
            size="lg"
            variant="ghost"
            onClick={() => {
              setLow(formatGlucose(DEFAULT_TARGET_RANGE.lowMgdl, settings.unit));
              setHigh(formatGlucose(DEFAULT_TARGET_RANGE.highMgdl, settings.unit));
            }}
          >
            {formatGlucose(DEFAULT_TARGET_RANGE.lowMgdl, settings.unit)}–{formatGlucose(DEFAULT_TARGET_RANGE.highMgdl, settings.unit)} {settings.unit}
          </Button>
        </>
      }
    >
      <BackHeader label={t.tabs.you} to="/you" />
      <h1 className="t-title">{t.you.rangeEdit}</h1>
      <p className="t-body-l mt-2 text-muted-foreground">{t.learn.cards["your-range"].body}</p>
      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="t-label text-muted-foreground">
            {t.you.rangeLow} ({settings.unit})
          </span>
          <Input inputMode="decimal" value={low} onChange={(e) => setLow(e.target.value)} className="mt-2 h-12 rounded-full bg-card" />
        </label>
        <label className="block">
          <span className="t-label text-muted-foreground">
            {t.you.rangeHigh} ({settings.unit})
          </span>
          <Input inputMode="decimal" value={high} onChange={(e) => setHigh(e.target.value)} className="mt-2 h-12 rounded-full bg-card" />
        </label>
        {!valid && <p className="t-body text-muted-foreground">{t.you.rangeInvalid}</p>}
      </div>
    </FlowScreen>
  );
}
