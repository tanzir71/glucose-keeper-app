import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { FlowScreen } from "./Layout";

/** D6 layout: full plum background, shield tile, overline, title, translucent steps card. */
export function SafetyScreen({
  overline,
  title,
  steps,
  note,
  extra,
  actions,
  top,
}: {
  overline?: string;
  title: string;
  steps: readonly string[];
  note?: ReactNode;
  extra?: ReactNode;
  actions: ReactNode;
  top?: ReactNode;
}) {
  return (
    <FlowScreen tone="safety" footer={actions}>
      {top}
      <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-safety-foreground text-safety">
        <ShieldCheck aria-hidden className="h-7 w-7" strokeWidth={1.8} />
      </div>
      {overline && <p className="t-overline mt-6 text-safety-foreground/85">{overline}</p>}
      <h1 className="t-title mt-2" role="alert">
        {title}
      </h1>
      <ol className="mt-6 space-y-4 rounded-card bg-safety-foreground/[0.12] p-5">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="t-label flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-safety-foreground text-safety">
              {i + 1}
            </span>
            <span className="t-body-l">{s}</span>
          </li>
        ))}
      </ol>
      {note && <p className="t-body mt-6 text-safety-foreground/90">{note}</p>}
      {extra}
    </FlowScreen>
  );
}
