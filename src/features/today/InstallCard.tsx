import { Smartphone, Share } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { promptInstall, useInstallMode } from "@/lib/install";
import { addDays } from "@/lib/rules/time";
import { updateSettings } from "@/lib/settings";
import { t } from "@/copy/en";
import type { Settings } from "@/types/domain";

export const INSTALL_SNOOZE_DAYS = 14;

/**
 * Asks to install Keeper on a phone: the native install dialog where the browser supports it,
 * otherwise the steps for iPhone (Share → Add to Home Screen) or the browser menu.
 * Never shown once installed, and "Not now" hides it for two weeks.
 */
export function InstallCard({ settings, now }: { settings: Settings; now: Date }) {
  const mode = useInstallMode();
  const snoozed = settings.installPrompt?.snoozedUntil && now < new Date(settings.installPrompt.snoozedUntil);
  if (!mode || snoozed) return null;

  const later = () => updateSettings({ installPrompt: { snoozedUntil: addDays(new Date(), INSTALL_SNOOZE_DAYS).toISOString() } });
  const install = async () => {
    if (await promptInstall()) toast(t.install.added);
  };

  const steps = mode === "ios" ? t.install.iosSteps : mode === "menu" ? t.install.menuSteps : null;

  return (
    <section aria-labelledby="install-title" className="rounded-card bg-water-soft p-4">
      <div className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-card">
          <Smartphone aria-hidden className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="install-title" className="t-body-strong">
            {mode === "ios" ? t.install.iosTitle : t.install.title}
          </h2>
          <p className="t-caption mt-0.5 text-muted-foreground">{t.install.body}</p>
        </div>
      </div>

      {steps && (
        <ol className="mt-3 space-y-1.5">
          {steps.map((s, i) => (
            <li key={s} className="t-body flex items-center gap-2">
              <span className="t-label flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-card">{i + 1}</span>
              <span className="flex items-center gap-1.5">
                {s}
                {mode === "ios" && i === 0 && <Share aria-label={t.install.share} className="h-4 w-4 shrink-0" />}
              </span>
            </li>
          ))}
        </ol>
      )}
      {mode === "ios" && <p className="t-caption mt-2 text-muted-foreground">{t.install.iosNote}</p>}

      <div className="mt-3 flex gap-2">
        {mode === "native" && (
          <Button size="sm" onClick={install}>
            {t.install.add}
          </Button>
        )}
        <Button size="sm" variant={mode === "native" ? "outline" : "ghost"} className={mode === "native" ? "" : "-ml-3"} onClick={later}>
          {t.install.later}
        </Button>
      </div>
    </section>
  );
}
