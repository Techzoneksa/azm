import "server-only";
import { prisma } from "./prisma";
import { requireRole, requirePermission } from "./auth";

export const DRIVER_ROLE = "DRIVER";
export const DRIVER_PERMISSIONS = {
  ACCESS: "driver_app.access",
  VIEW_SHIPMENTS: "driver_shipments.view",
  UPDATE_STATUS: "driver_shipments.update_status",
  CREATE_ATTEMPT: "driver_attempts.create",
  CREATE_POD: "driver_pod.create",
  VIEW_RETURNS: "driver_returns.view",
  UPDATE_RETURNS: "driver_returns.update",
  MANAGE_SHIFT: "driver_shift.manage",
  VIEW_PROFILE: "driver_profile.view",
} as const;

export async function requireDriver(): Promise<{ userId: string; driverId: string; fullName: string }> {
  const session = await requireRole([DRIVER_ROLE]);
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { driver: true },
  });
  if (!user?.driver) {
    throw new Error("User is not linked to a driver record");
  }
  return { userId: user.id, driverId: user.driver.id, fullName: user.fullName };
}

export async function requireDriverPermission(permission: string) {
  return requirePermission(permission);
}

export async function assertShipmentOwnership(shipmentId: string, driverId: string) {
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    select: { driverId: true, status: true },
  });
  if (!shipment) {
    throw new Error("Shipment not found");
  }
  if (shipment.driverId !== driverId) {
    throw new Error("Forbidden");
  }
  return shipment;
}

export async function logFieldActivity(params: {
  driverId: string;
  shipmentId?: string;
  shiftId?: string;
  type: string;
  description?: string;
  locationLat?: number;
  locationLng?: number;
  deviceInfo?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.fieldActivityLog.create({
      data: {
        driverId: params.driverId,
        shipmentId: params.shipmentId,
        shiftId: params.shiftId,
        type: params.type,
        description: params.description,
        locationLat: params.locationLat,
        locationLng: params.locationLng,
        deviceInfo: params.deviceInfo,
        metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
      },
    });
  } catch {
    console.error("Failed to log field activity");
  }
}

export async function getActiveShift(driverId: string) {
  return prisma.driverShift.findFirst({
    where: { driverId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
}

export function getDriverStatuses() {
  return {
    allowed: [
      "OUT_FOR_DELIVERY",
      "CUSTOMER_NOT_RESPONDING",
      "CUSTOMER_REQUESTED_RESCHEDULE",
      "WRONG_ADDRESS",
      "CUSTOMER_REFUSED",
      "CANNOT_ACCESS_LOCATION",
      "DELIVERED",
      "RETURN_PENDING",
    ] as string[],
    blocked: ["CANCELLED", "LOST_PACKAGE", "DAMAGED_PACKAGE", "RETURNED_TO_PARTNER"] as string[],
  };
}
