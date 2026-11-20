import { cn } from "@/lib/utils";
import { t } from "@/copy/en";
import type { TargetRange } from "@/lib/clinical/thresholds";

// Segment widths follow the Figma proportions (below 70 · in 150 · above 72). The marker sits
// inside its band, proportional to where the value falls in that band's display span.
const W = { below: 70, in: 150, above: 72 };
const TOTAL = W.below + W.in + W.above;
const DISPLAY_MIN = 40;
const DISPLAY_MAX = 300;

function markerPercent(v: number, r: TargetRange): number {
  const clamp = (x: number) => Math.max(0, Math.min(1, x));
  let px: number;
  if (v < r.lowMgdl) px = W.below * clamp((v - DISPLAY_MIN) / (r.lowMgdl - DISPLAY_MIN));
  else if (v <= r.highMgdl) px = W.below + W.in * clamp((v - r.lowMgdl) / Math.max(1, r.highMgdl - r.lowMgdl));
  else px = W.below + W.in + W.above * clamp((v - r.highMgdl) / (DISPLAY_MAX - r.highMgdl));
  // Keep the 28px marker fully on the bar.
  return Math.max(4, Math.min(96, (px / TOTAL) * 100));
}

/** Three rounded segments with a ring marker. Never shows numbers. */
export function RangeBar({ valueMgdl, range, label }: { valueMgdl: number; range: TargetRange; label: string }) {
  const pct = markerPercent(valueMgdl, range);
  return (
    <div role="img" aria-label={t.reading.rangeBarLabel(label)}>
      <div className="relative py-2">
        <div className="flex gap-1.5">
          <span className="h-3.5 rounded-full bg-range-below" style={{ flexGrow: W.below, flexBasis: 0 }} />
          <span className="h-3.5 rounded-full bg-range-in" style={{ flexGrow: W.in, flexBasis: 0 }} />
          <span className="h-3.5 rounded-full bg-range-above" style={{ flexGrow: W.above, flexBasis: 0 }} />
        </div>
        <span
          aria-hidden
          className="absolute top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-foreground bg-card"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex gap-1.5 text-muted-foreground" aria-hidden>
        <span className="t-caption" style={{ flexGrow: W.below, flexBasis: 0 }}>
          {t.reading.bandNames.below}
        </span>
        <span className="t-caption text-center" style={{ flexGrow: W.in, flexBasis: 0 }}>
          {t.reading.bandNames.in}
        </span>
        <span className="t-caption text-right" style={{ flexGrow: W.above, flexBasis: 0 }}>
          {t.reading.bandNames.above}
        </span>
      </div>
    </div>
  );
}

/** A small band chip ("Last reading" on Today, rows in the numbers view). Colour + words. */
export function BandDot({ band, className }: { band: "below" | "in" | "above"; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full",
        band === "below" ? "bg-range-below" : band === "in" ? "bg-range-in" : "bg-range-above",
        className,
      )}
    />
  );
}
