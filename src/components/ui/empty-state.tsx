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
  className, icon, title, description, action, ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5 py-20 text-center animate-fade-in",
        className
      )}
      {...props}
    >
      <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-orange/10 to-brand-light-orange/20 text-brand-orange">
        {icon ?? <Inbox className="size-10" />}
      </div>
      <div className="max-w-sm space-y-1.5">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
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
