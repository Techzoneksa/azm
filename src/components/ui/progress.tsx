import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "danger";
  showLabel?: boolean;
}

const sizeMap = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

const variantMap = {
  default: "bg-blue-600",
  success: "bg-green-600",
  warning: "bg-amber-500",
  danger: "bg-red-600",
};

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      size = "md",
      variant = "default",
      showLabel = false,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div className={cn("w-full", className)} {...props} ref={ref}>
        <div
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          className={cn(
            "w-full overflow-hidden rounded-full bg-gray-200",
            sizeMap[size]
          )}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300 ease-in-out",
              variantMap[variant]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <span className="mt-1 block text-xs text-gray-500">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };
