import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("shipments.status_update");
    const { id } = await params;
    const { newStatus, reason, notes } = await req.json();

    if (!newStatus) {
      return NextResponse.json({ message: "newStatus is required" }, { status: 400 });
    }

    const existing = await prisma.shipment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Shipment not found" }, { status: 404 });
    }

    const shipment = await prisma.shipment.update({
      where: { id },
      data: { status: newStatus, lastStatusUpdate: new Date(), updatedBy: session.id },
    });

    await prisma.shipmentStatusHistory.create({
      data: {
        shipmentId: id,
        oldStatus: existing.status,
        newStatus,
        changedBy: session.id,
        reason,
        notes,
        source: "MANUAL",
      },
    });

    if (newStatus === "DELIVERED") {
      const existingPod = await prisma.proofOfDelivery.findUnique({ where: { shipmentId: id } });
      if (!existingPod) {
        await prisma.proofOfDelivery.create({
          data: {
            shipmentId: id,
            deliveredAt: new Date(),
            createdBy: session.id,
          },
        });
      }
    }

    if (newStatus === "RETURN_PENDING") {
      await prisma.shipmentReturn.create({
        data: {
          shipmentId: id,
          reason: reason || "Status changed to return pending",
          status: "RETURN_PENDING",
          notes,
        },
      });
    }

    await createAuditLog({
      userId: session.id,
      action: "STATUS_UPDATE",
      entityType: "Shipment",
      entityId: id,
      oldValue: JSON.stringify({ status: existing.status }),
      newValue: JSON.stringify({ status: newStatus, reason, notes }),
    });

    return NextResponse.json({ data: shipment });
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
