import * as SwitchPrimitives from "@radix-ui/react-switch";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/copy/en";

/** 52×32 track (primary on / border off) with a 26px card knob carrying shadow-lift. */
export function Toggle({
  checked,
  onCheckedChange,
  label,
  id,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: string;
  id?: string;
}) {
  return (
    <SwitchPrimitives.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={label}
      className="relative inline-flex h-8 w-[52px] shrink-0 cursor-pointer items-center rounded-full p-[3px] transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=checked]:bg-primary data-[state=unchecked]:bg-border"
    >
      <SwitchPrimitives.Thumb className="block h-[26px] w-[26px] rounded-full bg-card shadow-lift transition-transform duration-200 ease-out data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" />
    </SwitchPrimitives.Root>
  );
}

/** bg-muted pill track; the selected segment is bg-card + shadow-lift. Always has a value. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T | undefined;
  onChange: (v: NoInfer<T>) => void;
  options: readonly { value: NoInfer<T>; label: string }[];
  label: string;
  className?: string;
}) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value ?? ""}
      onValueChange={(v) => v && onChange(v as T)}
      aria-label={label}
      className={cn("flex w-full rounded-full bg-muted p-1", className)}
    >
      {options.map((o) => (
        <ToggleGroupPrimitive.Item
          key={o.value}
          value={o.value}
          className="t-label min-h-11 flex-1 rounded-full px-2 text-muted-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-lift"
        >
          {o.label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  );
}

/** − value + stepper with 44px buttons. */
export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 99,
  format,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  format: (v: number) => string;
  label: string;
}) {
  const round = (v: number) => Math.round(v * 100) / 100;
  return (
    <div className="flex items-center justify-between rounded-full bg-card p-1.5" role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, round(value - step)))}
        disabled={value <= min}
        aria-label={`${t.common.minus}: ${label}`}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Minus aria-hidden className="h-5 w-5" />
      </button>
      <output aria-live="polite" className="t-heading text-foreground">
        {format(value)}
      </output>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, round(value + step)))}
        disabled={value >= max}
        aria-label={`${t.common.plus}: ${label}`}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Plus aria-hidden className="h-5 w-5" />
      </button>
    </div>
  );
}

export function Overline({ children, className, as: Comp = "p" }: { children: React.ReactNode; className?: string; as?: "p" | "h2" | "h3" }) {
  return <Comp className={cn("t-overline text-muted-foreground", className)}>{children}</Comp>;
}
