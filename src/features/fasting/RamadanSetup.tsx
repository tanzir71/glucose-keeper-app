import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/keeper/Chip";
import { Overline, Segmented, Stepper } from "@/components/keeper/Controls";
import { BackHeader, FlowScreen } from "@/components/keeper/Layout";
import { CITIES, DEFAULT_RAMADAN, METHODS } from "@/lib/ramadan";
import { updateSettings, useSettings } from "@/lib/settings";
import { t } from "@/copy/en";
import type { RamadanSettings, Rhythm } from "@/types/domain";

/** Ramadan setup: confirmed start date, city (or one-time location) and calculation method. */
export default function RamadanSetup() {
  const settings = useSettings();
  const navigate = useNavigate();
  const [r, setR] = useState<RamadanSettings>();
  const [city, setCity] = useState<NonNullable<Rhythm["city"]>>();
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!settings || r) return;
    setR({ ...DEFAULT_RAMADAN, ...settings.fasting.ramadan });
    setCity(settings.rhythm?.city ?? CITIES[0]);
  }, [settings, r]);
  if (!settings || !r || !city) return <FlowScreen>{null}</FlowScreen>;

  const useLocation = () => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    // One-time; stored only on this phone.
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCity({ name: t.ramadan.locationName, lat: Math.round(pos.coords.latitude * 1e4) / 1e4, lng: Math.round(pos.coords.longitude * 1e4) / 1e4 });
        setLocating(false);
      },
      () => setLocating(false),
      { maximumAge: 3_600_000, timeout: 10_000 },
    );
  };

  const save = async () => {
    await updateSettings((s) => ({
      rhythm: { ...(s.rhythm ?? {}), city },
      fasting: { ...s.fasting, track: "ramadan", ramadan: r },
    }));
    navigate("/", { replace: true });
  };

  return (
    <FlowScreen
      footer={
        <Button size="lg" onClick={save} disabled={!r.startDate}>
          {t.ramadan.save}
        </Button>
      }
    >
      <BackHeader label={t.fasting.title} to="/you/fasting" />
      <h1 className="t-title">{t.ramadan.setup}</h1>

      <section className="mt-5 rounded-card bg-card p-4">
        <label htmlFor="ramadan-start" className="t-label text-muted-foreground">
          {t.ramadan.startDate}
        </label>
        <Input id="ramadan-start" type="date" value={r.startDate ?? ""} onChange={(e) => setR({ ...r, startDate: e.target.value || undefined })} className="mt-2 h-11 rounded-full bg-background" />
        <p className="t-caption mt-2 text-muted-foreground">{t.ramadan.startDateHint}</p>
        <p className="t-label mt-4 text-muted-foreground">{t.ramadan.days}</p>
        <Segmented
          className="mt-2"
          label={t.ramadan.days}
          value={String(r.days ?? 30) as "29" | "30"}
          onChange={(v) => setR({ ...r, days: Number(v) as 29 | 30 })}
          options={[
            { value: "29", label: "29" },
            { value: "30", label: "30" },
          ]}
        />
      </section>

      <section className="mt-3 rounded-card bg-card p-4">
        <Overline as="h2">{t.ramadan.city}</Overline>
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={t.ramadan.city}>
          {CITIES.map((c) => (
            <Chip key={c.name} role="radio" selected={city.name === c.name} onClick={() => setCity(c)}>
              {c.name}
            </Chip>
          ))}
          <Chip role="radio" selected={city.name === t.ramadan.locationName} onClick={useLocation}>
            <MapPin aria-hidden className="h-4 w-4" /> {locating ? t.common.loading : t.ramadan.useLocation}
          </Chip>
        </div>
      </section>

      <section className="mb-4 mt-3 rounded-card bg-card p-4">
        <label htmlFor="ramadan-method" className="t-label text-muted-foreground">
          {t.ramadan.method}
        </label>
        <select
          id="ramadan-method"
          value={r.method}
          onChange={(e) => setR({ ...r, method: e.target.value as RamadanSettings["method"] })}
          className="t-body mt-2 h-11 w-full rounded-full border border-border bg-background px-4"
        >
          {METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <p className="t-label mt-4 text-muted-foreground">{t.ramadan.offset}</p>
        <div className="mt-2">
          <Stepper value={r.suhoorOffsetMin} onChange={(v) => setR({ ...r, suhoorOffsetMin: v })} min={0} max={30} step={1} format={(v) => `${v} min`} label={t.ramadan.offset} />
        </div>
      </section>
    </FlowScreen>
  );
}
