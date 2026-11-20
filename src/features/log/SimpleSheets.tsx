// Sleep, Feeling, Move, Water and Medicines sheets: undesigned, built on the B2 pattern.
// Each saves in ≤ 3 taps.
import { useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/keeper/Sheet";
import { Chip } from "@/components/keeper/Chip";
import { FaceGroup } from "@/components/keeper/FaceOption";
import { Overline, Segmented, Stepper, Toggle } from "@/components/keeper/Controls";
import { fmtTime } from "@/lib/format";
import { t } from "@/copy/en";
import type { Drink, FeelingData, MedicinesData, Mood, MoveData, MoveType, SleepData, WaterData } from "@/types/domain";
import type { SheetProps } from "./LogSheet";
import { ChangeTime } from "./TimeField";

function Frame({
  title,
  at,
  setAt,
  canSave = true,
  onSave,
  onDelete,
  onClose,
  children,
}: {
  title: string;
  at: Date;
  setAt: (d: Date) => void;
  canSave?: boolean;
  onSave: () => void;
  onDelete?: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Sheet
      onClose={onClose}
      title={`${title} · ${fmtTime(at)}`}
      headerRight={<ChangeTime at={at} onChange={setAt} />}
      footer={
        <div className="space-y-2">
          <Button size="lg" onClick={onSave} disabled={!canSave}>
            {t.common.save}
          </Button>
          {onDelete && (
            <Button size="lg" variant="ghost" onClick={onDelete}>
              <Trash2 aria-hidden /> {t.common.deleteEntry}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-5">{children}</div>
    </Sheet>
  );
}

const useAt = (iso?: string) => useState(() => (iso ? new Date(iso) : new Date()));

export function SleepSheet({ initial, onSave, onDelete, onClose }: SheetProps<SleepData>) {
  const [at, setAt] = useAt(initial?.at);
  const [hours, setHours] = useState(initial?.data.hours ?? 7);
  const [quality, setQuality] = useState<SleepData["quality"]>(initial?.data.quality);
  // Quality faces reuse the mood faces: rested · okay · poor.
  const faceOf: Record<NonNullable<SleepData["quality"]>, Mood> = { rested: "good", okay: "okay", poor: "low" };
  const qualityOf: Record<Mood, NonNullable<SleepData["quality"]>> = { good: "rested", okay: "okay", low: "poor" };
  return (
    <Frame title={t.sleep.title} at={at} setAt={setAt} onSave={() => onSave({ kind: "sleep", hours, quality }, at)} onDelete={onDelete} onClose={onClose}>
      <div>
        <Overline as="h3">{t.sleep.hours}</Overline>
        <div className="mt-2">
          <Stepper value={hours} onChange={setHours} step={0.5} min={0} max={16} format={t.sleep.hoursValue} label={t.sleep.hours} />
        </div>
      </div>
      <div>
        <Overline as="h3">{t.sleep.quality}</Overline>
        <div className="mt-2">
          <FaceGroup
            options={["low", "okay", "good"] as const}
            value={quality ? faceOf[quality] : undefined}
            onChange={(m) => setQuality(m ? qualityOf[m] : undefined)}
            label={t.sleep.quality}
            labels={{ low: t.sleep.qualities.poor, okay: t.sleep.qualities.okay, good: t.sleep.qualities.rested }}
          />
        </div>
      </div>
    </Frame>
  );
}

const FEELING_TAGS = Object.keys(t.feeling.tags);

export function FeelingSheet({ initial, onSave, onDelete, onClose }: SheetProps<FeelingData>) {
  const [at, setAt] = useAt(initial?.at);
  const [mood, setMood] = useState<Mood | undefined>(initial?.data.mood);
  const [tags, setTags] = useState<string[]>(initial?.data.tags ?? []);
  const toggle = (x: string) => setTags((ts) => (ts.includes(x) ? ts.filter((y) => y !== x) : [...ts, x]));
  return (
    <Frame
      title={t.kinds.feeling}
      at={at}
      setAt={setAt}
      canSave={!!mood}
      onSave={() => mood && onSave({ kind: "feeling", mood, tags: tags.length ? tags : undefined }, at)}
      onDelete={onDelete}
      onClose={onClose}
    >
      <div>
        <Overline as="h3">{t.feeling.title}</Overline>
        <div className="mt-2">
          <FaceGroup options={["low", "okay", "good"] as const} value={mood} onChange={setMood} label={t.feeling.title} labels={t.moods} />
        </div>
      </div>
      <div>
        <Overline as="h3">{t.feeling.tagsTitle}</Overline>
        <div className="mt-2 flex flex-wrap gap-2">
          {FEELING_TAGS.map((x) => (
            <Chip key={x} selected={tags.includes(x)} onClick={() => toggle(x)}>
              {t.feeling.tags[x]}
            </Chip>
          ))}
        </div>
      </div>
    </Frame>
  );
}

const MOVE_TYPES: MoveType[] = ["walk", "stairs", "desk-moves", "calf-raises", "stand", "other"];

export function MoveSheet({ initial, onSave, onDelete, onClose }: SheetProps<MoveData>) {
  const [at, setAt] = useAt(initial?.at);
  const [type, setType] = useState<MoveType | undefined>(initial?.data.type);
  const [minutes, setMinutes] = useState(initial?.data.minutes ?? 10);
  return (
    <Frame
      title={t.move.title}
      at={at}
      setAt={setAt}
      canSave={!!type}
      onSave={() => type && onSave({ ...(initial?.data ?? {}), kind: "move", type, minutes }, at)}
      onDelete={onDelete}
      onClose={onClose}
    >
      <div>
        <Overline as="h3">{t.move.type}</Overline>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t.move.type}>
          {MOVE_TYPES.map((x) => (
            <Chip key={x} role="radio" selected={type === x} onClick={() => setType(x)}>
              {t.moveTypes[x]}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <Overline as="h3">{t.move.minutes}</Overline>
        <div className="mt-2">
          <Stepper value={minutes} onChange={setMinutes} step={5} min={1} max={240} format={t.move.minutesValue} label={t.move.minutes} />
        </div>
      </div>
    </Frame>
  );
}

export function WaterSheet({ initial, onSave, onDelete, onClose }: SheetProps<WaterData>) {
  const [at, setAt] = useAt(initial?.at);
  const [glasses, setGlasses] = useState(initial?.data.glasses ?? 1);
  const [drink, setDrink] = useState<Drink>(initial?.data.drink ?? "water");
  return (
    <Frame title={t.water.title} at={at} setAt={setAt} canSave={glasses > 0} onSave={() => onSave({ kind: "water", glasses, drink }, at)} onDelete={onDelete} onClose={onClose}>
      <div>
        <Overline as="h3">{t.water.glasses}</Overline>
        <div className="mt-2">
          <Stepper value={glasses} onChange={setGlasses} min={1} max={20} format={(n) => String(n)} label={t.water.glasses} />
        </div>
      </div>
      <div>
        <Overline as="h3">{t.water.drink}</Overline>
        <Segmented
          className="mt-2"
          label={t.water.drink}
          value={drink}
          onChange={setDrink}
          options={(["water", "tea", "coffee"] as const).map((d) => ({ value: d, label: t.water.drinks[d] }))}
        />
      </div>
    </Frame>
  );
}

export function MedicinesSheet({ initial, onSave, onDelete, onClose }: SheetProps<MedicinesData>) {
  const [at, setAt] = useAt(initial?.at);
  const [taken, setTaken] = useState(initial?.data.taken ?? true);
  return (
    <Frame title={t.medicines.title} at={at} setAt={setAt} onSave={() => onSave({ kind: "medicines", taken }, at)} onDelete={onDelete} onClose={onClose}>
      <p className="t-body text-muted-foreground">{t.medicines.body}</p>
      <div className="flex items-center justify-between rounded-card bg-card p-4">
        <span className="t-body-strong">{t.medicines.taken}</span>
        <Toggle checked={taken} onCheckedChange={setTaken} label={t.medicines.taken} />
      </div>
    </Frame>
  );
}
