import { useRef, useState } from "react";
import { Moon, Plus } from "lucide-react";
import { Chip } from "@/components/keeper/Chip";
import { Overline, Segmented, Toggle } from "@/components/keeper/Controls";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fmtHM } from "@/lib/format";
import { defaultWorkDays, deviceTimeZone } from "@/lib/rules/time";
import { t } from "@/copy/en";
import type { Rhythm, RhythmMealSlot } from "@/types/domain";

type TimeKey = "wake" | RhythmMealSlot | "sleep";
const TIME_KEYS: TimeKey[] = ["wake", "breakfast", "lunch", "tea", "dinner", "sleep"];
const DEFAULT_ANCHORS = ["morning-tea", "commute", "prayer-times", "evening-walk"];

const label = (k: TimeKey) => (k === "wake" ? t.rhythm.wake : k === "sleep" ? t.rhythm.sleep : t.slots[k]);
const getTime = (r: Rhythm, k: TimeKey) => (k === "wake" || k === "sleep" ? r[k] : r.meals?.[k]);
function setTime(r: Rhythm, k: TimeKey, v: string | undefined): Rhythm {
  if (k === "wake" || k === "sleep") return { ...r, [k]: v || undefined };
  const meals = { ...(r.meals ?? {}), [k]: v || undefined };
  return { ...r, meals };
}

/** A time chip that opens the native time picker. */
function TimeChip({ k, value, onChange }: { k: TimeKey; value?: string; onChange: (v: string | undefined) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const l = label(k);
  return (
    <label
      className={cn(
        "t-label relative inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-4 py-2.5 focus-within:ring-2 focus-within:ring-ring",
        value ? "border-[1.5px] border-primary bg-primary-soft text-primary-strong" : "border border-border bg-card text-foreground",
      )}
      onClick={(e) => {
        e.preventDefault();
        try {
          ref.current?.showPicker?.();
        } catch {
          ref.current?.focus();
        }
      }}
    >
      <span>{value ? `${l} ${fmtHM(value)}` : `${l}`}</span>
      {!value && <Plus aria-hidden className="h-3.5 w-3.5 text-muted-foreground" />}
      <input
        ref={ref}
        type="time"
        aria-label={l}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </label>
  );
}

/** A3 form, reused by You → Your rhythm (extended adds work days/hours and indoor preference). */
export function RhythmForm({ value, onChange, extended }: { value: Rhythm; onChange: (r: Rhythm) => void; extended?: boolean }) {
  const [custom, setCustom] = useState("");
  const anchors = value.anchors ?? [];
  const allAnchors = [...DEFAULT_ANCHORS, ...anchors.filter((a) => !DEFAULT_ANCHORS.includes(a))];
  const toggleAnchor = (a: string) =>
    onChange({ ...value, anchors: anchors.includes(a) ? anchors.filter((x) => x !== a) : [...anchors, a] });
  const workDays = value.workDays ?? defaultWorkDays(deviceTimeZone());

  return (
    <div className="space-y-3">
      <section className="rounded-card bg-card p-4">
        <Overline as="h2">{t.rhythm.dayMeals}</Overline>
        <div className="mt-3 flex flex-wrap gap-2">
          {TIME_KEYS.map((k) => (
            <TimeChip key={k} k={k} value={getTime(value, k)} onChange={(v) => onChange(setTime(value, k, v))} />
          ))}
        </div>
      </section>

      <section className="rounded-card bg-card p-4">
        <Overline as="h2">{t.rhythm.workdays}</Overline>
        <Segmented
          className="mt-3"
          label={t.rhythm.workdays}
          value={value.workday}
          onChange={(w) => onChange({ ...value, workday: w })}
          options={(["desk", "on-feet", "home", "shifts"] as const).map((w) => ({ value: w, label: t.rhythm.workdayOptions[w] }))}
        />
        {extended && (value.workday === "desk" || value.workday === "on-feet") && (
          <div className="mt-4 space-y-3">
            <p className="t-label text-muted-foreground">{t.rhythm.workDaysLabel}</p>
            <div className="flex flex-wrap gap-1.5">
              {t.rhythm.weekdaysShort.map((d, i) => (
                <Chip
                  key={d}
                  selected={workDays.includes(i)}
                  onClick={() =>
                    onChange({ ...value, workDays: workDays.includes(i) ? workDays.filter((x) => x !== i) : [...workDays, i].sort() })
                  }
                  className="px-3"
                >
                  {d}
                </Chip>
              ))}
            </div>
            <p className="t-label text-muted-foreground">{t.rhythm.workHours}</p>
            <div className="flex items-center gap-2">
              <Input
                type="time"
                aria-label={`${t.rhythm.workHours} start`}
                value={value.workHours?.start ?? "09:00"}
                onChange={(e) => onChange({ ...value, workHours: { start: e.target.value, end: value.workHours?.end ?? "17:00" } })}
                className="h-11 rounded-full bg-background"
              />
              <span aria-hidden>–</span>
              <Input
                type="time"
                aria-label={`${t.rhythm.workHours} end`}
                value={value.workHours?.end ?? "17:00"}
                onChange={(e) => onChange({ ...value, workHours: { start: value.workHours?.start ?? "09:00", end: e.target.value } })}
                className="h-11 rounded-full bg-background"
              />
            </div>
          </div>
        )}
      </section>

      <section className="rounded-card bg-card p-4">
        <Overline as="h2">{t.rhythm.anchors}</Overline>
        <div className="mt-3 flex flex-wrap gap-2">
          {allAnchors.map((a) => (
            <Chip key={a} selected={anchors.includes(a)} onClick={() => toggleAnchor(a)}>
              {t.rhythm.anchorOptions[a] ?? a}
            </Chip>
          ))}
        </div>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const c = custom.trim();
            if (!c) return;
            onChange({ ...value, anchors: anchors.includes(c) ? anchors : [...anchors, c] });
            setCustom("");
          }}
        >
          <Input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder={t.rhythm.addAnchorPlaceholder}
            aria-label={t.rhythm.addAnchor}
            className="h-11 rounded-full bg-background"
          />
          <Button type="submit" variant="outline" disabled={!custom.trim()}>
            {t.rhythm.add}
          </Button>
        </form>
      </section>

      <section className="flex items-center gap-3 rounded-card bg-card p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-sleep-soft">
          <Moon aria-hidden className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <div className="flex-1">
          <h2 className="t-body-strong">{t.rhythm.fastingTitle}</h2>
          <p className="t-caption text-muted-foreground">{t.rhythm.fastingBody}</p>
        </div>
        <Toggle checked={!!value.fastingDays} onCheckedChange={(v) => onChange({ ...value, fastingDays: v })} label={t.rhythm.fastingTitle} />
      </section>

      {extended && (
        <section className="flex items-center gap-3 rounded-card bg-card p-4">
          <div className="flex-1">
            <h2 className="t-body-strong">{t.rhythm.indoorTitle}</h2>
            <p className="t-caption text-muted-foreground">{t.rhythm.indoorBody}</p>
          </div>
          <Toggle checked={!!value.indoorPreferred} onCheckedChange={(v) => onChange({ ...value, indoorPreferred: v })} label={t.rhythm.indoorTitle} />
        </section>
      )}
    </div>
  );
}

export const rhythmIsEmpty = (r: Rhythm) =>
  !r.wake && !r.sleep && !Object.values(r.meals ?? {}).some(Boolean) && !r.workday && !(r.anchors?.length) && !r.fastingDays;
