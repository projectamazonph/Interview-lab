"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassButtonProps extends React.ComponentProps<"button"> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  iconRight?: React.ReactNode;
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = "primary", size = "md", iconRight, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "group inline-flex items-center justify-center gap-2.5",
          "rounded-full font-heading font-semibold",
          "transition-all duration-500 ease-premium",
          "active:scale-[0.97]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:opacity-40 disabled:pointer-events-none",
          size === "sm" && "px-5 py-2 text-sm",
          size === "md" && "px-7 py-3 text-sm",
          size === "lg" && "px-9 py-4 text-base",
          variant === "primary" && [
            "bg-accent-violet text-white",
            "shadow-[0_0_20px_rgba(99,102,241,0.3)]",
            "hover:bg-accent-indigo",
            "hover:shadow-[0_0_30px_rgba(129,140,248,0.4)]",
          ],
          variant === "secondary" && [
            "bg-glass-border/30 text-text-primary",
            "border border-glass-border",
            "backdrop-blur-sm",
            "hover:bg-glass-border/50",
            "hover:border-glass-border-hover",
          ],
          variant === "ghost" && [
            "text-text-secondary",
            "hover:bg-glass-border/20",
            "hover:text-text-primary",
          ],
          variant === "danger" && [
            "bg-accent-rose/20 text-accent-rose",
            "border border-accent-rose/20",
            "hover:bg-accent-rose/30",
          ],
          className
        )}
        {...props}
      >
        {children}
        {iconRight && (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/10 transition-all duration-500 ease-premium group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105 shrink-0">
            {iconRight}
          </span>
        )}
      </button>
    );
  }
);

GlassButton.displayName = "GlassButton";

export { GlassButton, type GlassButtonProps };
