import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("delivery_attempts.view");
    const { id } = await params;

    const attempts = await prisma.deliveryAttempt.findMany({
      where: { shipmentId: id },
      include: { driver: { select: { id: true, fullName: true, phone: true } } },
      orderBy: { attemptNumber: "desc" },
    });

    return NextResponse.json({ data: attempts });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message === "Unauthorized"
          ? "Unauthorized"
          : error.message === "Forbidden"
            ? "Forbidden"
            : "Internal server error"
        : "Internal server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("delivery_attempts.manage");
    const { id } = await params;
    const body = await req.json();
    const { status, reason, notes, nextAttemptAt, evidenceFile, locationLat, locationLng } = body;

    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: { contract: true },
    });
    if (!shipment) {
      return NextResponse.json({ message: "Shipment not found" }, { status: 404 });
    }

    const existingCount = await prisma.deliveryAttempt.count({ where: { shipmentId: id } });
    const attemptNumber = existingCount + 1;

    const attempt = await prisma.deliveryAttempt.create({
      data: {
        shipmentId: id,
        driverId: shipment.driverId,
        attemptNumber,
        status: status || "FAILED",
        reason,
        notes,
        nextAttemptAt: nextAttemptAt ? new Date(nextAttemptAt) : null,
        evidenceFile,
        locationLat,
        locationLng,
        createdBy: session.id,
      },
    });

    if (status === "SUCCESS") {
      await prisma.shipment.update({
        where: { id },
        data: { status: "DELIVERED", lastStatusUpdate: new Date(), updatedBy: session.id },
      });

      const existingPod = await prisma.proofOfDelivery.findUnique({ where: { shipmentId: id } });
      if (!existingPod) {
        await prisma.proofOfDelivery.create({
          data: { shipmentId: id, deliveredAt: new Date(), createdBy: session.id },
        });
      }

      await prisma.shipmentStatusHistory.create({
        data: {
          shipmentId: id,
          oldStatus: shipment.status,
          newStatus: "DELIVERED",
          changedBy: session.id,
          reason: "Delivery successful",
          source: "DELIVERY_ATTEMPT",
        },
      });
    } else {
      const maxAttempts = (shipment.contract?.deliveryAttempts as number) || 2;

      if (attemptNumber >= maxAttempts) {
        await prisma.shipment.update({
          where: { id },
          data: { status: "NEEDS_REVIEW", lastStatusUpdate: new Date(), updatedBy: session.id },
        });

        await prisma.shipmentStatusHistory.create({
          data: {
            shipmentId: id,
            oldStatus: shipment.status,
            newStatus: "NEEDS_REVIEW",
            changedBy: session.id,
            reason: `Max delivery attempts (${maxAttempts}) reached`,
            source: "DELIVERY_ATTEMPT",
          },
        });
      } else {
        await prisma.shipment.update({
          where: { id },
          data: { status: status || "FAILED_ATTEMPT", lastStatusUpdate: new Date(), updatedBy: session.id },
        });

        await prisma.shipmentStatusHistory.create({
          data: {
            shipmentId: id,
            oldStatus: shipment.status,
            newStatus: status || "FAILED_ATTEMPT",
            changedBy: session.id,
            reason,
            source: "DELIVERY_ATTEMPT",
          },
        });
      }
    }

    await createAuditLog({
      userId: session.id,
      action: "CREATE_DELIVERY_ATTEMPT",
      entityType: "DeliveryAttempt",
      entityId: attempt.id,
      newValue: JSON.stringify({ attemptNumber, status, reason }),
    });

    return NextResponse.json({ data: attempt }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message === "Unauthorized"
          ? "Unauthorized"
          : error.message === "Forbidden"
            ? "Forbidden"
            : "Internal server error"
        : "Internal server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ message }, { status });
  }
}
