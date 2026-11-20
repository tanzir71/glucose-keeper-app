import { useState } from "react";
import { Download, Plus } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BackHeader, FlowScreen } from "@/components/keeper/Layout";
import { db } from "@/lib/db";
import { useAllReadings } from "@/lib/data";
import { localDay } from "@/lib/rules/time";
import { useSettings } from "@/lib/settings";
import { t } from "@/copy/en";
import { DayChart, DaySelector, ReadingRows, Stats } from "./NumbersParts";

/** Numbers view (ladder step 6): the restyled v1 chart, stats, list and export. */
export default function Numbers() {
  const settings = useSettings();
  const readings = useAllReadings();
  const navigate = useNavigate();
  const [day, setDay] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [confirm, setConfirm] = useState<string | null>(null);

  if (!settings || !readings) return <FlowScreen>{null}</FlowScreen>;
  if (settings.glucoseComfort !== "numbers") return <Navigate to="/glucose/comfort" replace />;

  const key = localDay(day);
  const dayReadings = readings.filter((r) => localDay(r.at) === key);
  const opened = dayReadings.filter((r) => r.state === "opened" && r.valueMgdl != null);

  return (
    <FlowScreen>
      <BackHeader label={t.tabs.week} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="t-title">{t.numbers.title}</h1>
          <p className="t-body mt-1 text-muted-foreground">{t.numbers.sub}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <DaySelector date={day} onChange={setDay} />
        <Stats readings={opened} unit={settings.unit} range={settings.targetRange} />
        <DayChart readings={opened} unit={settings.unit} range={settings.targetRange} />
        <ReadingRows
          readings={dayReadings}
          unit={settings.unit}
          range={settings.targetRange}
          onDelete={setConfirm}
          onOpen={(r) => navigate(r.state === "sealed" ? `/glucose/sealed/${r.id}` : `/glucose/reading/${r.id}`)}
        />
      </div>

      <div className="mb-6 mt-5 grid grid-cols-2 gap-3">
        <Button asChild variant="default">
          <Link to="/glucose/check">
            <Plus aria-hidden /> {t.numbers.add}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/you/export">
            <Download aria-hidden /> {t.numbers.export}
          </Link>
        </Button>
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-card-lg bg-card sm:max-w-[400px]">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="t-heading">{t.numbers.deleteConfirm}</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
            <AlertDialogAction
              className="h-[54px] w-full"
              onClick={async () => {
                if (confirm) await db.readings.delete(confirm);
                setConfirm(null);
              }}
            >
              {t.numbers.delete}
            </AlertDialogAction>
            <AlertDialogCancel className="mt-0 h-11 w-full border-0 bg-transparent text-primary">{t.common.cancel}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FlowScreen>
  );
}
