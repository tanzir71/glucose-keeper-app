import { useEffect, useRef } from "react";
import { ChevronRight, Leaf, Plus, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/keeper/Chip";
import { Overline } from "@/components/keeper/Controls";
import { Ring } from "@/components/keeper/Visuals";
import { DateAvatar } from "@/features/today/TodayTop";
import { addFastDrink, addFastFeeling, endFast, startFast } from "@/lib/fastingStore";
import { canStart, eatingWindow, fastProgress, nextFastStart, offerNextStep, shouldStopFast, weightSoftening } from "@/lib/rules/fasting";
import { minutesBetween } from "@/lib/rules/time";
import { updateSettings } from "@/lib/settings";
import { fmtHM, fmtTime } from "@/lib/format";
import { t } from "@/copy/en";
import type { FastFeeling, FastSession, GlucoseReading, LogEntry, Settings, WeightEntry } from "@/types/domain";

const FEELINGS: FastFeeling[] = ["fine", "hungry", "headache", "shaky-dizzy"];

function left(mins: number) {
  const m = Math.max(0, Math.round(mins));
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} m`;
}

export function StopRulesLink({ ramadan }: { ramadan?: boolean }) {
  return (
    <Link
      to={`/fasting/stop${ramadan ? "?ramadan=1" : ""}`}
      className="flex min-h-11 items-center gap-3 rounded-card border-[1.5px] border-safety bg-card px-4 py-3 text-safety focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-safety text-safety-foreground">
        <ShieldCheck aria-hidden className="h-4 w-4" />
      </span>
      <span className="t-body-strong flex-1">{ramadan ? t.ramadan.breakIf : t.fasting.stopRulesLink}</span>
      <ChevronRight aria-hidden className="h-5 w-5" />
    </Link>
  );
}

/** Step-up offer (05 §4.4). Dismissible; never switches automatically. */
export function StepUpCard({ settings, sessions, readings, logs, weights, now }: { settings: Settings; sessions: FastSession[]; readings: GlucoseReading[]; logs: LogEntry[]; weights: WeightEntry[]; now: Date }) {
  const softening = weightSoftening(weights);
  const offer = offerNextStep({ now, fasting: settings.fasting, sessions, readings, logs, softening });
  if (softening && settings.fasting.track && settings.fasting.track !== "ramadan") {
    return <p className="t-body rounded-card bg-feeling-soft p-4">{t.fasting.softening}</p>;
  }
  if (!offer) return null;
  const record = (patch: Partial<Settings["fasting"]>) =>
    updateSettings((s) => ({ fasting: { ...s.fasting, ...patch, stepUp: { ...s.fasting.stepUp, lastOfferAt: new Date().toISOString() } } }));
  return (
    <section className="rounded-card bg-primary-soft p-4">
      <p className="t-body-strong">{t.fasting.stepUp(offer.hours)}</p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => canStart(offer.next, settings.fasting).ok && record({ track: offer.next, windowStart: undefined })}>
          {t.fasting.tryIt}
        </Button>
        <Button size="sm" variant="outline" onClick={() => record({})}>
          {t.common.notNow}
        </Button>
      </div>
    </section>
  );
}

/** Fasting mode on, eating window open: a slim card to start tonight's fast by hand. */
export function EatingWindowCard({ settings, now }: { settings: Settings; now: Date }) {
  const track = settings.fasting.track!;
  const w = eatingWindow(track, settings.fasting.windowStart);
  const nextStart = nextFastStart(now, track, settings.fasting.windowStart);
  const start = async () => {
    const s = await startFast(track, settings, new Date());
    if (s) toast(t.fasting.trackPill(t.fasting.trackNames[track]));
  };
  return (
    <section className="rounded-card bg-sleep-soft p-4">
      <p className="t-label text-foreground">{t.fasting.trackPill(t.fasting.trackNames[track])}</p>
      <p className="t-body-strong mt-1">{t.fasting.notFasting}</p>
      {w && <p className="t-caption text-muted-foreground">{t.fasting.windowLine(fmtHM(w.open), fmtHM(w.close))}</p>}
      {track !== "doctor-plan" && <p className="t-caption text-muted-foreground">{t.fasting.nextFast(fmtTime(nextStart))}</p>}
      <Button size="sm" variant="outline" className="mt-3" onClick={start}>
        {t.fasting.startNow}
      </Button>
    </section>
  );
}

/** C3 Fasting Today (Figma 21:637): replaces the top of Today during an active fast. */
export function FastingTop({
  settings,
  now,
  session,
  readings,
  logs,
}: {
  settings: Settings;
  now: Date;
  session: FastSession;
  readings: GlucoseReading[];
  logs: LogEntry[];
}) {
  const navigate = useNavigate();
  const p = fastProgress(session, now);
  const w = eatingWindow(session.track, settings.fasting.windowStart);
  const doctor = session.track === "doctor-plan";
  const hydration = canStart(session.track, settings.fasting).flags?.hydrationRule;
  const lastFeeling = [...session.feelings].reverse().find((f) => minutesBetween(f.at, now) < 60)?.tag;
  const count = (d: "water" | "tea" | "coffee") => session.drinks.filter((x) => x.drink === d).length;

  // Stop rules: a reading or feeling that breaks the fast opens the stop sheet once.
  const stop = shouldStopFast({ session, readings, logs });
  const opened = useRef<string>();
  useEffect(() => {
    if (!stop.stop || opened.current === session.id) return;
    opened.current = session.id;
    navigate(`/fasting/stop?reason=${stop.trigger}`);
  }, [stop, session.id, navigate]);

  const feel = async (f: FastFeeling) => {
    await addFastFeeling(session.id, f);
    if (f === "shaky-dizzy") navigate("/fasting/stop?reason=shaky-dizzy");
  };
  const end = async () => {
    await endFast(session, "chose");
    toast(t.fasting.ended);
  };

  return (
    <header className="space-y-4">
      <div>
        <DateAvatar now={now} settings={settings} />
        <span className="t-caption mt-1 inline-block rounded-full bg-sleep-soft px-3 py-1 font-semibold">{t.fasting.trackPill(t.fasting.trackNames[session.track])}</span>
      </div>

      <section className="rounded-card-lg bg-card p-5 text-center">
        <Ring progress={p.progress} size={200} stroke={14} trackClass="stroke-sleep-soft" progressClass="stroke-sleep">
          <span className="t-number text-[2.25rem] leading-none">{t.fasting.hoursMinutes(Math.floor(p.elapsedMin / 60), Math.floor(p.elapsedMin % 60))}</span>
          <span className="t-caption mt-1 text-muted-foreground">{p.done ? t.fasting.done : t.fasting.toGo(left(p.remainingMin))}</span>
        </Ring>
        {w && <p className="t-caption mt-3 text-muted-foreground">{t.fasting.windowLine(fmtHM(w.open), fmtHM(w.close))}</p>}
      </section>

      <div>
        <Overline as="h2">{t.fasting.howFeel}</Overline>
        <div className="mt-2 flex flex-wrap gap-2">
          {FEELINGS.map((f) => (
            <Chip key={f} role="button" selected={lastFeeling === f} onClick={() => feel(f)}>
              {t.fasting.feelings[f]}
            </Chip>
          ))}
        </div>
      </div>

      <Link to="/fasting/stop" className="t-body flex items-center gap-2 rounded-card bg-safety p-3 text-safety-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <ShieldCheck aria-hidden className="h-4 w-4 shrink-0" /> {t.fasting.shakyStrip}
      </Link>

      <div className="flex flex-wrap gap-2">
        {(["water", "tea", "coffee"] as const).map((d) => (
          <button
            key={d}
            type="button"
            aria-label={t.fasting.addDrinkLabel(t.fasting.drinks[d])}
            onClick={() => addFastDrink(session.id, d)}
            className={`t-label inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 ${d === "water" ? "bg-water-soft" : "bg-meal-soft"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
          >
            {t.fasting.drinkCount(t.fasting.drinks[d], count(d))}
            <Plus aria-hidden className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
      {hydration && <p className="t-caption text-muted-foreground">{t.fasting.hydration}</p>}

      {!doctor && (
        <section className="rounded-card bg-move-soft p-4">
          <p className="t-overline flex items-center gap-1.5 text-primary-strong">
            <Leaf aria-hidden className="h-3.5 w-3.5" /> {t.fasting.breakTitle}
          </p>
          <p className="t-body-strong mt-1">{t.fasting.breakBody}</p>
        </section>
      )}

      <Button variant="ghost" className="w-full" onClick={end}>
        {t.fasting.endNow}
      </Button>
    </header>
  );
}
