"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface FieldBadgeProps extends React.ComponentProps<"span"> {
  variant?: "default" | "accent" | "success" | "warning" | "danger" | "ghost";
  size?: "sm" | "md";
}

const FieldBadge = React.forwardRef<HTMLSpanElement, FieldBadgeProps>(
  ({ className, variant = "default", size = "sm", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-sm font-medium w-fit whitespace-nowrap",
          size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
          "transition-colors duration-150 ease-out-expo",
          variant === "default" && "bg-surface-2 text-ink-700 border border-border",
          variant === "accent" && "bg-accent-soft text-accent border border-accent/20",
          variant === "success" && "bg-success-soft text-success border border-success/20",
          variant === "warning" && "bg-warning-soft text-warning border border-warning/20",
          variant === "danger" && "bg-danger-soft text-danger border border-danger/20",
          variant === "ghost" && "text-ink-500",
          className
        )}
        {...props}
      />
    );
  }
);

FieldBadge.displayName = "FieldBadge";

export { FieldBadge, type FieldBadgeProps };
