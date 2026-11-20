import { useEffect, useRef } from "react";
import { Clock, Leaf, ShieldCheck, Sunrise } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Overline } from "@/components/keeper/Controls";
import { DateAvatar } from "@/features/today/TodayTop";
import { WhyThis } from "@/components/keeper/Layout";
import { startFast } from "@/lib/fastingStore";
import { CITIES, DEFAULT_RAMADAN, PRE_RAMADAN_WEEKS, ramadanPhase, type RamadanPhase } from "@/lib/ramadan";
import { canStart } from "@/lib/rules/fasting";
import { localDay, minutesBetween } from "@/lib/rules/time";
import { updateSettings } from "@/lib/settings";
import { fmtDate, fmtTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { t } from "@/copy/en";
import type { FastSession, GlucoseReading, LogEntry, Settings } from "@/types/domain";
import { StopRulesLink } from "./FastingTop";
import { useStopRules } from "./useStopRules";

function Countdown({ label, target, now, line }: { label: string; target: Date; now: Date; line: string }) {
  const mins = Math.max(0, minutesBetween(now, target));
  return (
    <section className="rounded-card-lg bg-safety p-5 text-safety-foreground" aria-live="off">
      <p className="t-label flex items-center gap-1.5">
        <Clock aria-hidden className="h-4 w-4" /> {label}
      </p>
      <p className="t-number mt-1 text-[2.75rem] leading-none">{t.ramadan.countdown(Math.floor(mins / 60), Math.floor(mins % 60))}</p>
      <p className="t-caption mt-2 text-safety-foreground/85">{line}</p>
    </section>
  );
}

function PlanCard() {
  return (
    <section className="rounded-card bg-card p-4">
      <p className="t-body-strong">{t.ramadan.planCard}</p>
      <ul className="t-body mt-2 list-inside list-disc text-muted-foreground">
        {t.ramadan.planChecklist.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
      <Button asChild size="sm" variant="outline" className="mt-3">
        <Link to="/you/export">{t.fasting.shareDoctor}</Link>
      </Button>
    </section>
  );
}

/**
 * C4 Ramadan Today (Figma 15:521). The day is reshaped around the fast: suhoor/iftar times, no
 * food nudges while fasting, "Break your fast if…" always one tap away.
 */
export function RamadanTop({
  settings,
  now,
  sessions,
  readings,
  logs,
}: {
  settings: Settings;
  now: Date;
  sessions: FastSession[];
  readings: GlucoseReading[];
  logs: LogEntry[];
}) {
  const r = { ...DEFAULT_RAMADAN, ...settings.fasting.ramadan };
  const city = settings.rhythm?.city ?? CITIES[0];
  const phase: RamadanPhase | null = ramadanPhase(now, r, city);
  const flags = canStart("ramadan", settings.fasting).flags ?? { hydrationRule: false };
  const todayKey = localDay(now);
  const water = r.water?.[todayKey] ?? 0;

  // Record today's fast (fajr → maghrib) so stop rules, export and the after-Eid summary work.
  // (Finished days are closed by settleFinishedFasts on Today.)
  const todays = sessions.find((s) => s.track === "ramadan" && localDay(s.startedAt) === todayKey);
  const created = useRef<string>();
  const fastingTimes = phase?.phase === "fasting" ? phase.times : undefined;
  useEffect(() => {
    if (!fastingTimes || todays || created.current === todayKey) return;
    created.current = todayKey;
    void startFast("ramadan", settings, fastingTimes.suhoorEnds, fastingTimes.iftar);
  }, [fastingTimes, todays, todayKey, settings]);

  // Stop rules apply to Ramadan fasts too (IDF–DAR "Break your fast if…").
  useStopRules(todays && !todays.endedAt ? todays : undefined, readings, logs);

  const setWater = (n: number) =>
    updateSettings((s) => ({ fasting: { ...s.fasting, ramadan: { ...DEFAULT_RAMADAN, ...s.fasting.ramadan, water: { ...(s.fasting.ramadan?.water ?? {}), [todayKey]: n } } } }));

  if (!phase) {
    return (
      <header className="space-y-4">
        <DateAvatar now={now} settings={settings} />
        <section className="rounded-card bg-sleep-soft p-4">
          <p className="t-body-strong flex items-center gap-2">
            <Sunrise aria-hidden className="h-5 w-5" /> {t.ramadan.setup}
          </p>
          <p className="t-caption mt-1 text-muted-foreground">{t.ramadan.startDateHint}</p>
          <Button asChild size="sm" className="mt-3">
            <Link to="/you/fasting/ramadan">{t.ramadan.setup}</Link>
          </Button>
        </section>
        <StopRulesLink ramadan />
      </header>
    );
  }

  if (phase.phase === "before") {
    return (
      <header className="space-y-4">
        <DateAvatar now={now} settings={settings} />
        <section className="rounded-card bg-sleep-soft p-4">
          <p className="t-overline">{t.ramadan.beforeStart}</p>
          <p className="t-body-strong mt-1">{t.ramadan.notStarted(fmtDate(r.startDate!))}</p>
        </section>
        {phase.daysUntil <= PRE_RAMADAN_WEEKS * 7 && <PlanCard />}
      </header>
    );
  }

  if (phase.phase === "after") {
    const ramadanSessions = sessions.filter((s) => s.track === "ramadan");
    const early = ramadanSessions.filter((s) => s.endedEarly).length;
    const symptom = ramadanSessions.filter((s) => s.endReason === "symptom" || s.endReason === "reading").length;
    return (
      <header className="space-y-4">
        <DateAvatar now={now} settings={settings} />
        <section className="rounded-card bg-feeling-soft p-4">
          <h1 className="t-heading">{t.ramadan.afterEidTitle}</h1>
          <p className="t-body mt-2">{t.ramadan.afterEid(ramadanSessions.length, early, symptom)}</p>
          <p className="t-body-strong mt-2">{t.ramadan.seeDoctor}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link to="/you/export">{t.fasting.shareDoctor}</Link>
            </Button>
            <Button size="sm" variant="outline" onClick={() => updateSettings((s) => ({ fasting: { ...s.fasting, track: undefined } }))}>
              {t.ramadan.finish}
            </Button>
          </div>
        </section>
      </header>
    );
  }

  const fasting = phase.phase === "fasting";
  const iftarPlus60 = new Date(phase.times.iftar.getTime() + 60 * 60_000);
  return (
    <header className="space-y-4">
      <div>
        <DateAvatar now={now} settings={settings} />
        <div className="mt-1 flex items-center justify-between">
          <p className="t-overline text-muted-foreground">{t.ramadan.dayN(phase.day)}</p>
          <span className="t-caption rounded-full bg-sleep-soft px-3 py-1 font-semibold">{fasting ? t.ramadan.fastingNow : t.ramadan.eatingWindow}</span>
        </div>
      </div>

      {fasting ? (
        <Countdown label={t.ramadan.iftarIn} target={phase.times.iftar} now={now} line={t.ramadan.timesLine(fmtTime(phase.times.suhoorEnds), fmtTime(phase.times.iftar), city.name)} />
      ) : (
        <Countdown label={t.ramadan.suhoorIn} target={phase.nextSuhoorEnds} now={now} line={t.ramadan.timesLineWindow(fmtTime(phase.times.iftar), fmtTime(phase.nextSuhoorEnds), city.name)} />
      )}

      {flags.highRisk && (
        <p className="t-body flex gap-2 rounded-card bg-safety p-4 text-safety-foreground" role="note">
          <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0" /> {t.ramadan.highRisk}
        </p>
      )}
      {(flags.planCard || flags.supportOnly) && <PlanCard />}

      {fasting && (
        <section className="rounded-card bg-card p-4">
          <p className="t-body-strong">{t.ramadan.noNudges}</p>
          <p className="t-body text-muted-foreground">{t.ramadan.checkingOk}</p>
        </section>
      )}

      <StopRulesLink ramadan />

      {!fasting && (
        <>
          <div>
            <Overline as="h2">{t.ramadan.iftarPlan}</Overline>
            <ol className="mt-2 grid grid-cols-3 gap-2">
              {t.ramadan.plan.map((x, i) => (
                <li key={x} className={cn("t-caption rounded-2xl p-3 font-semibold", i === 0 ? "bg-water-soft" : i === 1 ? "bg-card" : "bg-meal-soft")}>
                  {x}
                </li>
              ))}
            </ol>
          </div>
          <div>
            <Overline as="h2">{t.ramadan.water}</Overline>
            <div className="mt-2 flex justify-between" role="group" aria-label={t.ramadan.water}>
              {Array.from({ length: 8 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-pressed={i < water}
                  aria-label={t.ramadan.waterGlass(i + 1, i < water)}
                  onClick={() => setWater(i < water ? i : i + 1)}
                  className={cn(
                    "flex h-11 w-9 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    i < water ? "bg-water" : "border border-border bg-water-soft",
                  )}
                >
                  <span aria-hidden className={cn("h-5 w-3 rounded-b-md border-2", i < water ? "border-card" : "border-water")} />
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {settings.tinyHabits && settings.habitsEnabled.includes("stroll") && (
        <div className="rounded-card bg-move-soft p-4">
          {now >= iftarPlus60 ? (
            <Link to="/habit/stroll?min=10&place=home" className="t-body-strong flex min-h-11 items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Leaf aria-hidden className="h-4 w-4" /> {t.ramadan.postIftar}
            </Link>
          ) : (
            <p className="t-body-strong flex items-center gap-2">
              <Leaf aria-hidden className="h-4 w-4" /> {t.ramadan.postIftarSaved(fmtTime(iftarPlus60))}
            </p>
          )}
          <WhyThis reason={t.ramadan.postIftarReason} className="mt-2" />
        </div>
      )}
    </header>
  );
}
