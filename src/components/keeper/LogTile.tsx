import { cn } from "@/lib/utils";
import { t } from "@/copy/en";
import type { LogKind } from "@/types/domain";
import { KIND_ICON, KIND_SOFT, type DotKind } from "./kinds";

/** Figma LogTile 5:227: 58px rounded tile + label, as one button. */
export function LogTile({
  kind,
  onClick,
  highlight,
}: {
  kind: LogKind;
  onClick: () => void;
  highlight?: boolean;
}) {
  const Icon = KIND_ICON[kind];
  const label = t.kinds[kind];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t.logAria(label)}
      className="group flex w-[62px] flex-col items-center gap-1.5 rounded-tile focus-visible:outline-none"
    >
      <span
        className={cn(
          "flex h-[58px] w-[58px] items-center justify-center rounded-tile transition-transform group-active:scale-95 group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background",
          KIND_SOFT[kind],
          highlight && "ring-2 ring-primary/40 ring-offset-2 ring-offset-background",
        )}
      >
        <Icon aria-hidden className="h-6 w-6 text-foreground" strokeWidth={1.8} />
      </span>
      <span className="t-label text-foreground">{label}</span>
    </button>
  );
}

/** Figma LogDot 5:228: 40px soft square with a 20px icon. */
export function LogDot({ kind, className }: { kind: DotKind; className?: string }) {
  const Icon = KIND_ICON[kind];
  return (
    <span
      aria-hidden
      className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]", KIND_SOFT[kind], className)}
    >
      <Icon className="h-5 w-5 text-foreground" strokeWidth={1.8} />
    </span>
  );
}
