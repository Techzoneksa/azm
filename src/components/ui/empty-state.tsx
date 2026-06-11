import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Inbox } from "lucide-react";
import { Button, type ButtonProps } from "./button";

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  } & Partial<ButtonProps>;
}

function EmptyState({
  className,
  icon,
  title,
  description,
  action,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-16 text-center",
        className
      )}
      {...props}
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        {icon ?? <Inbox className="size-8" />}
      </div>
      <div className="max-w-sm space-y-1">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </div>
      {action && (
        <Button
          variant={action.variant ?? "default"}
          size={action.size ?? "default"}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

export { EmptyState };
