import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Figma Chip 5:237. Default: card + border. Selected: primary-soft + primary border + check. */
export function Chip({
  selected,
  onClick,
  children,
  role = "checkbox",
  className,
  ariaLabel,
}: {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
  role?: "checkbox" | "radio" | "button";
  className?: string;
  ariaLabel?: string;
}) {
  const ariaProps =
    role === "button" ? { "aria-pressed": !!selected } : { role, "aria-checked": !!selected };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      {...ariaProps}
      className={cn(
        "t-label inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "border-[1.5px] border-primary bg-primary-soft text-primary-strong"
          : "border border-border bg-card text-foreground hover:bg-muted",
        className,
      )}
    >
      {selected && <Check aria-hidden className="h-4 w-4" strokeWidth={2.2} />}
      {children}
    </button>
  );
}
