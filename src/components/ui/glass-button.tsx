"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const fieldButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-out-expo active:translate-y-px disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] focus-visible:ring-offset-2 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-[#FF6B35] text-white hover:bg-[#E55A2B] shadow-sm",
        secondary:
          "bg-white text-[#171717] border border-[#E5E5E0] hover:bg-[#F4F3EE] shadow-sm",
        outline:
          "bg-white text-[#171717] border-2 border-[#FF6B35] hover:bg-[#FFF5F0] shadow-sm",
        ghost:
          "text-[#404040] hover:bg-[#F4F3EE] border border-transparent",
        danger:
          "bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA] hover:bg-[#FECACA]",
        link:
          "text-[#FF6B35] underline-offset-4 hover:underline bg-transparent border-none shadow-none",
      },
      size: {
        sm: "h-7 px-3 py-1 text-xs",
        md: "h-9 px-4 py-2",
        lg: "h-11 px-6 py-3",
        icon: "h-9 w-9",
        "icon-sm": "h-7 w-7",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface FieldButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof fieldButtonVariants> {
  asChild?: boolean;
}

const FieldButton = React.forwardRef<HTMLButtonElement, FieldButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(fieldButtonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);

FieldButton.displayName = "FieldButton";

export { FieldButton, fieldButtonVariants };
