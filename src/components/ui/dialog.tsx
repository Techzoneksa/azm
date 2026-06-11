"use client";

import {
  forwardRef,
  createContext,
  useContext,
  type HTMLAttributes,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { cn } from "@/lib/cn";
import { X } from "lucide-react";

interface DialogContextValue {
  open: boolean;
  onClose: () => void;
}

const DialogContext = createContext<DialogContextValue>({
  open: false,
  onClose: () => {},
});

const Dialog = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>(({ open = false, onOpenChange, children, className, ...props }, ref) => {
  const onClose = useCallback(() => onOpenChange?.(false), [onOpenChange]);

  return (
    <DialogContext.Provider value={{ open, onClose }}>
      {open && (
        <div ref={ref} className={cn("relative", className)} {...props}>
          {children}
        </div>
      )}
    </DialogContext.Provider>
  );
});
Dialog.displayName = "Dialog";

const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog components must be used within a Dialog");
  }
  return context;
};

const DialogOverlay = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { onClose } = useDialog();

    return (
      <div
        ref={ref}
        className={cn(
          "fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out",
          className
        )}
        onClick={onClose}
        {...props}
      />
    );
  }
);
DialogOverlay.displayName = "DialogOverlay";

const DialogContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { onClose } = useDialog();
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "";
      };
    }, [onClose]);

    return (
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        {...props}
      >
        <DialogOverlay />
        <div
          ref={contentRef}
          className={cn(
            "relative z-50 w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-lg",
            className
          )}
        >
          <button
            onClick={onClose}
            className="absolute end-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2"
          >
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </button>
          {children}
        </div>
      </div>
    );
  }
);
DialogContent.displayName = "DialogContent";

const DialogHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "mb-4 flex flex-col space-y-1.5 text-center sm:text-start",
        className
      )}
      {...props}
    />
  )
);
DialogHeader.displayName = "DialogHeader";

const DialogTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
);
DialogTitle.displayName = "DialogTitle";

const DialogDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-gray-500", className)}
      {...props}
    />
  )
);
DialogDescription.displayName = "DialogDescription";

const DialogFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2",
        className
      )}
      {...props}
    />
  )
);
DialogFooter.displayName = "DialogFooter";

export {
  Dialog,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};
