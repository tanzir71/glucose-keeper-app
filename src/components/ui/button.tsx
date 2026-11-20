import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Keeper buttons (Figma Button 5:244): pill-shaped, 54px on screens, t-body-strong.
// Tap targets are never under 44px.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-[18px] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        // There is no red in Keeper: "destructive" is the plum safety colour.
        destructive: "bg-safety text-safety-foreground hover:bg-safety/90",
        outline: "border border-border bg-card text-foreground hover:bg-muted",
        secondary: "border border-border bg-card text-foreground hover:bg-muted",
        ghost: "text-primary hover:bg-primary-soft/60",
        link: "text-primary underline-offset-4 hover:underline",
        // On the plum safety background.
        safety: "bg-safety-foreground text-safety hover:bg-safety-foreground/90 focus-visible:ring-safety-foreground focus-visible:ring-offset-safety",
        safetyGhost: "text-safety-foreground hover:bg-safety-foreground/10 focus-visible:ring-safety-foreground focus-visible:ring-offset-safety",
      },
      size: {
        default: "h-11 px-5 text-[0.9375rem]",
        sm: "h-11 px-4 text-[0.8125rem]",
        lg: "h-[54px] w-full px-6 text-[0.9375rem]",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
