"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md px-3 py-2",
        "bg-white border border-[#E5E5E0]",
        "text-[#171717] placeholder:text-[#737373]",
        "transition-all duration-200 ease-out-expo",
        "focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/20",
        "hover:border-[#D4D4D4]",
        "text-sm",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#171717]",
        className
      )}
      {...props}
    />
  );
}

Input.displayName = "Input";

export { Input };
