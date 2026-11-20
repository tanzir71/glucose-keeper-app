import { cn } from "@/lib/utils";
import type { Energy, Mood } from "@/types/domain";

// Face SVGs from 02 §5 (44×44, stroke 2, currentColor). Mood faces follow the same style.
const FACES: Record<Energy | Mood, JSX.Element> = {
  sleepy: (
    <>
      <circle cx="22" cy="22" r="19" />
      <path d="M12.5 19.5q3.5 2.6 7 0" />
      <path d="M24.5 19.5q3.5 2.6 7 0" />
      <path d="M19 29.5h6" />
      <path d="M33 6h5l-5 5h5" strokeWidth="1.6" />
    </>
  ),
  steady: (
    <>
      <circle cx="22" cy="22" r="19" />
      <circle cx="16" cy="18.5" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="28" cy="18.5" r="1.8" fill="currentColor" stroke="none" />
      <path d="M15 26q7 6 14 0" />
    </>
  ),
  buzzy: (
    <>
      <circle cx="22" cy="22" r="17" />
      <circle cx="16" cy="18" r="2.4" fill="currentColor" stroke="none" />
      <circle cx="28" cy="18" r="2.4" fill="currentColor" stroke="none" />
      <ellipse cx="22" cy="28" rx="3.4" ry="3.8" />
      <path d="M3 9l3.2 2.6" />
      <path d="M41 9l-3.2 2.6" />
      <path d="M22 1.5v2.8" />
    </>
  ),
  low: (
    <>
      <circle cx="22" cy="22" r="19" />
      <circle cx="16" cy="19" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="28" cy="19" r="1.8" fill="currentColor" stroke="none" />
      <path d="M15.5 30q6.5-4.5 13 0" />
    </>
  ),
  okay: (
    <>
      <circle cx="22" cy="22" r="19" />
      <circle cx="16" cy="18.5" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="28" cy="18.5" r="1.8" fill="currentColor" stroke="none" />
      <path d="M16 28h12" />
    </>
  ),
  good: (
    <>
      <circle cx="22" cy="22" r="19" />
      <path d="M13.5 19q2.5-2.6 5 0" />
      <path d="M25.5 19q2.5-2.6 5 0" />
      <path d="M14 25.5q8 8 16 0" />
    </>
  ),
};

export function Face({ face, className }: { face: Energy | Mood; className?: string }) {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {FACES[face]}
    </svg>
  );
}

/** Figma FaceOption 5:297: 104px card, 44px face, label. Selected: feeling-soft + feeling border. */
export function FaceOption({
  face,
  label,
  selected,
  onSelect,
}: {
  face: Energy | Mood;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      onClick={onSelect}
      className={cn(
        "flex min-h-[104px] flex-1 flex-col items-center justify-center gap-2 rounded-card p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected ? "border-2 border-feeling bg-feeling-soft" : "border-2 border-transparent bg-card hover:bg-muted",
      )}
    >
      <Face face={face} className="h-11 w-11 text-foreground" />
      <span className="t-label text-foreground">{label}</span>
    </button>
  );
}

export function FaceGroup<T extends Energy | Mood>({
  options,
  value,
  onChange,
  label,
  labels,
}: {
  options: readonly T[];
  value: NoInfer<T> | undefined;
  onChange: (v: NoInfer<T> | undefined) => void;
  label: string;
  labels: Record<NoInfer<T>, string>;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-2.5">
      {options.map((o) => (
        <FaceOption
          key={o}
          face={o}
          label={labels[o]}
          selected={value === o}
          onSelect={() => onChange(value === o ? undefined : o)}
        />
      ))}
    </div>
  );
}
