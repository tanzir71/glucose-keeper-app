import { cn } from "@/lib/utils";
import { t } from "@/copy/en";
import type { LadderStep } from "@/types/domain";

/** The Readiness Ladder: 6 segments + "Step 4 of 6 · Seal". */
export function LadderIndicator({ step, className }: { step: LadderStep; className?: string }) {
  const label = t.ladder.stepOf(step, t.ladder.steps[step - 1]);
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex items-center gap-1.5" role="img" aria-label={label}>
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className={cn("h-2 rounded-full", i + 1 === step ? "w-6 bg-primary" : i + 1 < step ? "w-2 bg-primary" : "w-2 bg-border")}
          />
        ))}
      </div>
      <span aria-hidden className="t-caption text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
