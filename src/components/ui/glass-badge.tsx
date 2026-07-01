"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassBadgeProps extends React.ComponentProps<"span"> {
  variant?: "default" | "accent" | "success" | "warning" | "danger" | "muted";
}

const GlassBadge = React.forwardRef<HTMLSpanElement, GlassBadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-3 py-1",
          "text-[11px] font-heading font-medium uppercase tracking-wider",
          "backdrop-blur-sm",
          "transition-all duration-400 ease-premium",
          variant === "default" && "bg-glass-border/30 text-text-secondary border border-glass-border",
          variant === "accent" && "bg-accent-violet/20 text-accent-indigo border border-accent-violet/20",
          variant === "success" && "bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/15",
          variant === "warning" && "bg-accent-amber/15 text-accent-amber border border-accent-amber/15",
          variant === "danger" && "bg-accent-rose/15 text-accent-rose border border-accent-rose/15",
          variant === "muted" && "bg-glass-subtle text-text-muted border border-transparent",
          className
        )}
        {...props}
      />
    );
  }
);

GlassBadge.displayName = "GlassBadge";

export { GlassBadge, type GlassBadgeProps };
