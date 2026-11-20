// v1's DateSelector, StatsCard, GlucoseChart and ReadingsList, restyled for Keeper:
// range tokens only (no red, no traffic lights), words alongside colour, v2 reading model.
import { ChevronLeft, ChevronRight, Mail, Trash2 } from "lucide-react";
import { CartesianGrid, ComposedChart, Line, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { BandDot } from "@/components/keeper/RangeBar";
import { bandLabelKey, classifyReading, formatGlucose, mgdlToMmol, type TargetRange } from "@/lib/clinical/thresholds";
import { fmtTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { t } from "@/copy/en";
import type { GlucoseReading, GlucoseUnit } from "@/types/domain";

export function DaySelector({ date, onChange }: { date: Date; onChange: (d: Date) => void }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 6 + i);
    return d;
  });
  const shift = (n: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    if (d <= today) onChange(d);
  };
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" aria-label={t.numbers.prevDay} onClick={() => shift(-1)}>
        <ChevronLeft aria-hidden />
      </Button>
      <div className="flex flex-1 justify-between gap-1">
        {days.map((d) => {
          const selected = d.toDateString() === date.toDateString();
          return (
            <button
              key={d.toISOString()}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(d)}
              className={cn(
                "flex min-h-14 min-w-[38px] flex-col items-center justify-center rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected ? "bg-primary-soft text-primary-strong" : "text-muted-foreground hover:bg-card",
              )}
            >
              <span className="t-caption">{d.toLocaleDateString(undefined, { weekday: "narrow" })}</span>
              <span className="t-body-strong">{d.getDate()}</span>
            </button>
          );
        })}
      </div>
      <Button variant="ghost" size="icon" aria-label={t.numbers.nextDay} onClick={() => shift(1)} disabled={date >= today}>
        <ChevronRight aria-hidden />
      </Button>
    </div>
  );
}

export function Stats({ readings, unit, range }: { readings: GlucoseReading[]; unit: GlucoseUnit; range: TargetRange }) {
  const values = readings.map((r) => r.valueMgdl!).filter((v) => v != null);
  if (!values.length) return null;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const bands = { below: 0, in: 0, above: 0 };
  for (const v of values) bands[classifyReading(v, range).band]++;
  return (
    <section className="rounded-card bg-card p-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="t-heading">{formatGlucose(avg, unit)}</p>
          <p className="t-caption text-muted-foreground">{t.numbers.stats.average}</p>
        </div>
        <div>
          <p className="t-heading">
            {formatGlucose(Math.min(...values), unit)}–{formatGlucose(Math.max(...values), unit)}
          </p>
          <p className="t-caption text-muted-foreground">{t.numbers.stats.spread}</p>
        </div>
        <div>
          <p className="t-heading">{values.length}</p>
          <p className="t-caption text-muted-foreground">{t.numbers.stats.count}</p>
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-4 border-t border-border pt-3">
        {(["below", "in", "above"] as const).map((b) => (
          <span key={b} className="t-caption inline-flex items-center gap-1.5 text-muted-foreground">
            <BandDot band={b} /> {t.reading.bandNames[b]} · {bands[b]}
          </span>
        ))}
      </div>
    </section>
  );
}

export function DayChart({ readings, unit, range }: { readings: GlucoseReading[]; unit: GlucoseUnit; range: TargetRange }) {
  const conv = (v: number) => (unit === "mmol/L" ? mgdlToMmol(v) : v);
  const data = readings
    .filter((r) => r.valueMgdl != null)
    .map((r) => ({ time: fmtTime(r.at), value: conv(r.valueMgdl!) }));
  if (!data.length) return null;
  const max = Math.max(conv(250), ...data.map((d) => d.value));
  return (
    <section className="rounded-card bg-card p-4" aria-label={t.numbers.trend}>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          {/* The person's range, as a soft sage band at 25%. */}
          <ReferenceArea y1={conv(range.lowMgdl)} y2={conv(range.highMgdl)} fill="hsl(var(--range-in))" fillOpacity={0.25} stroke="none" />
          <XAxis dataKey="time" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "hsl(var(--border))" }} />
          <YAxis domain={[0, Math.ceil(max)]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 16 }}
            formatter={(v: number) => [`${unit === "mmol/L" ? v.toFixed(1) : v} ${unit}`, ""]}
          />
          <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: "hsl(var(--primary))", r: 4 }} activeDot={{ r: 6 }} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="t-caption mt-2 flex items-center justify-center gap-2 text-muted-foreground">
        <span aria-hidden className="inline-block h-2.5 w-5 rounded bg-range-in/40" /> {t.numbers.inRangeBand} · {formatGlucose(range.lowMgdl, unit)}–{formatGlucose(range.highMgdl, unit)} {unit}
      </p>
    </section>
  );
}

export function ReadingRows({
  readings,
  unit,
  range,
  onDelete,
  onOpen,
}: {
  readings: GlucoseReading[];
  unit: GlucoseUnit;
  range: TargetRange;
  onDelete: (id: string) => void;
  onOpen: (r: GlucoseReading) => void;
}) {
  if (!readings.length) return <p className="t-body rounded-card border border-dashed border-border p-6 text-center text-muted-foreground">{t.numbers.none}</p>;
  return (
    <ul className="space-y-2">
      {[...readings].reverse().map((r) => {
        const sealed = r.state === "sealed";
        return (
          <li key={r.id} className="flex items-center gap-3 rounded-[20px] bg-card px-4 py-3">
            <button type="button" onClick={() => onOpen(r)} className="flex flex-1 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {sealed || r.valueMgdl == null ? (
                <>
                  <Mail aria-hidden className="h-5 w-5 text-muted-foreground" />
                  <span className="t-body-strong flex-1">{t.numbers.sealedRow}</span>
                </>
              ) : (
                <>
                  <BandDot band={classifyReading(r.valueMgdl, range).band} />
                  <span className="flex-1">
                    <span className="t-heading">{formatGlucose(r.valueMgdl, unit)}</span> <span className="t-caption text-muted-foreground">{unit}</span>
                    <span className="t-caption block text-muted-foreground">{t.reading.labels[bandLabelKey(r.valueMgdl, range)]}</span>
                  </span>
                </>
              )}
              <span className="t-caption text-muted-foreground">{fmtTime(r.at)}</span>
            </button>
            <Button variant="ghost" size="icon" aria-label={t.numbers.delete} onClick={() => onDelete(r.id)} className="text-muted-foreground">
              <Trash2 aria-hidden />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
