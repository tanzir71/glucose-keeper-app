import { useEffect, useState } from "react";
import { Clock, Heart, Lock, Moon, Sunrise } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Overline, Segmented } from "@/components/keeper/Controls";
import { BackHeader, FlowScreen } from "@/components/keeper/Layout";
import { DEFAULT_WINDOW_START, eatingWindow, needsSafetyCheck, windowFitsRhythm } from "@/lib/rules/fasting";
import { updateSettings, useSettings } from "@/lib/settings";
import { fmtHM } from "@/lib/format";
import { cn } from "@/lib/utils";
import { t } from "@/copy/en";
import type { FastTrack } from "@/types/domain";

type Choice = "overnight-12" | "window" | "ramadan" | "doctor-plan";
const WINDOW_TRACKS = ["window-13", "window-14", "window-16"] as const;

/** C1 Fasting mode (Figma 21:501), behind the one-question exclusion check (05 §4.2). */
export default function FastingMode() {
  const settings = useSettings();
  const navigate = useNavigate();
  const [choice, setChoice] = useState<Choice>("overnight-12");
  const [windowTrack, setWindowTrack] = useState<(typeof WINDOW_TRACKS)[number]>("window-13");
  const [start, setStart] = useState<string>();

  useEffect(() => {
    const tr = settings?.fasting.track;
    if (!tr || start !== undefined) return;
    if (tr.startsWith("window-")) {
      setChoice("window");
      setWindowTrack(tr as (typeof WINDOW_TRACKS)[number]);
    } else setChoice(tr as Choice);
    setStart(settings.fasting.windowStart);
  }, [settings, start]);

  if (!settings) return <FlowScreen>{null}</FlowScreen>;
  const f = settings.fasting;

  // Exclusion check, shown once. Only yes/no is stored, never which item applied.
  if (!f.exclusionAsked) {
    const answer = (excluded: boolean) => updateSettings({ fasting: { ...f, exclusionAsked: true, excluded } });
    return (
      <FlowScreen
        footer={
          <>
            <Button size="lg" onClick={() => answer(false)}>
              {t.fasting.exclusionNone}
            </Button>
            <Button size="lg" variant="outline" onClick={() => answer(true)}>
              {t.fasting.exclusionSome}
            </Button>
          </>
        }
      >
        <BackHeader label={t.fasting.back} to="/you" />
        <h1 className="t-title">{t.fasting.exclusionTitle}</h1>
        <p className="t-body mt-2 text-muted-foreground">{t.fasting.exclusionSub}</p>
        <ul className="mt-5 space-y-2">
          {t.fasting.exclusionItems.map((x) => (
            <li key={x} className="t-body-l rounded-card bg-card p-4">
              {x}
            </li>
          ))}
        </ul>
      </FlowScreen>
    );
  }

  const excluded = !!f.excluded;
  const track: FastTrack = choice === "window" ? windowTrack : choice;
  const coached = choice === "overnight-12" || choice === "window";
  const win = coached ? eatingWindow(track, start ?? DEFAULT_WINDOW_START[track as keyof typeof DEFAULT_WINDOW_START]) : null;
  const fits = !win || windowFitsRhythm(win.open, win.close, settings.rhythm);

  const cont = async () => {
    if (choice === "doctor-plan") return navigate("/you/fasting/doctor");
    // Anything beyond the gentle 12 h (including Ramadan) goes through the safety check first.
    if (needsSafetyCheck(track)) return navigate(`/you/fasting/safety?track=${track}${start ? `&start=${start}` : ""}`);
    await updateSettings({ fasting: { ...f, track, windowStart: win?.open } });
    navigate("/", { replace: true });
  };
  const off = async () => {
    await updateSettings({ fasting: { ...f, track: undefined } });
    toast(t.fasting.turnedOff);
    navigate("/you", { replace: true });
  };

  const card = (c: Choice, icon: JSX.Element, title: string, body: string, opts: { disabled?: boolean; pill?: string; locked?: boolean } = {}) => {
    const selected = choice === c;
    return (
      <button
        type="button"
        role={opts.locked ? undefined : "radio"}
        aria-checked={opts.locked ? undefined : selected}
        aria-label={`${title}. ${body}`}
        aria-disabled={opts.disabled}
        onClick={() => {
          if (opts.disabled) return;
          // Keeper never suggests longer fasts: this only opens the doctor's-plan form.
          if (opts.locked) return navigate("/you/fasting/doctor");
          setChoice(c);
        }}
        className={cn(
          "flex w-full items-start gap-3 rounded-card p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          opts.disabled || opts.locked ? "bg-muted text-muted-foreground" : "bg-card",
          selected ? "border-[1.5px] border-primary" : "border-[1.5px] border-transparent",
        )}
      >
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]", opts.disabled || opts.locked ? "bg-card" : "bg-sleep-soft")}>{icon}</span>
        <span className="flex-1">
          <span className="t-body-strong block text-foreground">{title}</span>
          <span className="t-caption block">{body}</span>
          {opts.pill && <span className="t-caption mt-2 inline-block rounded-full bg-primary-soft px-2.5 py-1 font-semibold text-primary-strong">{opts.pill}</span>}
        </span>
        {!opts.disabled && !opts.locked && (
          <span aria-hidden className={cn("mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2", selected ? "border-primary" : "border-border")}>
            {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
          </span>
        )}
      </button>
    );
  };

  return (
    <FlowScreen
      footer={
        <>
          <Button size="lg" onClick={cont} disabled={!fits}>
            {t.fasting.continue}
          </Button>
          {f.track && (
            <Button size="lg" variant="ghost" onClick={off}>
              {t.fasting.turnOff}
            </Button>
          )}
        </>
      }
    >
      <BackHeader label={t.fasting.back} to="/you" />
      <h1 className="t-title">{t.fasting.title}</h1>
      <p className="t-body mt-2 text-muted-foreground">{t.fasting.sub}</p>

      {excluded && (
        <section className="mt-4 rounded-card bg-safety p-4 text-safety-foreground">
          <h2 className="t-body-strong">{t.fasting.excludedTitle}</h2>
          <p className="t-body mt-1">{t.fasting.excludedBody}</p>
          <p className="t-caption mt-2 text-safety-foreground/85">{t.fasting.excludedStill}</p>
          <Button asChild variant="safety" size="sm" className="mt-3">
            <Link to="/you/export">{t.fasting.talkToTeam}</Link>
          </Button>
        </section>
      )}

      <div role="radiogroup" aria-label={t.fasting.title} className="mt-4 space-y-3">
        {card("overnight-12", <Moon aria-hidden className="h-5 w-5" />, t.fasting.tracks["overnight-12"].title, t.fasting.tracks["overnight-12"].body, { pill: t.fasting.recommended })}
        {card("window", <Clock aria-hidden className="h-5 w-5" />, t.fasting.tracks.window.title, t.fasting.tracks.window.body, { disabled: excluded })}
        {choice === "window" && !excluded && (
          <div className="rounded-card bg-card p-4">
            <Overline as="h2">{t.fasting.windowChoose}</Overline>
            <Segmented
              className="mt-2"
              label={t.fasting.windowChoose}
              value={windowTrack}
              onChange={setWindowTrack}
              options={WINDOW_TRACKS.map((w) => ({ value: w, label: t.fasting.trackNames[w] }))}
            />
          </div>
        )}
        {card("ramadan", <Sunrise aria-hidden className="h-5 w-5" />, t.fasting.tracks.ramadan.title, t.fasting.tracks.ramadan.body)}
        {card("doctor-plan", <Lock aria-hidden className="h-5 w-5" />, t.fasting.tracks["doctor-plan"].title, t.fasting.tracks["doctor-plan"].body, { disabled: excluded, locked: true })}
      </div>

      {win && (
        <section className="mt-3 rounded-card bg-card p-4">
          <label htmlFor="window-start" className="t-label text-muted-foreground">
            {t.fasting.windowStart}
          </label>
          <Input id="window-start" type="time" value={win.open} onChange={(e) => setStart(e.target.value)} className="mt-2 h-11 w-36 rounded-full bg-background" />
          <p className="t-caption mt-2 text-muted-foreground">
            {fits ? `${t.fasting.windowLine(fmtHM(win.open), fmtHM(win.close))} · ${t.fasting.windowStartHint}` : t.fasting.windowInvalid}
          </p>
        </section>
      )}


      <p className="t-caption mt-4 flex items-start gap-2 rounded-card bg-card p-4 text-muted-foreground">
        <Heart aria-hidden className="mt-0.5 h-4 w-4 shrink-0" /> {t.fasting.exclusionsNote}
      </p>

      <section className="mb-4 mt-4">
        <Overline as="h2">{t.fasting.askTitle}</Overline>
        <ul className="mt-2 space-y-2">
          {Object.entries(t.fasting.ask).map(([id, c]) => (
            <li key={id}>
              <Link to={`/learn/ask-${id}`} className="t-body-strong flex min-h-11 items-center rounded-[20px] bg-feeling-soft px-4 py-3">
                {c.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </FlowScreen>
  );
}
