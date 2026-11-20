import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { ChevronDown, Mail, Utensils } from "lucide-react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { LogTile } from "@/components/keeper/LogTile";
import { Overline } from "@/components/keeper/Controls";
import { TabScreen } from "@/components/keeper/Layout";
import { TILE_KINDS } from "@/components/keeper/kinds";
import { BandDot } from "@/components/keeper/RangeBar";
import { NudgeCard } from "@/features/habits/NudgeCard";
import { settleFinishedFasts } from "@/lib/fastingStore";
import { db } from "@/lib/db";
import { dueCheckIn, useActiveFast, useNow, useRecent } from "@/lib/data";
import { bandLabelKey, classifyReading, formatGlucose } from "@/lib/clinical/thresholds";
import { inEatingWindow } from "@/lib/rules/fasting";
import { pickNudge } from "@/lib/rules/smart-timing";
import { localDay, minutesBetween } from "@/lib/rules/time";
import { fmtTime } from "@/lib/format";
import { showsGlucose, useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { t } from "@/copy/en";
import type { LogKind, Settings } from "@/types/domain";
import { Timeline, patchesFor } from "./Timeline";
import { TodayTop } from "./TodayTop";

// Fasting and Ramadan variants (and adhan) load only when Fasting mode is on.
const FastingTop = lazy(() => import("@/features/fasting/FastingTop").then((m) => ({ default: m.FastingTop })));
const EatingWindowCard = lazy(() => import("@/features/fasting/FastingTop").then((m) => ({ default: m.EatingWindowCard })));
const StepUpCard = lazy(() => import("@/features/fasting/FastingTop").then((m) => ({ default: m.StepUpCard })));
const RamadanTop = lazy(() => import("@/features/fasting/RamadanTop").then((m) => ({ default: m.RamadanTop })));

/** B1 Today (Figma 14:66). Never shows a glucose number or colour unless comfort is ranges/numbers. */
export default function Today() {
  const settings = useSettings();
  const now = useNow();
  const recent = useRecent(14, now);
  const activeFast = useActiveFast();
  const envelopeIds = useLiveQuery(() => db.readings.orderBy("at").primaryKeys(), []);
  const [showMore, setShowMore] = useState(false);
  const navigate = useNavigate();
  const weights = useLiveQuery(() => db.weights.orderBy("at").toArray(), []);

  // Close fasts whose planned end has passed (completed — ending is never automatic otherwise).
  const minuteKey = Math.floor(now.getTime() / 60_000);
  useEffect(() => {
    void settleFinishedFasts(new Date(minuteKey * 60_000));
  }, [minuteKey]);

  const today = localDay(now);
  const data = useMemo(() => {
    if (!recent) return null;
    const todayLogs = recent.logs.filter((l) => localDay(l.at) === today && new Date(l.at) <= now);
    const todayReadings = recent.readings.filter((r) => localDay(r.at) === today);
    const last24 = (iso: string) => minutesBetween(iso, now) <= 24 * 60 && new Date(iso) <= now;
    return {
      todayLogs,
      todayReadings,
      logs24: recent.logs.filter((l) => last24(l.at)),
      checkins24: recent.checkins.filter((c) => last24(c.at)),
    };
  }, [recent, today, now]);

  if (!settings || !recent || !data || activeFast === undefined) return <TabScreen>{null}</TabScreen>;

  const fast = activeFast ?? undefined;
  const track = settings.fasting.track;
  // Ramadan: no food nudges while fasting, and tiny habits resume ≥ 60 min after iftar.
  const afterIftar = recent.fasts.some(
    (f) => f.track === "ramadan" && new Date(f.plannedEndAt) <= now && minutesBetween(f.plannedEndAt, now) < 60,
  );
  const nudge = afterIftar ? null : pickNudge({
    now,
    settings,
    logs: data.logs24,
    checkins: data.checkins24,
    nudges: recent.nudges,
    activeFast: fast ? { ...fast, inEatingWindow: inEatingWindow(fast, now) } : undefined,
  });
  const due = dueCheckIn(now, data.logs24, recent.checkins, settings);
  const envelopeNo = new Map((envelopeIds ?? []).map((id, i) => [id, i + 1]));
  const tiles = TILE_KINDS.filter((k) => settings.easyKinds.includes(k));
  const hiddenTiles = TILE_KINDS.filter((k) => !settings.easyKinds.includes(k));
  const empty = data.todayLogs.length === 0 && data.todayReadings.length === 0;
  const sealedToday = data.todayReadings.filter((r) => r.state === "sealed").length;
  const open = (k: LogKind) => navigate(`/log/${k}`);

  return (
    <TabScreen>
      <Suspense fallback={<div className="h-32" />}>
        {track === "ramadan" ? (
          <RamadanTop settings={settings} now={now} sessions={recent.fasts} />
        ) : fast ? (
          <FastingTop settings={settings} now={now} session={fast} readings={recent.readings} logs={data.logs24} />
        ) : (
          <>
            <TodayTop settings={settings} now={now} activeFast={fast} patches={patchesFor(data.todayLogs)} count={data.todayLogs.length} />
            {track && (
              <div className="mt-4">
                <EatingWindowCard settings={settings} now={now} />
              </div>
            )}
          </>
        )}
        {track && track !== "ramadan" && track !== "doctor-plan" && (
          <div className="mt-4">
            <StepUpCard settings={settings} sessions={recent.fasts} readings={recent.readings} logs={recent.logs} weights={weights ?? []} now={now} />
          </div>
        )}
      </Suspense>

      <section className="mt-6" aria-labelledby="add-to-today">
        <Overline as="h2">
          <span id="add-to-today">{t.today.addToToday}</span>
        </Overline>
        <div className="mt-3 grid grid-cols-5 justify-items-center gap-y-4">
          {tiles.map((k) => (
            <LogTile key={k} kind={k} onClick={() => open(k)} highlight={empty} />
          ))}
          {hiddenTiles.length > 0 && (
            <button
              type="button"
              aria-expanded={showMore}
              onClick={() => setShowMore((v) => !v)}
              className="group flex w-[62px] flex-col items-center gap-1.5 focus-visible:outline-none"
            >
              <span className="flex h-[58px] w-[58px] items-center justify-center rounded-tile border-[1.5px] border-dashed border-border group-focus-visible:ring-2 group-focus-visible:ring-ring">
                <ChevronDown aria-hidden className={cn("h-6 w-6 transition-transform", showMore && "rotate-180")} strokeWidth={1.8} />
              </span>
              <span className="t-label text-muted-foreground">{t.today.more}</span>
            </button>
          )}
          {showMore && hiddenTiles.map((k) => <LogTile key={k} kind={k} onClick={() => open(k)} />)}
        </div>
        {settings.ladderStep >= 4 && (
          <Link
            to="/glucose/check"
            className="mt-4 flex min-h-11 items-center gap-3 rounded-[20px] bg-card px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Mail aria-hidden className="h-5 w-5 text-primary-strong" />
            <span className="flex-1">
              <span className="t-body-strong block">{t.today.checkGlucose}</span>
              {settings.glucoseComfort === "sealed" && <span className="t-caption text-muted-foreground">{t.today.checkGlucoseBody}</span>}
            </span>
          </Link>
        )}
      </section>

      {nudge && (
        <div className="mt-5">
          <NudgeCard nudge={nudge} safetyNoteSeen={settings.habitSafetyNoteSeen} />
        </div>
      )}

      <section className="mt-6" aria-labelledby="today-timeline">
        <Overline as="h2">
          <span id="today-timeline">{t.today.today}</span>
        </Overline>

        <div className="mt-3 space-y-2">
          {due && <CheckInPrompt mealId={due.id} slot={due.data.slot} />}
          {sealedToday > 0 && (
            <Link to="/week" className="flex items-center gap-3 rounded-[20px] bg-primary-soft px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Mail aria-hidden className="h-5 w-5 text-primary-strong" />
              <span className="t-body flex-1">{t.today.envelopesWaiting(sealedToday)}</span>
            </Link>
          )}
          {showsGlucose(settings) && <LastReadingChip settings={settings} readings={recent.readings} />}
        </div>

        {empty ? (
          <p className="t-body mt-3 rounded-[20px] border border-dashed border-border px-4 py-5 text-center text-muted-foreground">{t.today.empty}</p>
        ) : (
          <div className="mt-3">
            <Timeline logs={data.todayLogs} checkins={recent.checkins} readings={data.todayReadings} envelopeNo={envelopeNo} settings={settings} />
          </div>
        )}
      </section>

      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    </TabScreen>
  );
}

function CheckInPrompt({ mealId, slot }: { mealId: string; slot?: string }) {
  return (
    <Link
      to={`/checkin/${mealId}`}
      className="flex items-center gap-3 rounded-[20px] bg-feeling-soft px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Utensils aria-hidden className="h-5 w-5" strokeWidth={1.8} />
      <span className="t-body flex-1">{t.today.checkinDue(slot ? t.slots[slot as keyof typeof t.slots] : t.kinds.meal)}</span>
      <span className="t-label text-primary-strong">{t.today.checkinOpen}</span>
    </Link>
  );
}

/** Only when comfort is ranges or numbers: a slim chip, never a chart. */
function LastReadingChip({ settings, readings }: { settings: Settings; readings: { at: string; valueMgdl: number | null; state: string; id: string }[] }) {
  const last = [...readings].reverse().find((r) => r.state === "opened" && r.valueMgdl != null);
  if (!last || last.valueMgdl == null) return null;
  const band = classifyReading(last.valueMgdl, settings.targetRange).band;
  const label = t.reading.labels[bandLabelKey(last.valueMgdl, settings.targetRange)];
  return (
    <Link
      to={settings.glucoseComfort === "numbers" ? "/glucose/numbers" : `/glucose/reading/${last.id}`}
      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-card px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <BandDot band={band} />
      <span className="t-label">
        {t.today.lastReading} · {settings.glucoseComfort === "numbers" ? `${formatGlucose(last.valueMgdl, settings.unit)} ${settings.unit} · ` : ""}
        {label}
      </span>
      <span className="t-caption text-muted-foreground">{fmtTime(last.at)}</span>
    </Link>
  );
}

