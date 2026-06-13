export const SHIPMENT_STATUS_KEYS: Record<string, string> = {
  NEW: "status_new",
  RECEIVED_FROM_PARTNER: "status_received_from_partner",
  READY_FOR_DISPATCH: "status_ready_for_dispatch",
  ASSIGNED_TO_DRIVER: "status_assigned_to_driver",
  OUT_FOR_DELIVERY: "status_out_for_delivery",
  DELIVERED: "status_delivered",
  FAILED_DELIVERY: "status_failed_delivery",
  FAILED_ATTEMPT: "status_failed_attempt",
  RETURN_REQUESTED: "status_return_requested",
  RETURN_PENDING: "status_return_pending",
  RETURNED_TO_PARTNER: "status_returned_to_partner",
  ON_HOLD: "status_on_hold",
  NEEDS_REVIEW: "status_needs_review",
  CANCELLED: "status_cancelled",
};

export const ATTEMPT_STATUS_KEYS: Record<string, string> = {
  PENDING: "status_attempt_pending",
  SUCCESSFUL: "status_attempt_successful",
  FAILED: "status_attempt_failed",
};

export const RETURN_STATUS_KEYS: Record<string, string> = {
  PENDING: "status_return_pending",
  APPROVED: "status_return_approved",
  REJECTED: "status_return_rejected",
  PROCESSED: "status_return_processed",
};

export function getStatusKey(status: string, map: Record<string, string> = SHIPMENT_STATUS_KEYS): string | undefined {
  return map[status] || map[status.toUpperCase()];
}
