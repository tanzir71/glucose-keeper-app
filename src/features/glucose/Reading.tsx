import { useState } from "react";
import { ChevronRight, Eye, EyeOff, Leaf, ShieldCheck, Utensils } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Overline } from "@/components/keeper/Controls";
import { BackHeader, FlowScreen } from "@/components/keeper/Layout";
import { RangeBar } from "@/components/keeper/RangeBar";
import { bandLabelKey, formatGlucose } from "@/lib/clinical/thresholds";
import { useSettings } from "@/lib/settings";
import { t } from "@/copy/en";
import type { HabitId } from "@/types/domain";
import { useReading } from "./useReading";

/** D5 Opened · ranges (Figma 16:657). The number stays behind "Show the number". */
export default function Reading() {
  const { id } = useParams();
  const navigate = useNavigate();
  const settings = useSettings();
  const view = useReading(id);
  const [show, setShow] = useState(false);

  if (view === undefined || !settings) return <FlowScreen>{null}</FlowScreen>;
  if (view === null) return <Navigate to="/week" replace />;
  const { reading, n, context, meal } = view;
  if (reading.state === "sealed") return <Navigate to={`/glucose/sealed/${reading.id}`} replace />;

  const v = reading.valueMgdl;
  const numbers = settings.glucoseComfort === "numbers";
  const label = v != null ? t.reading.labels[bandLabelKey(v, settings.targetRange)] : "";
  const slot = meal?.data.slot ? t.slots[meal.data.slot] : undefined;
  // "A big lunch can lift it for a while" only fits when it's above range after a big meal.
  const bigMealAbove = meal?.data.size === "big" && v != null && v > settings.targetRange.highMgdl;

  // Only tiny habits that are on, plus veggies-first.
  const helps: { key: string; icon: JSX.Element; text: string; tone: string }[] = [];
  const order: HabitId[] =
    settings.rhythm?.workday === "desk" ? ["calf-raises", "stairs-stroll", "desk-moves", "stroll"] : ["stroll", "hallway-laps", "stand"];
  const habit = settings.tinyHabits ? order.find((h) => settings.habitsEnabled.includes(h)) : undefined;
  if (habit)
    helps.push({
      key: habit,
      icon: <Leaf aria-hidden className="h-5 w-5" />,
      text: habit === "stroll" ? t.reading.helpStroll(slot) : t.reading.helpHabit(t.habits[habit].title, slot),
      tone: "bg-move-soft",
    });
  helps.push({ key: "veggies", icon: <Utensils aria-hidden className="h-5 w-5" />, text: t.reading.helpVeggies, tone: "bg-meal-soft" });

  return (
    <FlowScreen
      footer={
        <Button size="lg" onClick={() => navigate("/", { replace: true })}>
          {t.reading.backToDay}
        </Button>
      }
    >
      <BackHeader label={t.reading.back(n, context)} />
      <h1 className="t-title">{t.reading.title}</h1>

      {v == null ? (
        <p className="t-body-l mt-4">{t.sealed.unreadOpen}</p>
      ) : (
        <>
          {(numbers || show) && (
            <p className="mt-4 flex items-baseline gap-2" aria-live="polite">
              <span className="t-number">{formatGlucose(v, settings.unit)}</span>
              <span className="t-body text-muted-foreground">{settings.unit}</span>
            </p>
          )}
          <section className="mt-4 rounded-card bg-card p-5">
            <RangeBar valueMgdl={v} range={settings.targetRange} label={label} />
            <h2 className="t-heading mt-4 text-center">{label}</h2>
          </section>

          {reading.safety !== "none" && reading.safety !== "unknown" && (
            <Link
              to={`/glucose/safety/${reading.id}`}
              className="mt-3 flex min-h-11 items-center gap-3 rounded-card bg-safety px-4 py-3 text-safety-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ShieldCheck aria-hidden className="h-5 w-5" />
              <span className="t-body-strong flex-1">{reading.safety === "low" ? t.safety.lowTitle : t.safety.highTitle}</span>
              <ChevronRight aria-hidden className="h-5 w-5" />
            </Link>
          )}

          <p className="t-body-l mt-5">{bigMealAbove ? t.reading.body : t.reading.bodyGeneric}</p>

          <Overline as="h2" className="mt-5">
            {t.reading.helpTitle}
          </Overline>
          <ul className="mt-2 space-y-2">
            {helps.map((h) => (
              <li key={h.key} className="flex items-center gap-3 rounded-card bg-card p-4">
                <span className={`flex h-10 w-10 items-center justify-center rounded-[14px] ${h.tone}`}>{h.icon}</span>
                <span className="t-body-strong">{h.text}</span>
              </li>
            ))}
          </ul>

          {!numbers && (
            <Button variant="ghost" className="-ml-3 mt-3 text-muted-foreground" aria-pressed={show} onClick={() => setShow((s) => !s)}>
              {show ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
              {show ? t.reading.hide : t.reading.show}
            </Button>
          )}
        </>
      )}
    </FlowScreen>
  );
}
