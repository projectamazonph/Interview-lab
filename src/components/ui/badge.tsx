"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-sm px-2 py-0.5 text-[11px] font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-colors duration-150 ease-out-expo",
  {
    variants: {
      variant: {
        default:
          "bg-surface-2 text-ink-700 border border-border",
        accent:
          "bg-accent-soft text-accent border border-accent/20",
        success:
          "bg-success-soft text-success border border-success/20",
        warning:
          "bg-warning-soft text-warning border border-warning/20",
        destructive:
          "bg-danger-soft text-danger border border-danger/20",
        outline:
          "text-ink-700 border border-border",
        ghost:
          "text-ink-500",
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

Badge.displayName = "Badge";

export { Badge, badgeVariants };
