import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/keeper/Chip";
import { FaceGroup } from "@/components/keeper/FaceOption";
import { Overline } from "@/components/keeper/Controls";
import { CloseHeader, FlowScreen } from "@/components/keeper/Layout";
import { db } from "@/lib/db";
import { addCheckIn } from "@/lib/data";
import { reachLadderStep, updateSettings, useSettings } from "@/lib/settings";
import { minutesBetween } from "@/lib/rules/time";
import { fmtDuration } from "@/lib/format";
import { t } from "@/copy/en";
import type { Energy, LogEntry, MealData } from "@/types/domain";

const ENERGIES: Energy[] = ["sleepy", "steady", "buzzy"];
const TAGS = Object.keys(t.checkin.tags);

/** B3 After-meal check-in (Figma 14:292). Never mentions glucose unless ladderStep ≥ 4. */
export default function CheckIn() {
  const { mealId } = useParams();
  const navigate = useNavigate();
  const settings = useSettings();
  const meal = useLiveQuery(() => (mealId ? db.logs.get(mealId) : undefined), [mealId]) as LogEntry<MealData> | undefined;
  const pattern = useLiveQuery(async () => {
    const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const recent = await db.checkins.where("at").aboveOrEqual(weekAgo).toArray();
    const heavy = recent.filter((c) => c.energy === "sleepy" || c.tags.includes("heavy"));
    const meals = await db.logs.bulkGet(heavy.map((c) => c.mealId));
    return { count: heavy.length, big: meals.filter((m) => m?.data.kind === "meal" && m.data.size === "big").length };
  }, []);
  const [energy, setEnergy] = useState<Energy>();
  const [tags, setTags] = useState<string[]>([]);

  if (!settings || !meal || meal.data.kind !== "meal") return <FlowScreen>{null}</FlowScreen>;

  const slot = meal.data.slot ?? "lunch";
  const mins = minutesBetween(meal.at, new Date());
  const snoozedBefore = settings.checkinSnooze?.mealId === meal.id;
  const leave = () => navigate("/", { replace: true });

  const toggle = (x: string) =>
    setTags((ts) => {
      if (x === "all-fine") return ts.includes(x) ? [] : ["all-fine"];
      const rest = ts.filter((y) => y !== "all-fine");
      return rest.includes(x) ? rest.filter((y) => y !== x) : [...rest, x];
    });

  // The pattern card shows when this check-in makes three sleepy or heavy ones this week.
  const thisCounts = energy === "sleepy" || tags.includes("heavy");
  const n = (pattern?.count ?? 0) + (thisCounts ? 1 : 0);
  const big = (pattern?.big ?? 0) + (thisCounts && meal.data.size === "big" ? 1 : 0) >= 2;
  const showPattern = thisCounts && n >= 3;

  const save = async () => {
    if (!energy) return;
    await addCheckIn({ mealId: meal.id, at: new Date().toISOString(), energy, tags });
    await reachLadderStep(2);
    leave();
  };
  const later = async () => {
    await updateSettings({ checkinSnooze: { mealId: meal.id, until: new Date(Date.now() + 30 * 60_000).toISOString() } });
    leave();
  };
  const close = async () => {
    await updateSettings((s) => ({ checkinDismissed: [...(s.checkinDismissed ?? []).slice(-19), meal.id] }));
    leave();
  };

  return (
    <FlowScreen
      footer={
        <>
          <Button size="lg" onClick={save} disabled={!energy}>
            {t.common.save}
          </Button>
          {!snoozedBefore && (
            <Button size="lg" variant="ghost" onClick={later}>
              {t.checkin.later}
            </Button>
          )}
        </>
      }
    >
      <CloseHeader overline={t.checkin.after(fmtDuration(mins), t.slots[slot])} onClose={close} />
      <h1 className="t-title">{t.checkin.title}</h1>
      <p className="t-body mt-2 text-muted-foreground">{t.checkin.sub}</p>

      <div className="mt-5">
        <FaceGroup options={ENERGIES} value={energy} onChange={setEnergy} label={t.checkin.title} labels={t.energy} />
      </div>

      <Overline as="h2" className="mt-6">
        {t.checkin.anything}
      </Overline>
      <div className="mt-2 flex flex-wrap gap-2">
        {TAGS.map((x) => (
          <Chip key={x} selected={tags.includes(x)} onClick={() => toggle(x)}>
            {t.checkin.tags[x]}
          </Chip>
        ))}
      </div>

      {showPattern && (
        <section className="mt-6 rounded-card bg-feeling-soft p-4" aria-live="polite">
          <p className="t-label flex items-center gap-1.5">
            <Sparkles aria-hidden className="h-4 w-4" />
            {t.checkin.patternTitle}
          </p>
          <p className="t-body mt-2">{t.checkin.pattern(n, big, t.slotsPlural[slot])}</p>
        </section>
      )}

      {settings.ladderStep >= 4 && (
        <p className="t-body mt-6 text-muted-foreground">
          {t.checkin.glucoseHint}{" "}
          <Link to="/glucose/check" className="font-semibold text-primary underline-offset-4 hover:underline">
            {t.checkin.glucoseHintCta}
          </Link>
        </p>
      )}
    </FlowScreen>
  );
}
