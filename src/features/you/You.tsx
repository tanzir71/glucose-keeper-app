import { useEffect, useState, type ReactNode } from "react";
import { ChevronRight, Clock, Download, Heart, Leaf, Mail, Moon, Ruler, Scale, ShieldCheck, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Chip } from "@/components/keeper/Chip";
import { Overline, Segmented } from "@/components/keeper/Controls";
import { TabScreen } from "@/components/keeper/Layout";
import { TILE_KINDS } from "@/components/keeper/kinds";
import { deleteAllData } from "@/lib/db";
import { dailyReminderIcs } from "@/lib/ics";
import { shareOrDownload } from "@/lib/export";
import { formatGlucose } from "@/lib/clinical/thresholds";
import { updateSettings, useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { t } from "@/copy/en";

function Row({ to, icon, title, value }: { to: string; icon: ReactNode; title: string; value?: string }) {
  return (
    <Link to={to} className="flex min-h-14 items-center gap-3 rounded-[20px] bg-card px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-primary-soft text-primary-strong">{icon}</span>
      <span className="flex-1">
        <span className="t-body-strong block">{title}</span>
        {value && <span className="t-caption text-muted-foreground">{value}</span>}
      </span>
      <ChevronRight aria-hidden className="h-5 w-5 text-muted-foreground" />
    </Link>
  );
}

/** You tab (undesigned; C1 radio and settings-card patterns). */
export default function You() {
  const settings = useSettings();
  const navigate = useNavigate();
  const [name, setName] = useState<string>();
  const [confirm, setConfirm] = useState(false);
  const [reminder, setReminder] = useState("20:00");

  useEffect(() => {
    if (settings && name === undefined) setName(settings.name ?? "");
    if (settings?.reminderTime) setReminder(settings.reminderTime);
  }, [settings, name]);

  if (!settings) return <TabScreen>{null}</TabScreen>;

  const range = `${formatGlucose(settings.targetRange.lowMgdl, settings.unit)}–${formatGlucose(settings.targetRange.highMgdl, settings.unit)} ${settings.unit}`;
  const track = settings.fasting.track;

  const addReminder = async () => {
    await updateSettings({ reminderTime: reminder });
    const ics = dailyReminderIcs(reminder, new Date(), `daily-${reminder.replace(":", "")}`);
    await shareOrDownload(new Blob([ics], { type: "text/calendar" }), "keeper-reminder.ics", t.you.reminderSummary);
  };

  const wipe = async () => {
    await deleteAllData();
    setConfirm(false);
    toast(t.you.deleted);
    navigate("/welcome", { replace: true });
  };

  return (
    <TabScreen>
      <h1 className="t-title mt-2">{t.you.title}</h1>

      <section className="mt-4 rounded-card bg-card p-4">
        <label htmlFor="you-name" className="t-label text-muted-foreground">
          {t.you.name}
        </label>
        <Input
          id="you-name"
          value={name ?? ""}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => updateSettings({ name: name?.trim() || undefined })}
          placeholder={t.you.namePlaceholder}
          autoComplete="given-name"
          className="mt-2 h-11 rounded-full bg-background"
        />
      </section>

      <div className="mt-4 space-y-2">
        <Row to="/glucose/comfort" icon={<Mail aria-hidden className="h-5 w-5" />} title={t.you.sections.comfort} value={t.comfort.labels[settings.glucoseComfort]} />
        <Row to="/you/habits" icon={<Leaf aria-hidden className="h-5 w-5" />} title={t.you.sections.habits} value={settings.tinyHabits ? t.you.habitsOn : t.you.habitsOff} />
        <Row to="/you/rhythm" icon={<Clock aria-hidden className="h-5 w-5" />} title={t.you.sections.rhythm} value={settings.rhythm ? t.you.rhythmSet : t.you.rhythmUnset} />
        <Row
          to="/you/fasting"
          icon={<Moon aria-hidden className="h-5 w-5" />}
          title={t.you.sections.fasting}
          value={track ? t.you.fastingOn(t.fasting.trackNames[track]) : t.you.fastingOff}
        />
        <Row to="/you/range" icon={<Ruler aria-hidden className="h-5 w-5" />} title={t.you.sections.range} value={range} />
        {!settings.fasting.excluded && (
          <Row to="/you/weight" icon={<Scale aria-hidden className="h-5 w-5" />} title={t.you.sections.weight} value={settings.weightTracking ? t.you.habitsOn : t.you.habitsOff} />
        )}
        <Row to="/you/export" icon={<Download aria-hidden className="h-5 w-5" />} title={t.you.sections.export} />
      </div>

      <section className="mt-4 rounded-card bg-card p-4">
        <Overline as="h2">{t.you.sections.easy}</Overline>
        <div className="mt-3 flex flex-wrap gap-2">
          {TILE_KINDS.map((k) => (
            <Chip
              key={k}
              selected={settings.easyKinds.includes(k)}
              onClick={() =>
                updateSettings({
                  easyKinds: settings.easyKinds.includes(k) ? settings.easyKinds.filter((x) => x !== k) : TILE_KINDS.filter((x) => x === k || settings.easyKinds.includes(x)),
                })
              }
            >
              {t.kindChips[k]}
            </Chip>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-card bg-card p-4">
        <Overline as="h2">{t.you.sections.units}</Overline>
        <p className="t-caption mt-1 text-muted-foreground">{t.you.unitsBody}</p>
        <Segmented
          className="mt-3"
          label={t.you.sections.units}
          value={settings.unit}
          onChange={(u) => updateSettings({ unit: u })}
          options={[
            { value: "mmol/L", label: "mmol/L" },
            { value: "mg/dL", label: "mg/dL" },
          ]}
        />
      </section>

      <section className="mt-4 rounded-card bg-card p-4">
        <Overline as="h2">{t.you.sections.reminder}</Overline>
        <p className="t-caption mt-1 text-muted-foreground">{t.you.reminderBody}</p>
        <div className="mt-3 flex gap-2">
          <Input type="time" aria-label={t.you.reminderTime} value={reminder} onChange={(e) => setReminder(e.target.value)} className="h-11 w-32 rounded-full bg-background" />
          <Button variant="outline" onClick={addReminder} disabled={!reminder}>
            {t.you.reminderButton}
          </Button>
        </div>
      </section>

      <section className="mt-4 rounded-card bg-card p-4">
        <h2 className="t-body-strong">{t.you.feedback}</h2>
        <p className="t-caption mt-1 text-muted-foreground">{t.you.feedbackBody}</p>
        <a href={`mailto:?subject=${encodeURIComponent(t.week.feedbackSubject)}`} className="t-label mt-2 inline-flex min-h-11 items-center gap-1.5 text-primary">
          <Mail aria-hidden className="h-4 w-4" /> {t.week.feedbackNote}
        </a>
      </section>

      <section className="mt-4 rounded-card bg-card p-4">
        <h2 className="t-body-strong flex items-center gap-2">
          <ShieldCheck aria-hidden className="h-4 w-4" /> {t.you.sections.about}
        </h2>
        <p className="t-body mt-2 text-muted-foreground">{t.you.about}</p>
        <p className="t-caption mt-2 flex items-center gap-1.5 text-muted-foreground">
          <Heart aria-hidden className="h-3.5 w-3.5" /> {t.welcome.privacy}
        </p>
        <p className="t-caption mt-1 text-muted-foreground">{t.you.version(__APP_VERSION__)}</p>
      </section>

      <section className="mt-4">
        <Button variant="outline" size="lg" onClick={() => setConfirm(true)} className={cn("text-safety")}>
          <Trash2 aria-hidden /> {t.you.sections.delete}
        </Button>
        <p className="t-caption mt-2 text-center text-muted-foreground">{t.you.deleteBody}</p>
      </section>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-card-lg bg-card sm:max-w-[400px]">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="t-heading">{t.you.deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription className="t-body">{t.you.deleteConfirmBody}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
            <AlertDialogAction className="h-[54px] w-full bg-safety text-safety-foreground hover:bg-safety/90" onClick={wipe}>
              {t.you.deleteConfirm}
            </AlertDialogAction>
            <AlertDialogCancel className="mt-0 h-11 w-full border-0 bg-transparent text-primary">{t.common.cancel}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TabScreen>
  );
}

