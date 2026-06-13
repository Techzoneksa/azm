import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
}

function Skeleton({ className, variant = "text", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded",
        variant === "circular" && "rounded-full",
        variant === "rectangular" && "rounded-lg",
        variant === "text" && "h-4 w-full",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
