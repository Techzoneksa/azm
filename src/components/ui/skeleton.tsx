import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
}

function Skeleton({ className, variant = "text", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200",
        variant === "circular" && "rounded-full",
        variant === "rectangular" && "rounded-md",
        variant === "text" && "h-4 w-full rounded",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
