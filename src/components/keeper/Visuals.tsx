import { Leaf } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { KIND_SOFT, KIND_SOLID, type DotKind } from "./kinds";

export interface QuiltPatch {
  kind: DotKind;
  solid?: boolean;
  leaf?: boolean;
}

/** A grid of rounded patches coloured by kind. Missing slots are dashed, never red. */
export function Quilt({
  rows,
  columns = 5,
  label,
}: {
  rows: { label: string; ariaLabel: string; patches: QuiltPatch[] }[];
  columns?: number;
  label: string;
}) {
  return (
    <div role="list" aria-label={label} className="flex flex-col gap-2">
      {rows.map((row, i) => (
        <div key={i} role="listitem" aria-label={row.ariaLabel} className="flex items-center gap-2">
          <span aria-hidden className="t-caption w-4 shrink-0 text-muted-foreground">
            {row.label}
          </span>
          <div className="grid flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {Array.from({ length: columns }).map((_, j) => {
              const p = row.patches[j];
              return p ? (
                <span
                  key={j}
                  aria-hidden
                  className={cn("relative h-6 rounded-[8px]", p.solid ? KIND_SOLID[p.kind] : KIND_SOFT[p.kind])}
                >
                  {p.leaf && <Leaf className="absolute right-1 top-1 h-3 w-3 text-foreground/70" strokeWidth={2} />}
                </span>
              ) : (
                <span key={j} aria-hidden className="h-6 rounded-[8px] border border-dashed border-border" />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Today's patch strip: up to 8 rounded 18px squares. */
export function PatchStrip({ patches }: { patches: QuiltPatch[] }) {
  return (
    <div aria-hidden className="flex items-center gap-1.5">
      {patches.slice(0, 8).map((p, i) => (
        <span key={i} className={cn("relative h-[18px] w-[18px] rounded-[6px]", p.solid ? KIND_SOLID[p.kind] : KIND_SOFT[p.kind])}>
          {p.leaf && <Leaf className="absolute inset-0 m-auto h-2.5 w-2.5 text-foreground/80" strokeWidth={2.4} />}
        </span>
      ))}
    </div>
  );
}

/** SVG progress ring: round caps, soft track, accent progress. No animation under reduced motion. */
export function Ring({
  progress,
  size = 240,
  stroke = 16,
  trackClass = "stroke-move-soft",
  progressClass = "stroke-primary",
  children,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  trackClass?: string;
  progressClass?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={trackClass} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          className={cn(progressClass, "transition-[stroke-dashoffset] duration-1000 ease-linear motion-reduce:transition-none")}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

/** D4 envelope: surface fill, border stroke, primary wax seal with a leaf. */
export function Envelope({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 150" className={className} aria-hidden>
      <rect x="4" y="20" width="192" height="126" rx="18" className="fill-card stroke-border" strokeWidth="2" />
      <path d="M8 30 L100 92 L192 30" className="stroke-border" strokeWidth="4" fill="none" strokeLinejoin="round" />
      <circle cx="100" cy="92" r="26" className="fill-primary" />
      <g transform="translate(89 81)">
        <Leaf width={22} height={22} className="text-primary-foreground" strokeWidth={2} />
      </g>
    </svg>
  );
}

/** Welcome quilt motif: 3×4 rounded 44px tiles in accent and soft colours, some dashed. */
export function WelcomeQuilt() {
  const tiles: (string | null)[] = [
    "bg-meal", "bg-sleep-soft", "bg-feeling", "bg-water-soft",
    "bg-move-soft", "bg-meal-soft", null, "bg-sleep",
    "bg-feeling-soft", "bg-water", "bg-move", null,
  ];
  return (
    <div aria-hidden className="grid w-max grid-cols-4 gap-2">
      {tiles.map((c, i) =>
        c ? (
          <span key={i} className={cn("h-11 w-11 rounded-[14px]", c)} />
        ) : (
          <span key={i} className="h-11 w-11 rounded-[14px] border-[1.5px] border-dashed border-border" />
        ),
      )}
    </div>
  );
}
