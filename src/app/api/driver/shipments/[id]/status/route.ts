import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDriver, assertShipmentOwnership, getActiveShift, logFieldActivity, getDriverStatuses } from "@/lib/driver-auth";
import { createAuditLog } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, driverId } = await requireDriver();
    const { id } = await params;
    const { newStatus, reason, notes, locationLat, locationLng } = await req.json();

    if (!newStatus) {
      return NextResponse.json({ error: "newStatus is required" }, { status: 400 });
    }

    const { allowed, blocked } = getDriverStatuses();

    if (blocked.includes(newStatus)) {
      return NextResponse.json(
        { error: `Cannot set status to ${newStatus}. This status is restricted.` },
        { status: 400 }
      );
    }

    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        { error: `Invalid status: ${newStatus}` },
        { status: 400 }
      );
    }

    const shipment = await assertShipmentOwnership(id, driverId);

    if (newStatus === "OUT_FOR_DELIVERY") {
      const activeShift = await getActiveShift(driverId);
      if (!activeShift) {
        return NextResponse.json(
          { error: "You must start a shift before setting shipments to OUT_FOR_DELIVERY" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.shipment.update({
      where: { id },
      data: { status: newStatus, lastStatusUpdate: new Date(), updatedBy: userId },
    });

    await prisma.shipmentStatusHistory.create({
      data: {
        shipmentId: id,
        oldStatus: shipment.status,
        newStatus,
        changedBy: userId,
        reason,
        notes,
        source: "DRIVER_APP",
      },
    });

    if (newStatus === "RETURN_PENDING") {
      const existingReturn = await prisma.shipmentReturn.findFirst({
        where: { shipmentId: id },
      });
      if (!existingReturn) {
        await prisma.shipmentReturn.create({
          data: {
            shipmentId: id,
            reason: reason || "Marked as return pending by driver",
            status: "RETURN_PENDING",
            notes,
          },
        });
      }
    }

    await createAuditLog({
      userId,
      action: "DRIVER_STATUS_UPDATE",
      entityType: "Shipment",
      entityId: id,
      oldValue: JSON.stringify({ status: shipment.status }),
      newValue: JSON.stringify({ status: newStatus, reason, notes }),
    });

    await logFieldActivity({
      driverId,
      shipmentId: id,
      type: "STATUS_UPDATE",
      description: `Status changed from ${shipment.status} to ${newStatus}`,
      locationLat,
      locationLng,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message === "Unauthorized"
          ? "Unauthorized"
          : error.message === "Shipment not found"
            ? "Shipment not found"
            : error.message === "Forbidden"
              ? "Forbidden"
              : "Internal server error"
        : "Internal server error";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : message === "Shipment not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
