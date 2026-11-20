import { useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Overline, Segmented } from "@/components/keeper/Controls";
import { BackHeader, FlowScreen } from "@/components/keeper/Layout";
import { db } from "@/lib/db";
import { addDays, startOfLocalDay } from "@/lib/rules/time";
import { useSettings } from "@/lib/settings";
import { t } from "@/copy/en";

/** You → Export for my doctor. Asks before including sealed readings (default: include). */
export default function ExportPage() {
  const settings = useSettings();
  const [days, setDays] = useState<"7" | "30" | "90">("30");
  const [includeSealed, setIncludeSealed] = useState(true);
  const [busy, setBusy] = useState(false);
  const sealedCount = useLiveQuery(() => db.readings.where("state").equals("sealed").count(), []);
  if (!settings) return <FlowScreen>{null}</FlowScreen>;

  const gather = async () => {
    const to = new Date();
    const from = startOfLocalDay(addDays(to, -(Number(days) - 1)));
    const [logs, checkins, readings, fasts] = await Promise.all([
      db.logs.where("at").aboveOrEqual(from.toISOString()).toArray(),
      db.checkins.where("at").aboveOrEqual(from.toISOString()).toArray(),
      db.readings.toArray(),
      db.fasts.toArray(),
    ]);
    return { from, to, logs, checkins, readings, fasts, settings, includeSealed };
  };

  const pdf = async () => {
    setBusy(true);
    try {
      const { summaryPdf, shareOrDownload, fileStamp } = await import("@/lib/export");
      const blob = await summaryPdf(await gather());
      await shareOrDownload(blob, `keeper-summary-${fileStamp()}.pdf`, t.export.shareTitle);
      toast(t.export.done);
    } finally {
      setBusy(false);
    }
  };

  const csv = async () => {
    setBusy(true);
    try {
      const { exportReadings, readingsCsv, shareOrDownload, fileStamp } = await import("@/lib/export");
      const d = await gather();
      const rows = exportReadings(d.readings, d.from, d.to, includeSealed);
      if (!rows.length) {
        toast(t.export.nothing);
        return;
      }
      const text = readingsCsv(rows, settings.unit, settings.targetRange);
      await shareOrDownload(new Blob([text], { type: "text/csv;charset=utf-8" }), `keeper-readings-${fileStamp()}.csv`, t.export.shareTitle);
    } finally {
      setBusy(false);
    }
  };

  return (
    <FlowScreen>
      <BackHeader label={t.tabs.you} />
      <h1 className="t-title">{t.export.title}</h1>
      <p className="t-body-l mt-2 text-muted-foreground">{t.export.sub}</p>

      <section className="mt-6 rounded-card bg-card p-4">
        <Overline as="h2">{t.export.range}</Overline>
        <Segmented
          className="mt-3"
          label={t.export.range}
          value={days}
          onChange={setDays}
          options={(["7", "30", "90"] as const).map((d) => ({ value: d, label: t.export.ranges[Number(d)] }))}
        />
      </section>

      {!!sealedCount && (
        <section className="mt-3 rounded-card bg-card p-4">
          <p className="t-body">{t.export.includeSealedQ}</p>
          <label className="mt-3 flex min-h-11 items-center gap-3">
            <Checkbox checked={includeSealed} onCheckedChange={(v) => setIncludeSealed(v === true)} className="h-6 w-6 rounded-md" />
            <span className="t-body-strong">{t.export.includeSealed}</span>
          </label>
        </section>
      )}

      <div className="mt-6 space-y-3">
        <Button size="lg" onClick={pdf} disabled={busy}>
          <FileText aria-hidden /> {busy ? t.export.making : t.export.pdf}
        </Button>
        <Button size="lg" variant="outline" onClick={csv} disabled={busy}>
          <FileSpreadsheet aria-hidden /> {t.export.csv}
        </Button>
      </div>
    </FlowScreen>
  );
}
