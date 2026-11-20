import { useRef } from "react";
import { toTimeInput } from "@/lib/format";
import { t } from "@/copy/en";

/** "Change time" link that opens the native time picker and keeps the date. */
export function ChangeTime({ at, onChange }: { at: Date; onChange: (d: Date) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <label className="t-label relative inline-flex min-h-11 cursor-pointer items-center rounded-full px-2 text-primary focus-within:ring-2 focus-within:ring-ring">
      {t.common.changeTime}
      <input
        ref={ref}
        type="time"
        aria-label={t.meal.time}
        value={toTimeInput(at)}
        onClick={() => {
          try {
            ref.current?.showPicker?.();
          } catch {
            /* the input still opens on focus */
          }
        }}
        onChange={(e) => {
          if (!e.target.value) return;
          const [h, m] = e.target.value.split(":").map(Number);
          const d = new Date(at);
          d.setHours(h, m, 0, 0);
          // Logging something that happened late last night, just after midnight? Keep it in the past.
          if (d.getTime() - Date.now() > 60 * 60_000) d.setDate(d.getDate() - 1);
          onChange(d);
        }}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </label>
  );
}
