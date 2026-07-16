"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-out-expo active:translate-y-px disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-ink hover:bg-accent-hover shadow-sm",
        destructive:
          "bg-danger-soft text-danger border border-danger/20 hover:bg-danger/20",
        outline:
          "bg-surface-1 text-ink-700 border border-border hover:bg-surface-2 hover:text-ink-900 shadow-sm",
        secondary:
          "bg-surface-2 text-ink-700 border border-border hover:bg-border hover:text-ink-900",
        ghost:
          "text-ink-700 hover:bg-surface-2 hover:text-ink-900 border border-transparent",
        link: "text-accent underline-offset-4 hover:underline bg-transparent border-none shadow-none",
      },
      size: {
        sm: "h-7 rounded-sm px-3 py-1 text-xs",
        md: "h-9 px-4 py-2",
        lg: "h-11 px-6 py-3",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

Button.displayName = "Button";

export { Button, buttonVariants };
