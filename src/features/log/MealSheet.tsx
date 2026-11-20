import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/keeper/Sheet";
import { Chip } from "@/components/keeper/Chip";
import { FaceGroup } from "@/components/keeper/FaceOption";
import { Overline, Segmented } from "@/components/keeper/Controls";
import { db } from "@/lib/db";
import { savePhoto, usePhotoUrl } from "@/lib/photos";
import { inferSlot } from "@/lib/rules/time";
import { fmtTime } from "@/lib/format";
import { t } from "@/copy/en";
import type { Energy, MealData, MealSize, MealSlot, Plate, Settings } from "@/types/domain";
import type { SheetProps } from "./LogSheet";
import { ChangeTime } from "./TimeField";

const ENERGIES: Energy[] = ["sleepy", "steady", "buzzy"];

/** B2 Log a meal (Figma 14:213). Three taps: photo or quick pick, then Save. */
export function MealSheet({ initial, onSave, onDelete, onClose, settings }: SheetProps<MealData> & { settings: Settings }) {
  const [at, setAt] = useState(() => (initial ? new Date(initial.at) : new Date()));
  const [photoId, setPhotoId] = useState<string | undefined>(initial?.data.photoId);
  const initialPick = initial?.data.quickPick;
  const initialIsChip = !initialPick || (t.meal.quickPicks as readonly string[]).includes(initialPick);
  const [pick, setPick] = useState<string | undefined>(initialIsChip ? initialPick : undefined);
  const [typed, setTyped] = useState(!initialIsChip);
  const [text, setText] = useState(initialIsChip ? "" : initialPick ?? "");
  const [size, setSize] = useState<MealSize>(initial?.data.size ?? "regular");
  const [feeling, setFeeling] = useState<Energy | undefined>(initial?.data.feeling);
  const [plate, setPlate] = useState<Plate | undefined>(initial?.data.plate);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const photoUrl = usePhotoUrl(photoId);
  const fastingMode = !!settings.fasting.track;

  // During Ramadan, meals near maghrib are iftar and before fajr are suhoor (adhan loads lazily).
  const [ramadanSlotName, setRamadanSlotName] = useState<MealSlot | undefined>();
  useEffect(() => {
    const r = settings.fasting.ramadan;
    if (settings.fasting.track !== "ramadan" || !r?.startDate) return setRamadanSlotName(undefined);
    let alive = true;
    import("@/lib/ramadan").then((m) => {
      if (alive) setRamadanSlotName(m.ramadanSlot(at, { ...m.DEFAULT_RAMADAN, ...r }, settings.rhythm?.city ?? m.CITIES[0]));
    });
    return () => {
      alive = false;
    };
  }, [at, settings.fasting.track, settings.fasting.ramadan, settings.rhythm?.city]);
  const slot: MealSlot = useMemo(
    () => initial?.data.slot ?? ramadanSlotName ?? inferSlot(at, settings.rhythm),
    [at, initial, settings.rhythm, ramadanSlotName],
  );

  // Her recent picks join the defaults.
  const recent = useLiveQuery(async () => {
    const meals = await db.logs.where("kind").equals("meal").reverse().sortBy("at");
    const picks: string[] = [];
    for (const m of meals) {
      const p = m.data.kind === "meal" ? m.data.quickPick : undefined;
      if (p && !picks.includes(p) && !(t.meal.quickPicks as readonly string[]).includes(p)) picks.push(p);
      if (picks.length >= 4) break;
    }
    return picks;
  }, []);
  const picks = [...t.meal.quickPicks, ...(recent ?? [])];

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    try {
      const old = photoId;
      setPhotoId(await savePhoto("meal", f));
      if (old && old !== initial?.data.photoId) await db.photos.delete(old);
    } catch {
      /* an unreadable image: the quick picks still work */
    } finally {
      setBusy(false);
    }
  };

  const quickPick = (typed && text.trim()) || pick;
  const canSave = !!photoId || !!quickPick;
  const save = async () => {
    // A replaced or removed photo is deleted, never kept around.
    const oldPhoto = initial?.data.photoId;
    if (oldPhoto && oldPhoto !== photoId) await db.photos.delete(oldPhoto);
    await onSave({ kind: "meal", slot, size, feeling, quickPick, photoId, plate: fastingMode ? plate : initial?.data.plate }, at);
  };
  const close = async () => {
    // A photo taken in this sheet but never saved doesn't stay on the phone.
    if (photoId && photoId !== initial?.data.photoId) await db.photos.delete(photoId);
    onClose();
  };

  return (
    <Sheet
      onClose={close}
      title={t.meal.header(t.slots[slot], fmtTime(at))}
      headerRight={<ChangeTime at={at} onChange={setAt} />}
      footer={
        <div className="space-y-2">
          <Button size="lg" onClick={save} disabled={!canSave || busy}>
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
      <div className="space-y-5">
        {photoUrl ? (
          <div className="relative overflow-hidden rounded-card">
            <img src={photoUrl} alt={t.meal.photoAlt} className="h-44 w-full object-cover" />
            <div className="absolute bottom-2 right-2 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
                {t.meal.retake}
              </Button>
              <Button size="sm" variant="secondary" aria-label={t.meal.removePhoto} onClick={() => setPhotoId(undefined)}>
                <Trash2 aria-hidden />
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="flex w-full flex-col items-center gap-2 rounded-card bg-meal-soft px-4 py-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-card">
              <Camera aria-hidden className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <span className="t-body-strong">{busy ? t.common.loading : t.meal.snap}</span>
            <span className="t-caption text-muted-foreground">{t.meal.snapSub}</span>
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t.meal.snapSub}>
          {picks.map((p) => (
            <Chip
              key={p}
              role="radio"
              selected={!typed && pick === p}
              onClick={() => {
                setTyped(false);
                setPick(pick === p ? undefined : p);
              }}
            >
              {p}
            </Chip>
          ))}
          <Chip role="radio" selected={typed} onClick={() => setTyped((v) => !v)}>
            {t.meal.typeIt}
          </Chip>
        </div>
        {typed && (
          <Input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.meal.typePlaceholder}
            aria-label={t.meal.typeIt}
            className="h-11 rounded-full bg-card"
          />
        )}

        <div>
          <Overline as="h3">{t.meal.howBig}</Overline>
          <Segmented
            className="mt-2"
            label={t.meal.howBig}
            value={size}
            onChange={setSize}
            options={(["light", "regular", "big"] as const).map((s) => ({ value: s, label: t.sizes[s] }))}
          />
        </div>

        <div>
          <Overline as="h3">{t.meal.howFeel}</Overline>
          <div className="mt-2">
            <FaceGroup options={ENERGIES} value={feeling} onChange={setFeeling} label={t.meal.howFeel} labels={t.energy} />
          </div>
        </div>

        {fastingMode && (
          <div>
            <Overline as="h3">{t.meal.plate}</Overline>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t.meal.plate}>
              {(["veg-protein", "some-carbs", "carb-heavy"] as const).map((p) => (
                <Chip key={p} role="radio" selected={plate === p} onClick={() => setPlate(plate === p ? undefined : p)}>
                  {t.plates[p]}
                </Chip>
              ))}
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
