import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { t } from "@/copy/en";

/**
 * Bottom sheet: rounded-t-sheet, 40×5 grabber, foreground scrim at 30%.
 * Slides up in 240ms; with reduced motion it fades instead.
 */
export function Sheet({
  open = true,
  onClose,
  title,
  description,
  headerRight,
  children,
  footer,
  tone = "default",
}: {
  open?: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  tone?: "default" | "safety";
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-foreground/30 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          aria-describedby={description ? undefined : undefined}
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-app flex-col rounded-t-sheet outline-none",
            "duration-[240ms] ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom motion-reduce:data-[state=open]:slide-in-from-bottom-0 motion-reduce:data-[state=closed]:slide-out-to-bottom-0",
            tone === "safety" ? "bg-background" : "bg-background",
          )}
        >
          <div aria-hidden className="mx-auto mt-2.5 h-[5px] w-10 shrink-0 rounded-full bg-border" />
          <div
            className={cn(
              "flex items-start justify-between gap-3 px-6 pb-3 pt-4",
              tone === "safety" && "mx-4 mt-2 rounded-card bg-safety px-5 py-4 text-safety-foreground",
            )}
          >
            <div className="min-w-0">
              <Dialog.Title className="t-heading">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className={cn("t-body mt-1", tone === "safety" ? "text-safety-foreground/90" : "text-muted-foreground")}>
                  {description}
                </Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{typeof title === "string" ? title : ""}</Dialog.Description>
              )}
            </div>
            {headerRight ?? (
              <Dialog.Close
                aria-label={t.common.close}
                className={cn(
                  "-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  tone === "safety" ? "text-safety-foreground hover:bg-safety-foreground/10" : "text-muted-foreground hover:bg-muted",
                )}
              >
                <X aria-hidden className="h-5 w-5" />
              </Dialog.Close>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-4">{children}</div>
          {footer && (
            <div className="px-6 pt-2" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1.25rem)" }}>
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
