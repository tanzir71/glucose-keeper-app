import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Toggle } from "@/components/keeper/Controls";
import { BackHeader, FlowScreen } from "@/components/keeper/Layout";
import { db } from "@/lib/db";
import { ALL_HABIT_IDS, HABITS } from "@/lib/habits";
import { updateSettings, useSettings } from "@/lib/settings";
import { t } from "@/copy/en";

/** Habit library (You → Tiny habits): evidence tags, per-habit enable, reset what Keeper learned. */
export default function HabitLibrary() {
  const settings = useSettings();
  const [confirm, setConfirm] = useState(false);
  if (!settings) return <FlowScreen>{null}</FlowScreen>;

  const enabled = new Set(settings.habitsEnabled);
  const toggle = (id: (typeof ALL_HABIT_IDS)[number], on: boolean) =>
    updateSettings({ habitsEnabled: on ? ALL_HABIT_IDS.filter((h) => enabled.has(h) || h === id) : settings.habitsEnabled.filter((h) => h !== id) });

  const reset = async () => {
    await db.nudges.clear();
    setConfirm(false);
    toast(t.habitLibrary.resetDone);
  };

  return (
    <FlowScreen>
      <BackHeader label={t.tabs.you} to="/you" />
      <h1 className="t-title">{t.habitLibrary.title}</h1>
      <p className="t-body-l mt-2 text-muted-foreground">{t.habitLibrary.sub}</p>

      <section className="mt-5 flex items-center gap-3 rounded-card bg-primary-soft p-4">
        <div className="flex-1">
          <h2 className="t-body-strong">{t.habitLibrary.toggle}</h2>
          <p className="t-caption text-muted-foreground">{t.habitLibrary.toggleBody}</p>
        </div>
        <Toggle checked={settings.tinyHabits} onCheckedChange={(v) => updateSettings({ tinyHabits: v })} label={t.habitLibrary.toggle} />
      </section>

      <ul className="mt-4 space-y-3">
        {ALL_HABIT_IDS.map((id) => {
          const c = t.habits[id];
          const d = HABITS[id];
          return (
            <li key={id} className="rounded-card bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h3 className="t-body-strong">{c.title}</h3>
                  <p className="t-body mt-1 text-muted-foreground">{c.how}</p>
                </div>
                <Toggle checked={enabled.has(id)} onCheckedChange={(v) => toggle(id, v)} label={c.title} />
              </div>
              <p className="t-body mt-2">{c.why}</p>
              <p className="t-caption mt-2 flex flex-wrap items-center gap-2 text-muted-foreground">
                <span className="rounded-full bg-muted px-2 py-0.5 font-semibold text-foreground">{d.evidence}</span>
                <span>{d.source}</span>
              </p>
            </li>
          );
        })}
      </ul>

      <Button variant="outline" size="lg" className="mt-5" onClick={() => setConfirm(true)}>
        {t.habitLibrary.reset}
      </Button>
      <p className="t-caption mt-2 text-center text-muted-foreground">{t.habitLibrary.resetBody}</p>

      <section className="mb-6 mt-6 rounded-card bg-muted p-4">
        <h2 className="t-label flex items-center gap-1.5">
          <ShieldCheck aria-hidden className="h-4 w-4" /> {t.habitLibrary.safetyFooter}
        </h2>
        <p className="t-body mt-2">{t.habitSafety.body}</p>
      </section>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-card-lg bg-card sm:max-w-[400px]">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="t-heading">{t.habitLibrary.reset}</AlertDialogTitle>
            <AlertDialogDescription className="t-body">{t.habitLibrary.resetBody}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
            <AlertDialogAction className="h-[54px] w-full" onClick={reset}>
              {t.habitLibrary.reset}
            </AlertDialogAction>
            <AlertDialogCancel className="mt-0 h-11 w-full border-0 bg-transparent text-primary">{t.common.cancel}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FlowScreen>
  );
}
