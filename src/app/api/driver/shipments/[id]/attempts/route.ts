import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDriver, assertShipmentOwnership, logFieldActivity } from "@/lib/driver-auth";
import { createAuditLog } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, driverId } = await requireDriver();
    const { id } = await params;
    const { status, notes, locationLat, locationLng } = await req.json();

    await assertShipmentOwnership(id, driverId);

    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: { contract: true },
    });

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    const existingCount = await prisma.deliveryAttempt.count({
      where: { shipmentId: id },
    });
    const attemptNumber = existingCount + 1;

    const attempt = await prisma.deliveryAttempt.create({
      data: {
        shipmentId: id,
        driverId,
        attemptNumber,
        status: status || "FAILED",
        reason: status,
        notes,
        locationLat,
        locationLng,
        createdBy: userId,
      },
    });

    const maxAttempts = (shipment.contract?.deliveryAttempts as number) ?? 2;

    if (attemptNumber >= maxAttempts) {
      await prisma.shipment.update({
        where: { id },
        data: { status: "RETURN_PENDING", lastStatusUpdate: new Date(), updatedBy: userId },
      });

      await prisma.shipmentStatusHistory.create({
        data: {
          shipmentId: id,
          oldStatus: shipment.status,
          newStatus: "RETURN_PENDING",
          changedBy: userId,
          reason: `Max delivery attempts (${maxAttempts}) reached`,
          source: "DELIVERY_ATTEMPT",
        },
      });

      const existingReturn = await prisma.shipmentReturn.findFirst({
        where: { shipmentId: id },
      });
      if (!existingReturn) {
        await prisma.shipmentReturn.create({
          data: {
            shipmentId: id,
            reason: `Max delivery attempts (${maxAttempts}) reached`,
            status: "RETURN_PENDING",
            notes,
          },
        });
      }
    } else {
      await prisma.shipment.update({
        where: { id },
        data: { status: "FAILED_ATTEMPT", lastStatusUpdate: new Date(), updatedBy: userId },
      });

      await prisma.shipmentStatusHistory.create({
        data: {
          shipmentId: id,
          oldStatus: shipment.status,
          newStatus: "FAILED_ATTEMPT",
          changedBy: userId,
          reason: status,
          notes,
          source: "DELIVERY_ATTEMPT",
        },
      });
    }

    await createAuditLog({
      userId,
      action: "CREATE_DELIVERY_ATTEMPT",
      entityType: "DeliveryAttempt",
      entityId: attempt.id,
      newValue: JSON.stringify({ attemptNumber, status }),
    });

    await logFieldActivity({
      driverId,
      shipmentId: id,
      type: "DELIVERY_ATTEMPT",
      description: `Delivery attempt #${attemptNumber} - ${status || "FAILED"}`,
      locationLat,
      locationLng,
    });

    return NextResponse.json({ data: attempt }, { status: 201 });
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
