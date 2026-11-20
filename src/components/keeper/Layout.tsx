import { ChevronLeft, X } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { t } from "@/copy/en";
import { TabBar } from "./TabBar";

/** A tab screen: centred column, status-bar-safe top, room for the TabBar. */
export function TabScreen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <>
      <main className={cn("screen pb-32", className)}>{children}</main>
      <TabBar />
    </>
  );
}

/** A full screen without the TabBar (flows). Footer buttons stick to the bottom. */
export function FlowScreen({
  children,
  footer,
  className,
  tone = "default",
}: {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  tone?: "default" | "safety";
}) {
  return (
    <div className={cn("min-h-dvh", tone === "safety" ? "bg-safety text-safety-foreground" : "bg-background")}>
      <main className={cn("screen flex min-h-dvh flex-col", className)}>
        <div className="flex-1">{children}</div>
        {footer && (
          <div
            className={cn("sticky bottom-0 -mx-6 mt-6 flex flex-col gap-3 px-6 pt-3", tone === "safety" ? "bg-safety" : "bg-background")}
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1.5rem)" }}
          >
            {footer}
          </div>
        )}
      </main>
    </div>
  );
}

/** Back button (44px) + small label, as in D2/D3/D5. `to` defaults to history back. */
export function BackHeader({ label, to, onBack, tone = "default" }: { label?: string; to?: string; onBack?: () => void; tone?: "default" | "safety" }) {
  const navigate = useNavigate();
  const go = () => {
    if (onBack) return onBack();
    if (to) return navigate(to);
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };
  return (
    <div className="mb-4 flex items-center gap-3">
      <button
        type="button"
        onClick={go}
        aria-label={label ? `${t.common.back}: ${label}` : t.common.back}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          tone === "safety" ? "bg-safety-foreground/15 text-safety-foreground" : "bg-card text-foreground hover:bg-muted",
        )}
      >
        <ChevronLeft aria-hidden className="h-5 w-5" />
      </button>
      {label && <span className={cn("t-label", tone === "safety" ? "text-safety-foreground/80" : "text-muted-foreground")}>{label}</span>}
    </div>
  );
}

/** Overline on the left, close button on the right (B3/B4). */
export function CloseHeader({ overline, onClose }: { overline?: ReactNode; onClose: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <span className="t-overline text-muted-foreground">{overline}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label={t.common.close}
        className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full bg-card text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X aria-hidden className="h-5 w-5" />
      </button>
    </div>
  );
}

export function Card({ children, className, tone = "card" }: { children: ReactNode; className?: string; tone?: "card" | "primary" | "feeling" | "move" | "meal" | "sleep" | "water" | "sunken" }) {
  const bg = {
    card: "bg-card",
    primary: "bg-primary-soft",
    feeling: "bg-feeling-soft",
    move: "bg-move-soft",
    meal: "bg-meal-soft",
    sleep: "bg-sleep-soft",
    water: "bg-water-soft",
    sunken: "bg-muted",
  }[tone];
  return <div className={cn("rounded-card p-4", bg, className)}>{children}</div>;
}

/** "Why this?" line: clock icon + human-readable reason (CLAUDE.md rule 6). */
export function WhyThis({ reason, className }: { reason: string; className?: string }) {
  return (
    <p className={cn("t-caption flex items-start gap-1.5 text-muted-foreground", className)}>
      <ClockIcon />
      <span>
        <span className="font-semibold">{t.common.whyThis}</span> {reason}
      </span>
    </p>
  );
}

function ClockIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="mt-px h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}
