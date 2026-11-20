import { useEffect, useRef, useState } from "react";
import { Camera, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BackHeader, FlowScreen } from "@/components/keeper/Layout";
import { Sheet } from "@/components/keeper/Sheet";
import { db } from "@/lib/db";
import { savePhoto } from "@/lib/photos";
import { useActiveFast } from "@/lib/data";
import { parseTypedGlucose } from "@/lib/clinical/thresholds";
import { OCR_IS_PRIMARY } from "@/lib/ocr/config";
import { routePath, saveReading } from "@/lib/readings";
import { useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { t } from "@/copy/en";

type Mode = "camera" | "reading" | "failed" | "symptom" | "typing";

/** The blurred meter placeholder from D3 (before any photo). */
function MeterPlaceholder() {
  return (
    <div aria-hidden className="flex h-[140px] w-[110px] flex-col items-center rounded-[22px] bg-muted-foreground/60 p-3">
      <div className="flex h-16 w-full items-center justify-center rounded-xl bg-muted">
        <div className="sealed-blur h-5 w-16 rounded bg-muted-foreground" style={{ filter: "blur(6px)" }} />
      </div>
      <div className="mt-4 flex gap-3">
        <span className="h-5 w-5 rounded-full bg-muted" />
        <span className="h-5 w-5 rounded-full bg-muted" />
      </div>
    </div>
  );
}

function Shutter({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={t.check.shutter}
      disabled={disabled}
      onClick={onClick}
      className="flex h-[84px] w-[84px] items-center justify-center rounded-full border-[3px] border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
    >
      <span className="h-[66px] w-[66px] rounded-full bg-primary" />
    </button>
  );
}

/**
 * D3 Snap & seal (Figma 16:572). The photo is only ever shown through a ≥ 24px blur. OCR runs on
 * the phone (≤ 8 s); safety-class readings go to D6/High instead of being sealed. Never uploads.
 */
export default function Check() {
  const navigate = useNavigate();
  const settings = useSettings();
  const activeFast = useActiveFast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("camera");
  const [photo, setPhoto] = useState<{ id: string; url: string }>();
  const [typed, setTyped] = useState("");
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => () => photo && URL.revokeObjectURL(photo.url), [photo]);
  if (!settings || activeFast === undefined) return <FlowScreen>{null}</FlowScreen>;
  const unit = settings.unit;

  const finish = async (valueMgdl: number | null, source: "photo" | "typed", confidence?: number) => {
    const { reading, decision } = await saveReading({ valueMgdl, source, settings, photoId: photo?.id, ocrConfidence: confidence, activeFast });
    navigate(routePath(decision.route, reading.id), { replace: true });
  };

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    setMode("reading");
    const id = await savePhoto("meter", file);
    const stored = await db.photos.get(id);
    if (!stored) return setMode("failed");
    setPhoto({ id, url: URL.createObjectURL(stored.blob) });
    const { readMeter } = await import("@/lib/ocr");
    const parsed = await readMeter(stored.blob, unit);
    if (parsed) await finish(parsed.valueMgdl, "photo", parsed.confidence);
    else setMode("failed");
  };

  const submitTyped = async () => {
    const v = parseTypedGlucose(typed, unit);
    if (v == null) return setError(true);
    await finish(v, "typed");
  };

  if (mode === "typing") {
    return (
      <FlowScreen
        footer={
          <Button size="lg" onClick={submitTyped} disabled={!typed.trim()}>
            {t.check.sealIt}
          </Button>
        }
      >
        <BackHeader label={t.check.back} onBack={() => setMode("camera")} />
        <h1 className="t-title">{t.check.typeTitle}</h1>
        <p className="t-body-l mt-2 text-muted-foreground">{t.check.typeBody}</p>
        <form
          className="mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            void submitTyped();
          }}
        >
          <label htmlFor="typed-reading" className="t-label text-muted-foreground">
            {t.check.typeLabel(unit)}
          </label>
          <div className="mt-2 flex items-center gap-2">
            <Input
              id="typed-reading"
              autoFocus
              inputMode="decimal"
              autoComplete="off"
              value={typed}
              onChange={(e) => {
                setTyped(e.target.value);
                setError(false);
              }}
              aria-describedby="typed-hint"
              className={cn("h-14 rounded-full bg-card px-5 text-2xl tracking-widest", !reveal && "masked-input")}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-14 w-14 shrink-0"
              aria-label={reveal ? t.check.hide : t.check.reveal}
              aria-pressed={reveal}
              onClick={() => setReveal((r) => !r)}
            >
              {reveal ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
            </Button>
          </div>
          <p id="typed-hint" className="t-caption mt-2 text-muted-foreground" aria-live="polite">
            {error ? t.check.implausible : t.check.typeHint(unit, unit === "mmol/L" ? "6.2" : "112")}
          </p>
        </form>
      </FlowScreen>
    );
  }

  return (
    <FlowScreen
      footer={
        OCR_IS_PRIMARY ? (
          <div className="flex flex-col items-center gap-3">
            <Shutter disabled={mode === "reading"} onClick={() => fileRef.current?.click()} />
            <Button size="lg" variant="ghost" onClick={() => setMode("typing")}>
              {t.check.type}
            </Button>
          </div>
        ) : (
          <>
            <Button size="lg" onClick={() => setMode("typing")}>
              {t.check.typePrivately}
            </Button>
            <Button size="lg" variant="outline" disabled={mode === "reading"} onClick={() => fileRef.current?.click()}>
              <Camera aria-hidden /> {t.check.snapInstead}
            </Button>
          </>
        )
      }
    >
      <BackHeader label={t.check.back} />
      <div className="relative flex h-[250px] items-center justify-center overflow-hidden rounded-card-lg bg-foreground">
        {photo ? <img src={photo.url} alt="" className="sealed-blur absolute inset-0 h-full w-full scale-110 object-cover" /> : <MeterPlaceholder />}
        <span className="t-label absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-foreground">
          <Eye aria-hidden className="h-4 w-4" /> {t.check.blurred}
        </span>
      </div>
      <h1 className="t-title mt-6">{t.check.title}</h1>
      <p className="t-body-l mt-2 text-muted-foreground">{t.check.body}</p>
      {mode === "reading" && (
        <p className="t-body-strong mt-4" role="status">
          {t.check.reading}
        </p>
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
          void onPhoto(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <Sheet
        open={mode === "failed"}
        onClose={() => setMode("camera")}
        title={t.check.failedTitle}
        description={t.check.failedBody}
        footer={
          <div className="space-y-2">
            <Button size="lg" onClick={() => setMode("typing")}>
              {t.check.typePrivately}
            </Button>
            <Button size="lg" variant="outline" onClick={() => setMode("symptom")}>
              {t.check.keepSealed}
            </Button>
          </div>
        }
      >
        {null}
      </Sheet>

      <Sheet
        open={mode === "symptom"}
        onClose={() => setMode("failed")}
        tone="safety"
        title={t.check.symptomTitle}
        description={t.check.symptomQ}
        footer={
          <div className="space-y-2">
            <Button size="lg" variant="destructive" onClick={() => navigate("/glucose/safety/unwell", { replace: true })}>
              {t.common.yes}
            </Button>
            <Button size="lg" variant="outline" onClick={() => finish(null, "photo")}>
              {t.common.no}
            </Button>
          </div>
        }
      >
        {null}
      </Sheet>
    </FlowScreen>
  );
}
