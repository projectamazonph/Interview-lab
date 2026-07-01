"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.ComponentProps<"div"> {
  variant?: "default" | "elevated" | "interactive";
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          /* Outer Shell */
          "rounded-[2rem] p-[2px]",
          "bg-glass-border/50",
          /* Inner Core via nested div */
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "rounded-[calc(2rem-2px)] bg-glass/80",
            "shadow-inner-highlight-sm",
            "backdrop-blur-xl",
            "transition-all duration-700 ease-premium",
            "overflow-hidden",                     // <-- FIX: contain children
            variant === "interactive" && [
              "hover:bg-glass-border/30",
              "hover:shadow-glass-glow",
              "cursor-pointer",
              "hover:-translate-y-1",
            ],
            variant === "elevated" && "shadow-glass-lg"
          )}
        >
          {children}
        </div>
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard, type GlassCardProps };
