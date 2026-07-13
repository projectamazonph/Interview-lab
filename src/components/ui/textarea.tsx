"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-xl px-4 py-3",
        "bg-glass-border/40 border border-glass-border",
        "text-text-primary placeholder:text-text-muted",
        "backdrop-blur-sm",
        "transition-all duration-500 ease-premium",
        "focus:outline-none focus:border-accent-violet/50 focus:ring-1 focus:ring-accent-violet/20",
        "focus:bg-glass-border/60",
        "hover:border-glass-border-hover",
        "text-sm font-body leading-relaxed resize-y",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        "overflow-auto",                     // <-- FIX: scroll on long content
        "break-words",                       // <-- FIX: wrap long text
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
