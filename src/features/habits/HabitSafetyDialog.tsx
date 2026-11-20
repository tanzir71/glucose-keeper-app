import { ShieldCheck } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { t } from "@/copy/en";

/** Shown once before the first tiny habit ever (05 §5). [CLINICAL-REVIEW] copy in en.ts. */
export function HabitSafetyDialog({
  open,
  onOpenChange,
  onAccept,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAccept: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-card-lg bg-card sm:max-w-[400px]">
        <AlertDialogHeader className="text-left">
          <span className="mb-1 flex h-11 w-11 items-center justify-center rounded-[14px] bg-primary-soft">
            <ShieldCheck aria-hidden className="h-5 w-5 text-primary-strong" />
          </span>
          <AlertDialogTitle className="t-heading">{t.habitSafety.title}</AlertDialogTitle>
          <AlertDialogDescription className="t-body text-foreground">{t.habitSafety.body}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          <AlertDialogAction className="h-[54px] w-full" onClick={onAccept}>
            {t.habitSafety.ok}
          </AlertDialogAction>
          <AlertDialogCancel className="mt-0 h-11 w-full border-0 bg-transparent text-primary">{t.common.notNow}</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
