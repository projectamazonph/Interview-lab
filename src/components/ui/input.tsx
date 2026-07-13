"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-xl px-4 py-3",
        "bg-glass-border/40 border border-glass-border",
        "text-text-primary placeholder:text-text-muted",
        "backdrop-blur-sm",
        "transition-all duration-500 ease-premium",
        "focus:outline-none focus:border-accent-violet/50 focus:ring-1 focus:ring-accent-violet/20",
        "focus:bg-glass-border/60",
        "hover:border-glass-border-hover",
        "text-sm font-body",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text-primary",
        className
      )}
      {...props}
    />
  );
}

export { Input };
