import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db, newId } from "@/lib/db";
import { WEIGHT_MIN_DAYS_BETWEEN } from "@/lib/clinical/thresholds";
import { minutesBetween } from "@/lib/rules/time";
import { updateSettings } from "@/lib/settings";
import { t } from "@/copy/en";
import type { Settings, WeightEntry } from "@/types/domain";

/** M4.7 Weekly weight: a trend line only; the number stays hidden unless chosen. */
export function WeightCard({ settings }: { settings: Settings }) {
  const weights = useLiveQuery(() => db.weights.orderBy("at").toArray(), []);
  const [kg, setKg] = useState("");
  const [confirmReplace, setConfirmReplace] = useState(false);
  if (!weights) return null;

  const last = weights[weights.length - 1];
  const tooSoon = !!last && minutesBetween(last.at, new Date()) < WEIGHT_MIN_DAYS_BETWEEN * 24 * 60;
  const value = Number(kg.replace(",", "."));
  const valid = Number.isFinite(value) && value >= 25 && value <= 350;

  const save = async () => {
    if (!valid) return;
    const entry: WeightEntry = { id: newId(), at: new Date().toISOString(), kg: Math.round(value * 10) / 10 };
    if (tooSoon && last) await db.weights.delete(last.id);
    await db.weights.add(entry);
    setKg("");
    setConfirmReplace(false);
  };

  const recent = weights.slice(-8);
  const trend = recent.length >= 2 ? recent[recent.length - 1].kg - recent[0].kg : 0;
  const trendLabel = recent.length < 2 ? null : trend < -0.3 ? t.weight.trendDown : trend > 0.3 ? t.weight.trendUp : t.weight.trendFlat;

  return (
    <section className="rounded-card bg-card p-4" aria-labelledby="weight-title">
      <div className="flex items-center justify-between">
        <h2 id="weight-title" className="t-body-strong">
          {t.weight.title}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="-mr-3"
          aria-pressed={settings.showWeightNumber}
          onClick={() => updateSettings({ showWeightNumber: !settings.showWeightNumber })}
        >
          {settings.showWeightNumber ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
          {settings.showWeightNumber ? t.weight.hidden : t.weight.showNumber}
        </Button>
      </div>
      {recent.length >= 2 && <TrendLine values={recent.map((w) => w.kg)} />}
      <p className="t-caption mt-1 text-muted-foreground">
        {trendLabel}
        {settings.showWeightNumber && last ? ` · ${last.kg} kg` : !settings.showWeightNumber && last ? ` · ${t.weight.hidden}` : ""}
      </p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (tooSoon && !confirmReplace) return setConfirmReplace(true);
          void save();
        }}
      >
        <Input
          inputMode="decimal"
          aria-label={t.weight.kg}
          placeholder={t.weight.kg}
          value={kg}
          onChange={(e) => setKg(e.target.value)}
          className={`h-11 rounded-full bg-background ${settings.showWeightNumber ? "" : "masked-input"}`}
        />
        <Button type="submit" variant="outline" disabled={!valid}>
          {confirmReplace ? t.weight.replaceYes : t.weight.save}
        </Button>
      </form>
      {confirmReplace && <p className="t-caption mt-2 text-muted-foreground">{t.weight.replace}</p>}
    </section>
  );
}

function TrendLine({ values }: { values: number[] }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 280 + 10},${50 - ((v - min) / span) * 40}`).join(" ");
  return (
    <svg viewBox="0 0 300 60" className="mt-2 h-16 w-full" aria-hidden>
      <polyline points={pts} fill="none" className="stroke-sleep" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
