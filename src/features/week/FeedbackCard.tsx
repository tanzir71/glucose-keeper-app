import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { FaceGroup } from "@/components/keeper/FaceOption";
import { Button } from "@/components/ui/button";
import { updateSettings } from "@/lib/settings";
import { t } from "@/copy/en";
import type { Mood, Settings } from "@/types/domain";

export const FEEDBACK_EVERY_DAYS = 28;

/**
 * Open question 8's default: an optional, local "How is Keeper for you?" check-in every 4 weeks,
 * with an email link. The answer is stored on the phone only; nothing is sent unless she
 * writes the email herself.
 */
export function FeedbackCard({ settings, now }: { settings: Settings; now: Date }) {
  const [answered, setAnswered] = useState(false);

  // Older installs have no firstUsedAt: start the clock now.
  useEffect(() => {
    if (!settings.firstUsedAt) void updateSettings({ firstUsedAt: new Date().toISOString() });
  }, [settings.firstUsedAt]);

  const since = settings.feedback?.lastAt ?? settings.firstUsedAt;
  const due = !!since && now.getTime() - new Date(since).getTime() >= FEEDBACK_EVERY_DAYS * 86_400_000;
  if (!due && !answered) return null;

  const save = (mood?: Mood) =>
    updateSettings((s) => ({
      feedback: {
        lastAt: new Date().toISOString(),
        answers: mood ? [...(s.feedback?.answers ?? []).slice(-11), { at: new Date().toISOString(), mood }] : s.feedback?.answers,
      },
    }));

  return (
    <section className="rounded-card bg-card p-4" aria-labelledby="feedback-title">
      <h2 id="feedback-title" className="t-body-strong">
        {t.week.feedbackTitle}
      </h2>
      {answered ? (
        <>
          <p className="t-body mt-1">{t.week.feedbackThanks}</p>
          <a
            href={`mailto:?subject=${encodeURIComponent(t.week.feedbackSubject)}`}
            className="t-label mt-2 inline-flex min-h-11 items-center gap-1.5 text-primary"
          >
            <Mail aria-hidden className="h-4 w-4" /> {t.week.feedbackNote}
          </a>
        </>
      ) : (
        <>
          <p className="t-caption mt-1 text-muted-foreground">{t.week.feedbackBody}</p>
          <div className="mt-3">
            <FaceGroup
              options={["low", "okay", "good"] as const}
              value={undefined}
              onChange={(m) => {
                if (!m) return;
                setAnswered(true);
                void save(m);
              }}
              label={t.week.feedbackTitle}
              labels={t.moods}
            />
          </div>
          <Button size="sm" variant="ghost" className="-ml-3 mt-2" onClick={() => save()}>
            {t.common.notNow}
          </Button>
        </>
      )}
    </section>
  );
}
