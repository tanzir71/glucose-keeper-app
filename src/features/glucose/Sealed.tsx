import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FlowScreen } from "@/components/keeper/Layout";
import { Envelope } from "@/components/keeper/Visuals";
import { openEnvelope } from "@/lib/readings";
import { fmtDayTime } from "@/lib/format";
import { t } from "@/copy/en";
import { useReading } from "./useReading";

/** D4 Sealed (Figma 16:617). Sealed envelopes show no value, band or colour anywhere. */
export default function Sealed() {
  const { id } = useParams();
  const navigate = useNavigate();
  const view = useReading(id);
  const [unread, setUnread] = useState(false);

  if (view === undefined) return <FlowScreen>{null}</FlowScreen>;
  if (view === null) return <Navigate to="/week" replace />;
  const { reading, n, context } = view;
  if (reading.state === "opened") return <Navigate to={`/glucose/reading/${reading.id}`} replace />;

  const known = reading.safety !== "unknown" && reading.valueMgdl != null;
  const open = async () => {
    if (!known) return setUnread(true);
    // Opening an envelope never changes glucoseComfort.
    await openEnvelope(reading.id);
    navigate(`/glucose/reading/${reading.id}`, { replace: true });
  };

  return (
    <FlowScreen
      footer={
        <>
          <Button size="lg" onClick={() => navigate("/", { replace: true })}>
            {t.sealed.keep}
          </Button>
          {unread ? (
            <Button size="lg" variant="outline" onClick={() => navigate("/glucose/check", { replace: true })}>
              {t.sealed.checkAgain}
            </Button>
          ) : (
            <Button size="lg" variant="outline" onClick={open}>
              {t.sealed.open}
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col items-center pt-16 text-center">
        <Envelope className="w-44" />
        <h1 className="t-title mt-8">
          {t.sealed.title1}
          <br />
          {t.sealed.title2}
        </h1>
        <p className="t-caption mt-4 rounded-full bg-card px-4 py-2 text-muted-foreground">{t.sealed.meta(n, fmtDayTime(reading.at), context)}</p>
      </div>
      <div className="mt-6 flex gap-3 rounded-card bg-primary-soft p-4">
        <ShieldCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-primary-strong" />
        <p className="t-body">{unread ? t.sealed.unreadOpen : known ? t.sealed.safeCopy : t.sealed.unknownCopy}</p>
      </div>
    </FlowScreen>
  );
}
