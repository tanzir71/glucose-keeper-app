import { Leaf } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LogDot } from "./LogTile";
import type { DotKind } from "./kinds";

/** Figma TimelineItem 5:298: card, LogDot, title, meta, time on the right. */
export function TimelineItem({
  kind,
  title,
  meta,
  time,
  leaf,
  onClick,
  thumb,
  className,
}: {
  kind: DotKind;
  title: ReactNode;
  meta?: ReactNode;
  time?: string;
  leaf?: boolean;
  onClick?: () => void;
  thumb?: ReactNode;
  className?: string;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-[20px] bg-card px-4 py-3 text-left",
        onClick && "transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <span className="relative">
        {thumb ?? <LogDot kind={kind} />}
        {leaf && (
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Leaf aria-hidden className="h-3 w-3" strokeWidth={2} />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="t-body-strong block truncate text-foreground">{title}</span>
        {meta && <span className="t-caption block truncate text-muted-foreground">{meta}</span>}
      </span>
      {time && <span className="t-caption shrink-0 text-muted-foreground">{time}</span>}
    </Comp>
  );
}
