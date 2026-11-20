import { cn } from "@/lib/utils";
import { t } from "@/copy/en";

export function StepDots({ step, total = 3 }: { step: number; total?: number }) {
  return (
    <div className="flex items-center gap-1.5" role="img" aria-label={t.easy.stepOf(step, total)}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 rounded-full",
            i + 1 === step ? "w-6 bg-primary" : i + 1 < step ? "w-1.5 bg-primary" : "w-1.5 bg-border",
          )}
        />
      ))}
    </div>
  );
}
