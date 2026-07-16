"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type FieldInputProps = React.ComponentProps<"input"> & {
  icon?: React.ReactNode;
};

const FieldInput = React.forwardRef<HTMLInputElement, FieldInputProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full rounded-md px-3 py-2.5",
            "bg-surface-1 border border-border",
            "text-ink-900 placeholder:text-ink-500",
            "text-sm",
            "transition-all duration-150 ease-out-expo",
            "focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30",
            "hover:border-ink-300",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            icon && "pl-10",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

FieldInput.displayName = "FieldInput";

const FieldTextarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-md px-3 py-2.5 min-h-[100px]",
          "bg-surface-1 border border-border",
          "text-ink-900 placeholder:text-ink-500",
          "text-sm leading-relaxed resize-y",
          "transition-all duration-150 ease-out-expo",
          "focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30",
          "hover:border-ink-300",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      />
    );
  }
);

FieldTextarea.displayName = "FieldTextarea";

export { FieldInput, FieldTextarea };
