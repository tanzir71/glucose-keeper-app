import { BackHeader, FlowScreen } from "@/components/keeper/Layout";
import { Toggle } from "@/components/keeper/Controls";
import { WeightCard } from "@/features/fasting/WeightCard";
import { updateSettings, useSettings } from "@/lib/settings";
import { t } from "@/copy/en";

/** M4.7 optional weekly weight. Not offered when fasting guidance is excluded. */
export default function YouWeight() {
  const settings = useSettings();
  if (!settings) return <FlowScreen>{null}</FlowScreen>;
  return (
    <FlowScreen>
      <BackHeader label={t.tabs.you} to="/you" />
      <h1 className="t-title">{t.weight.title}</h1>
      <p className="t-body-l mt-2 text-muted-foreground">{t.weight.sub}</p>
      {settings.fasting.excluded ? (
        <p className="t-body mt-5 rounded-card bg-card p-4">{t.weight.excluded}</p>
      ) : (
        <>
          <section className="mt-5 flex items-center justify-between gap-3 rounded-card bg-card p-4">
            <span className="t-body-strong">{t.weight.toggle}</span>
            <Toggle checked={settings.weightTracking} onCheckedChange={(v) => updateSettings({ weightTracking: v })} label={t.weight.toggle} />
          </section>
          {settings.weightTracking && (
            <div className="mt-3">
              <WeightCard settings={settings} />
            </div>
          )}
        </>
      )}
    </FlowScreen>
  );
}
