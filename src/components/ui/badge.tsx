"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-heading font-medium uppercase tracking-wider w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none backdrop-blur-sm transition-all duration-400 ease-premium",
  {
    variants: {
      variant: {
        default:
          "bg-glass-border/30 text-text-secondary border border-glass-border",
        accent:
          "bg-accent-violet/20 text-accent-indigo border border-accent-violet/20",
        success:
          "bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/15",
        warning:
          "bg-accent-amber/15 text-accent-amber border border-accent-amber/15",
        destructive:
          "bg-accent-rose/15 text-accent-rose border border-accent-rose/15",
        outline:
          "text-text-secondary border border-glass-border",
        secondary:
          "bg-glass-subtle text-text-muted border border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
