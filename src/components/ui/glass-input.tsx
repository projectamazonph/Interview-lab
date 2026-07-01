"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassInputProps extends React.ComponentProps<"input"> {
  icon?: React.ReactNode;
}

const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full rounded-xl px-4 py-3",
            "bg-glass-border/40 border border-glass-border",
            "text-text-primary placeholder:text-text-muted",
            "backdrop-blur-sm",
            "transition-all duration-500 ease-premium",
            "focus:outline-none focus:border-accent-violet/50 focus:ring-1 focus:ring-accent-violet/20",
            "focus:bg-glass-border/60",
            "hover:border-glass-border-hover",
            "text-sm font-body",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            icon && "pl-12",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

GlassInput.displayName = "GlassInput";

interface GlassTextareaProps extends React.ComponentProps<"textarea"> {}

const GlassTextarea = React.forwardRef<HTMLTextAreaElement, GlassTextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-xl px-4 py-3 min-h-[120px]",
          "bg-glass-border/40 border border-glass-border",
          "text-text-primary placeholder:text-text-muted",
          "backdrop-blur-sm",
          "transition-all duration-500 ease-premium",
          "focus:outline-none focus:border-accent-violet/50 focus:ring-1 focus:ring-accent-violet/20",
          "focus:bg-glass-border/60",
          "hover:border-glass-border-hover",
          "text-sm font-body leading-relaxed resize-y",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      />
    );
  }
);

GlassTextarea.displayName = "GlassTextarea";

export { GlassInput, GlassTextarea };
