"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const separatorVariants = cva("shrink-0 bg-border", {
  variants: {
    orientation: {
      horizontal: "h-px w-full",
      vertical: "h-full w-px",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

function Separator({
  className,
  orientation,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof separatorVariants>) {
  return (
    <div
      className={cn(separatorVariants({ orientation }), className)}
      {...props}
    />
  );
}

Separator.displayName = "Separator";

export { Separator };
