import { useMemo } from "react";
import { MoreHorizontal, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Overline } from "@/components/keeper/Controls";
import { TabScreen } from "@/components/keeper/Layout";
import { Quilt } from "@/components/keeper/Visuals";
import { TimelineItem } from "@/components/keeper/TimelineItem";
import { BandDot } from "@/components/keeper/RangeBar";
import { useActiveFast, useAllReadings, useNow, useRecent } from "@/lib/data";
import { bandLabelKey, classifyReading, formatGlucose } from "@/lib/clinical/thresholds";
import { shouldInvite } from "@/lib/rules/invitation";
import { weeklyInsights } from "@/lib/rules/insights";
import { addDays, localDay } from "@/lib/rules/time";
import { fmtDayRange, fmtDayTime, weekdayInitial } from "@/lib/format";
import { showsGlucose, updateSettings, useSettings } from "@/lib/settings";
import { patchesFor } from "@/features/today/logView";
import { WeightCard } from "@/features/fasting/WeightCard";
import { t } from "@/copy/en";

/** D1 Week (Figma 16:387). */
export default function Week() {
  const settings = useSettings();
  const now = useNow(60_000);
  const recent = useRecent(28, now);
  const readings = useAllReadings();
  const activeFast = useActiveFast();
  const navigate = useNavigate();

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(now, i - 6)), [now]);
  if (!settings || !recent || !readings) return <TabScreen>{null}</TabScreen>;

  const rows = days.map((d) => {
    const key = localDay(d);
    const logs = recent.logs.filter((l) => localDay(l.at) === key);
    return {
      label: weekdayInitial(d),
      ariaLabel: t.week.dayRow(d.toLocaleDateString(undefined, { weekday: "long" }), logs.length),
      patches: patchesFor(logs).slice(0, 5),
    };
  });

  const insights = weeklyInsights({
    now,
    logs: recent.logs,
    checkins: recent.checkins,
    readings: recent.readings,
    comfort: settings.glucoseComfort,
    targetRange: settings.targetRange,
  });
  const invitation = shouldInvite({ now, settings, logs: recent.logs, checkins: recent.checkins, activeFast: !!activeFast });

  const tellMore = async () => {
    await updateSettings((s) => ({ invitation: { ...s.invitation, lastShownAt: new Date().toISOString() } }));
    navigate("/glucose/comfort", { state: { from: "invitation" } });
  };
  const notNow = () => updateSettings((s) => ({ invitation: { ...s.invitation, snoozedUntil: addDays(new Date(), 14).toISOString() } }));
  const never = () => updateSettings((s) => ({ invitation: { ...s.invitation, dismissedForever: true } }));

  const shows = showsGlucose(settings);
  const envelopes = [...readings].reverse();

  return (
    <TabScreen>
      <p className="t-overline text-muted-foreground">{fmtDayRange(days[0], days[6])}</p>
      <h1 className="t-title mt-2">{t.week.title}</h1>

      <section className="mt-4 rounded-card bg-card p-4">
        <Quilt rows={rows} label={t.week.quiltLabel} />
      </section>

      {insights.map((i) => (
        <section key={i.id} className="mt-3 rounded-card bg-move-soft p-4">
          <p className="t-body-strong">{i.text}</p>
          <p className="t-caption mt-1 text-muted-foreground">{i.caption}</p>
        </section>
      ))}

      {invitation && (
        <section className="mt-3 rounded-card bg-feeling-soft p-4" aria-labelledby="invite-title">
          <div className="flex items-start justify-between gap-2">
            <p id="invite-title" className="t-overline flex items-center gap-1.5 text-foreground">
              <Sparkles aria-hidden className="h-3.5 w-3.5" />
              {t.week.invitationOverline}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={t.week.moreOptions}
                className="-mr-2 -mt-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-card/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <MoreHorizontal aria-hidden className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl bg-card">
                <DropdownMenuItem onClick={never} className="min-h-11">
                  {t.week.dontAsk}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="t-body-l mt-1">
            {invitation.pattern} {invitation.body}
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={tellMore}>
              {t.week.tellMore}
            </Button>
            <Button size="sm" variant="outline" onClick={notNow}>
              {t.week.notNow}
            </Button>
          </div>
        </section>
      )}

      {settings.weightTracking && !settings.fasting.excluded && (
        <div className="mt-3">
          <WeightCard settings={settings} />
        </div>
      )}

      {envelopes.length > 0 && (
        <section className="mt-6" aria-labelledby="envelopes">
          <div className="flex items-center justify-between">
            <Overline as="h2">
              <span id="envelopes">{t.week.envelopes}</span>
            </Overline>
            {settings.glucoseComfort === "numbers" && (
              <Link to="/glucose/numbers" className="t-label inline-flex min-h-11 items-center text-primary">
                {t.week.seeNumbers}
              </Link>
            )}
          </div>
          <ul className="mt-2 space-y-2">
            {envelopes.slice(0, 20).map((r) => {
              const n = readings.indexOf(r) + 1;
              const sealed = r.state === "sealed";
              let meta: React.ReactNode = sealed ? t.week.sealed : t.week.opened;
              if (!sealed && shows && r.valueMgdl != null) {
                const band = classifyReading(r.valueMgdl, settings.targetRange).band;
                const label = t.reading.labels[bandLabelKey(r.valueMgdl, settings.targetRange)];
                meta = (
                  <span className="inline-flex items-center gap-1.5">
                    <BandDot band={band} />
                    {settings.glucoseComfort === "numbers" ? `${formatGlucose(r.valueMgdl, settings.unit)} ${settings.unit} · ${label}` : label}
                  </span>
                );
              }
              return (
                <li key={r.id}>
                  <TimelineItem
                    kind="envelope"
                    title={t.week.envelope(n)}
                    meta={meta}
                    time={fmtDayTime(r.at)}
                    onClick={() => navigate(sealed ? `/glucose/sealed/${r.id}` : `/glucose/reading/${r.id}`)}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </TabScreen>
  );
}
