import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Badge, type BadgeProps } from "./badge";

type StatusValue = string | number | boolean | null | undefined;

interface StatusConfig {
  label: string;
  variant: BadgeProps["variant"];
}

const defaultStatusMap: Record<string, StatusConfig> = {
  ready: { label: "Ready", variant: "success" },
  not_ready: { label: "Not Ready", variant: "destructive" },
  partially_ready: { label: "Partially Ready", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  pending: { label: "Pending", variant: "warning" },
  in_progress: { label: "In Progress", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
  expired: { label: "Expired", variant: "destructive" },
  valid: { label: "Valid", variant: "success" },
  invalid: { label: "Invalid", variant: "destructive" },
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "secondary" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
  submitted: { label: "Submitted", variant: "default" },
  draft: { label: "Draft", variant: "secondary" },
  compliant: { label: "Compliant", variant: "success" },
  non_compliant: { label: "Non-Compliant", variant: "destructive" },
  warning: { label: "Warning", variant: "warning" },
  true: { label: "Yes", variant: "success" },
  false: { label: "No", variant: "secondary" },
};

export interface StatusBadgeProps extends HTMLAttributes<HTMLDivElement> {
  status: StatusValue;
  customMap?: Record<string, StatusConfig>;
  uppercase?: boolean;
}

function resolveStatusConfig(
  status: StatusValue,
  customMap?: Record<string, StatusConfig>
): StatusConfig {
  if (status === null || status === undefined) {
    return { label: "N/A", variant: "outline" };
  }

  const key = String(status).toLowerCase();

  if (customMap?.[key]) return customMap[key];
  if (defaultStatusMap[key]) return defaultStatusMap[key];

  return { label: String(status), variant: "secondary" };
}

function StatusBadge({
  status,
  customMap,
  uppercase = false,
  className,
  ...props
}: StatusBadgeProps) {
  const config = resolveStatusConfig(status, customMap);

  return (
    <Badge
      variant={config.variant}
      className={cn(uppercase && "uppercase", className)}
      {...props}
    >
      {config.label}
    </Badge>
  );
}

export { StatusBadge, defaultStatusMap, type StatusConfig };
