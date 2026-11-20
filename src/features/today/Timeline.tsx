import { useNavigate } from "react-router-dom";
import { TimelineItem } from "@/components/keeper/TimelineItem";
import { fmtTime } from "@/lib/format";
import { usePhotoUrl } from "@/lib/photos";
import { t } from "@/copy/en";
import { logTitle } from "./logView";
import type { CheckIn, GlucoseReading, LogEntry } from "@/types/domain";

function MealThumb({ photoId }: { photoId: string }) {
  const url = usePhotoUrl(photoId);
  if (!url) return null;
  return <img src={url} alt="" className="h-10 w-10 shrink-0 rounded-[14px] object-cover" />;
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
}: {
  logs: LogEntry[];
  checkins: CheckIn[];
  readings: GlucoseReading[];
  envelopeNo: Map<string, number>;
}) {
  const navigate = useNavigate();
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
    // Today shows glucose only through the slim "last reading" chip (01 B1); the timeline
    // just marks that a check happened.
    const meta = sealed ? t.timeline.sealedMeta : t.week.opened;
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
