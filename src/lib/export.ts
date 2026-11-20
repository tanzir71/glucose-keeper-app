// Export for the doctor. Restyled from v1's CSV/PDF export (same CSV builder and jsPDF +
// autotable day tables), extended with the v2 summary (03 §10). jsPDF is lazy-loaded.
// No red and no blue: Keeper ink and moss only. Band columns use words, never colour alone.
import { t } from "@/copy/en";
import { bandLabelKey, formatGlucose, type TargetRange } from "@/lib/clinical/thresholds";
import { localDay, minutesBetween } from "@/lib/rules/time";
import type { CheckIn, FastSession, GlucoseReading, GlucoseUnit, LogEntry, MealData, Settings, SleepData } from "@/types/domain";

const INK: [number, number, number] = [42, 40, 51];
const MOSS: [number, number, number] = [74, 115, 86];
const MUTED: [number, number, number] = [98, 94, 105];
const OAT: [number, number, number] = [239, 232, 220];

export interface ExportInput {
  from: Date;
  to: Date;
  logs: LogEntry[];
  checkins: CheckIn[];
  readings: GlucoseReading[];
  fasts: FastSession[];
  settings: Settings;
  includeSealed: boolean;
}

const inRange = (iso: string, from: Date, to: Date) => {
  const d = new Date(iso);
  return d >= from && d <= to;
};
const date = (iso: string) => new Date(iso).toLocaleDateString();
const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** Readings in range; sealed ones only if the person chose to include them. */
export function exportReadings(readings: GlucoseReading[], from: Date, to: Date, includeSealed: boolean): GlucoseReading[] {
  return readings.filter((r) => inRange(r.at, from, to) && (includeSealed || r.state !== "sealed")).sort((a, b) => a.at.localeCompare(b.at));
}

function readingCells(r: GlucoseReading, unit: GlucoseUnit, range: TargetRange): string[] {
  const value = r.valueMgdl == null ? t.export.sealedValue : `${formatGlucose(r.valueMgdl, unit)} ${unit}`;
  const band = r.valueMgdl == null ? "" : t.reading.labels[bandLabelKey(r.valueMgdl, range)];
  const context = r.context ? t.check.contexts[r.context] : "";
  return [date(r.at), time(r.at), value, band, context, r.note ?? ""];
}

// ---------- CSV (v1 exportToCSV, adapted) ----------
export function readingsCsv(readings: GlucoseReading[], unit: GlucoseUnit, range: TargetRange): string {
  const headers = [...t.export.readingCols];
  const rows = readings.map((r) => readingCells(r, unit, range));
  return [headers.join(","), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
}

// ---------- Summary numbers ----------
export function summarize(input: ExportInput) {
  const { from, to } = input;
  const logs = input.logs.filter((l) => inRange(l.at, from, to));
  const days = Math.max(1, Math.round(minutesBetween(from, to) / (24 * 60)));
  const meals = logs.filter((l): l is LogEntry<MealData> => l.data.kind === "meal");
  const sleeps = logs.filter((l): l is LogEntry<SleepData> => l.data.kind === "sleep");
  const checkins = input.checkins.filter((c) => inRange(c.at, from, to));
  const energy = { sleepy: 0, steady: 0, buzzy: 0 };
  for (const c of checkins) energy[c.energy]++;
  const habits = logs.filter((l) => l.data.kind === "move" && !!l.data.habitId).length;
  const fasts = input.fasts.filter((f) => inRange(f.startedAt, from, to)).sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const loggedDays = new Set(logs.map((l) => localDay(l.at))).size;
  return {
    days,
    loggedDays,
    mealsPerDay: loggedDays ? meals.length / loggedDays : 0,
    bigShare: meals.length ? meals.filter((m) => m.data.size === "big").length / meals.length : 0,
    avgSleep: sleeps.length ? sleeps.reduce((a, s) => a + s.data.hours, 0) / sleeps.length : null,
    energy,
    checkinCount: checkins.length,
    habits,
    fasts,
    readings: exportReadings(input.readings, from, to, input.includeSealed),
  };
}

// ---------- PDF (v1 exportToPDF, restyled and extended) ----------
export async function summaryPdf(input: ExportInput): Promise<Blob> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const s = summarize(input);
  const { settings } = input;
  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(20);
  doc.setTextColor(...INK);
  doc.text(t.export.pdfTitle, 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(`${t.export.pdfFor(settings.name)} · ${t.export.pdfRange(date(input.from.toISOString()), date(input.to.toISOString()))}`, 14, y);
  y += 5;
  doc.text(t.export.pdfGenerated(new Date().toLocaleString()), 14, y);
  y += 8;

  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const fastsDone = s.fasts.filter((f) => f.endedAt && !f.endedEarly).length;
  const fastsEarly = s.fasts.filter((f) => f.endedEarly).length;
  const fastsSymptom = s.fasts.filter((f) => f.endReason === "symptom" || f.endReason === "reading").length;
  const sx = t.export.sections;
  const overview: string[][] = [
    [sx.days, `${s.loggedDays} / ${s.days}`],
    [sx.meals, s.mealsPerDay.toFixed(1)],
    [sx.bigMeals, pct(s.bigShare)],
    [sx.sleep, s.avgSleep == null ? t.export.none : `${s.avgSleep.toFixed(1)} h`],
    [sx.energy, s.checkinCount ? `${t.energy.sleepy} ${s.energy.sleepy} · ${t.energy.steady} ${s.energy.steady} · ${t.energy.buzzy} ${s.energy.buzzy}` : t.export.none],
    [sx.habits, String(s.habits)],
    [sx.fasting, s.fasts.length ? `${s.fasts.length} · ${t.export.fastEnd.planned} ${fastsDone} · ${t.export.fastEnd.chose} ${fastsEarly} · ${t.export.fastEnd.symptom} ${fastsSymptom}` : t.export.none],
  ];
  const f = settings.fasting;
  if (f.medsLowRisk || f.medsSglt2) {
    const yn = (v?: string) => (v === "yes" ? t.common.yes : v === "no" ? t.common.no : v === "not-sure" ? t.common.notSure : "–");
    overview.push([sx.fastingSafety, `${t.fasting.q1} ${yn(f.medsLowRisk)} · ${t.fasting.q2} ${yn(f.medsSglt2)}${f.careTeamConfirmed ? ` · ${t.fasting.confirm}` : ""}`]);
  }

  autoTable(doc, {
    startY: y,
    body: overview,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 2, textColor: INK },
    columnStyles: { 0: { cellWidth: 55, fontStyle: "bold" } },
    margin: { left: 14 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  if (s.fasts.length) {
    doc.setFontSize(12);
    doc.setTextColor(...MOSS);
    doc.text(sx.fasting, 14, y);
    autoTable(doc, {
      startY: y + 3,
      head: [[...t.export.fastCols]],
      body: s.fasts.map((x) => [
        `${date(x.startedAt)} ${time(x.startedAt)}`,
        t.fasting.trackNames[x.track],
        x.endedAt ? (minutesBetween(x.startedAt, x.endedAt) / 60).toFixed(1) : "–",
        x.endedAt ? t.export.fastEnd[x.endReason ?? (x.endedEarly ? "chose" : "planned")] : "–",
      ]),
      theme: "grid",
      headStyles: { fillColor: MOSS, textColor: 255 },
      styles: { fontSize: 9, cellPadding: 2, textColor: INK, lineColor: OAT },
      margin: { left: 14 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // Readings, grouped by day as in v1.
  doc.setFontSize(12);
  doc.setTextColor(...MOSS);
  if (y > 250) {
    doc.addPage();
    y = 20;
  }
  doc.text(sx.readings, 14, y);
  y += 3;
  if (!s.readings.length) {
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(t.export.none, 14, y + 5);
  } else {
    autoTable(doc, {
      startY: y,
      head: [[...t.export.readingCols]],
      body: s.readings.map((r) => readingCells(r, settings.unit, settings.targetRange)),
      theme: "grid",
      headStyles: { fillColor: MOSS, textColor: 255 },
      styles: { fontSize: 9, cellPadding: 2, textColor: INK, lineColor: OAT },
      margin: { left: 14 },
    });
  }
  return doc.output("blob");
}

/** Web Share API with files, falling back to a download. */
export async function shareOrDownload(blob: Blob, filename: string, title: string): Promise<void> {
  const file = new File([blob], filename, { type: blob.type });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title });
      return;
    } catch (e) {
      if ((e as DOMException).name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const fileStamp = () => new Date().toISOString().split("T")[0];
