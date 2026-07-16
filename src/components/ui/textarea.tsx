"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-md px-3 py-3",
        "bg-white border border-[#E5E5E0]",
        "text-[#171717] placeholder:text-[#737373]",
        "text-sm font-body leading-relaxed resize-y",
        "transition-all duration-200 ease-out-expo",
        "focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/20",
        "hover:border-[#D4D4D4]",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        "overflow-auto break-words",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
