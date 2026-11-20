import { useNavigate } from "react-router-dom";
import { TimelineItem } from "@/components/keeper/TimelineItem";
import { BandDot } from "@/components/keeper/RangeBar";
import { classifyReading, bandLabelKey, formatGlucose } from "@/lib/clinical/thresholds";
import { fmtTime } from "@/lib/format";
import { usePhotoUrl } from "@/lib/photos";
import { t } from "@/copy/en";
import type { CheckIn, GlucoseReading, LogEntry, Settings } from "@/types/domain";
import type { QuiltPatch } from "@/components/keeper/Visuals";

function MealThumb({ photoId }: { photoId: string }) {
  const url = usePhotoUrl(photoId);
  if (!url) return null;
  return <img src={url} alt="" className="h-10 w-10 shrink-0 rounded-[14px] object-cover" />;
}

export function logTitle(l: LogEntry): { title: string; meta?: string } {
  const d = l.data;
  switch (d.kind) {
    case "meal": {
      const slot = d.slot ? t.slots[d.slot] : t.kinds.meal;
      return { title: d.quickPick || slot, meta: t.timeline.mealMeta(slot, t.sizes[d.size], d.feeling ? t.energy[d.feeling] : undefined) };
    }
    case "sleep":
      return { title: t.timeline.sleep(d.hours), meta: t.timeline.sleepMeta(d.quality ? t.sleep.qualities[d.quality].toLowerCase() : undefined) };
    case "feeling":
      return { title: t.timeline.feeling(t.moods[d.mood]), meta: d.tags?.map((x) => t.feeling.tags[x] ?? x).join(" · ") || undefined };
    case "move": {
      const habit = d.habitId ? t.habits[d.habitId].title : t.moveTypes[d.type];
      return { title: t.timeline.move(habit, d.minutes, d.reps), meta: d.endedEarly ? t.timeline.endedEarly : d.habitId ? t.today.habitLeaf : undefined };
    }
    case "water":
      return { title: t.timeline.water(d.glasses, d.drink ? t.water.drinks[d.drink].toLowerCase() : undefined) };
    case "medicines":
      return { title: t.timeline.medicines };
  }
}

/** Today's patches: one per log, newest last, with a leaf on finished tiny habits. */
export function patchesFor(logs: LogEntry[]): QuiltPatch[] {
  return logs.map((l) => ({
    kind: l.kind,
    solid: l.kind === "meal" || l.kind === "move" || l.kind === "water",
    leaf: l.data.kind === "move" && !!l.data.habitId,
  }));
}

/**
 * Today's timeline. Glucose appears only as an envelope (no value, band or colour) unless the
 * person chose Ranges or Numbers.
 */
export function Timeline({
  logs,
  checkins,
  readings,
  envelopeNo,
  settings,
}: {
  logs: LogEntry[];
  checkins: CheckIn[];
  readings: GlucoseReading[];
  envelopeNo: Map<string, number>;
  settings: Settings;
}) {
  const navigate = useNavigate();
  const shows = settings.glucoseComfort === "ranges" || settings.glucoseComfort === "numbers";
  const checkinByMeal = new Map(checkins.map((c) => [c.mealId, c]));

  type Row = { at: string; key: string; node: JSX.Element };
  const rows: Row[] = logs.map((l) => {
    const { title, meta } = logTitle(l);
    const c = checkinByMeal.get(l.id);
    const metaWithCheckin = c ? [meta, t.timeline.checkin(t.energy[c.energy])].filter(Boolean).join(" · ") : meta;
    return {
      at: l.at,
      key: l.id,
      node: (
        <TimelineItem
          kind={l.kind}
          title={title}
          meta={metaWithCheckin}
          time={fmtTime(l.at)}
          leaf={l.data.kind === "move" && !!l.data.habitId}
          thumb={l.data.kind === "meal" && l.data.photoId ? <MealThumb photoId={l.data.photoId} /> : undefined}
          onClick={() => navigate(`/log/${l.kind}?edit=${l.id}`)}
        />
      ),
    };
  });

  for (const r of readings) {
    const n = envelopeNo.get(r.id) ?? 0;
    const sealed = r.state === "sealed";
    let meta: React.ReactNode = sealed ? t.timeline.sealedMeta : t.week.opened;
    if (!sealed && shows && r.valueMgdl != null) {
      const label = t.reading.labels[bandLabelKey(r.valueMgdl, settings.targetRange)];
      meta =
        settings.glucoseComfort === "numbers" ? (
          <span className="inline-flex items-center gap-1.5">
            <BandDot band={classifyReading(r.valueMgdl, settings.targetRange).band} />
            {formatGlucose(r.valueMgdl, settings.unit)} {settings.unit} · {label}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <BandDot band={classifyReading(r.valueMgdl, settings.targetRange).band} />
            {label}
          </span>
        );
    }
    rows.push({
      at: r.at,
      key: r.id,
      node: (
        <TimelineItem
          kind="envelope"
          title={t.week.envelope(n)}
          meta={meta}
          time={fmtTime(r.at)}
          onClick={() => navigate(sealed ? `/glucose/sealed/${r.id}` : `/glucose/reading/${r.id}`)}
        />
      ),
    });
  }

  rows.sort((a, b) => b.at.localeCompare(a.at));
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.key}>{r.node}</li>
      ))}
    </ul>
  );
}
