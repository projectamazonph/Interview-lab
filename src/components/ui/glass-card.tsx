"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface FieldCardProps extends React.ComponentProps<"div"> {
  variant?: "default" | "interactive" | "bordered";
}

const FieldCard = React.forwardRef<HTMLDivElement, FieldCardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white rounded-lg border border-[#E5E5E0]",
          variant === "default" && "shadow-sm",
          variant === "interactive" && "shadow-sm hover:shadow-md hover:-translate-y-px transition-all duration-200 ease-out-expo cursor-pointer",
          variant === "bordered" && "shadow-none",
          className
        )}
        {...props}
      />
    );
  }
);

FieldCard.displayName = "FieldCard";

const FieldCardHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6 pb-0", className)} {...props} />
  )
);
FieldCardHeader.displayName = "FieldCardHeader";

const FieldCardTitle = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("font-heading font-semibold leading-none tracking-tight text-ink-900", className)} {...props} />
  )
);
FieldCardTitle.displayName = "FieldCardTitle";

const FieldCardDescription = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm text-ink-500", className)} {...props} />
  )
);
FieldCardDescription.displayName = "FieldCardDescription";

const FieldCardContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
FieldCardContent.displayName = "FieldCardContent";

const FieldCardFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
);
FieldCardFooter.displayName = "FieldCardFooter";

export { FieldCard, FieldCardHeader, FieldCardTitle, FieldCardDescription, FieldCardContent, FieldCardFooter, type FieldCardProps };
