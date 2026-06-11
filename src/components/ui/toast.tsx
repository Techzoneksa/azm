"use client";

import { forwardRef, type HTMLAttributes, useState, useCallback } from "react";
import { cn } from "@/lib/cn";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const variantMap = {
  success: "border-green-200 bg-green-50 text-green-800 [&_svg]:text-green-600",
  error: "border-red-200 bg-red-50 text-red-800 [&_svg]:text-red-600",
  warning: "border-amber-200 bg-amber-50 text-amber-800 [&_svg]:text-amber-600",
  info: "border-brand-border bg-brand-light-bg text-brand-dark-blue [&_svg]:text-brand-dark-blue",
};

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  type?: ToastType;
  message: string;
  onClose?: () => void;
  duration?: number;
}

const Toast = forwardRef<HTMLDivElement, ToastProps>(
  ({ className, type = "info", message, onClose, duration, ...props }, ref) => {
    const Icon = iconMap[type];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg",
          variantMap[type],
          className
        )}
        {...props}
      >
        <Icon className="mt-0.5 size-5 shrink-0" />
        <p className="flex-1 text-sm font-medium">{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="shrink-0 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand-orange"
          >
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </button>
        )}
      </div>
    );
  }
);
Toast.displayName = "Toast";

function useToast() {
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([]);

  const addToast = useCallback(
    (props: Omit<ToastProps, "onClose"> & { id?: string }) => {
      const id = props.id ?? crypto.randomUUID();
      const toast = { ...props, id, onClose: () => removeToast(id) };
      setToasts((prev) => [...prev, toast]);

      if (props.duration !== 0) {
        setTimeout(() => removeToast(id), props.duration ?? 4000);
      }

      return id;
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

export { Toast, useToast };
