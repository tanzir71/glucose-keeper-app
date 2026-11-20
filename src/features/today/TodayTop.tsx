import { Link } from "react-router-dom";
import { User } from "lucide-react";
import { PatchStrip, type QuiltPatch } from "@/components/keeper/Visuals";
import { fmtDayOverline } from "@/lib/format";
import { partOfDay } from "@/lib/rules/time";
import { t } from "@/copy/en";
import type { FastSession, Settings } from "@/types/domain";

export function DateAvatar({ now, settings }: { now: Date; settings: Settings }) {
  const initial = settings.name?.trim()?.[0]?.toUpperCase();
  return (
    <div className="flex items-center justify-between">
      <p className="t-overline text-muted-foreground">{fmtDayOverline(now)}</p>
      <Link
        to="/you"
        aria-label={t.tabs.you}
        className="-mr-1.5 flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="t-label flex h-8 w-8 items-center justify-center rounded-full bg-feeling-soft text-foreground">
          {initial ?? <User aria-hidden className="h-4 w-4" />}
        </span>
      </Link>
    </div>
  );
}

/** The top of Today: date, greeting, patch strip. Fasting and Ramadan replace it (C3/C4). */
export function TodayTop({
  settings,
  now,
  patches,
  count,
}: {
  settings: Settings;
  now: Date;
  activeFast?: FastSession;
  patches: QuiltPatch[];
  count: number;
}) {
  return (
    <header>
      <DateAvatar now={now} settings={settings} />
      <h1 className="t-title mt-2">{t.today.greeting(partOfDay(now), settings.name?.trim() || undefined)}</h1>
      <div className="mt-3 flex items-center gap-3">
        {count > 0 && <PatchStrip patches={patches} />}
        <p className="t-caption text-muted-foreground">{t.today.patches(count)}</p>
      </div>
    </header>
  );
}
