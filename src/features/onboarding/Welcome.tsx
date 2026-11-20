import { ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Button } from "@/components/ui/button";
import { FlowScreen } from "@/components/keeper/Layout";
import { WelcomeQuilt } from "@/components/keeper/Visuals";
import { db } from "@/lib/db";
import { updateSettings } from "@/lib/settings";
import { t } from "@/copy/en";

/** A1 Welcome (Figma 13:27). Promise first: no numbers needed. */
export default function Welcome() {
  const navigate = useNavigate();
  const legacy = useLiveQuery(() => db.readings.filter((r) => r.source === "legacy").count(), []);

  const alreadyTrack = async () => {
    await updateSettings({ glucoseComfort: "numbers", ladderStep: 6 });
    navigate("/onboarding/easy", { state: { glucoseReady: true } });
  };

  return (
    <FlowScreen
      footer={
        <>
          <Button size="lg" onClick={() => navigate("/onboarding/easy")}>
            {t.welcome.start}
          </Button>
          <Button size="lg" variant="ghost" onClick={alreadyTrack}>
            {t.welcome.alreadyTrack}
          </Button>
        </>
      }
    >
      <div className="pt-8">
        <WelcomeQuilt />
        <h1 className="t-display mt-8 text-[2.75rem] leading-[1.05]">
          {t.welcome.hi}
          <br />
          {t.welcome.im}
        </h1>
        <p className="t-body-l mt-5 text-muted-foreground">{legacy ? t.welcome.returning : t.welcome.body}</p>
      </div>
      <div className="mt-10 flex items-center gap-3 rounded-card bg-card p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-primary-soft">
          <ShieldCheck aria-hidden className="h-5 w-5 text-primary-strong" strokeWidth={1.8} />
        </span>
        <p className="t-body text-foreground">{t.welcome.privacy}</p>
      </div>
    </FlowScreen>
  );
}
