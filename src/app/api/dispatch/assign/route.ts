import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("dispatch.manage");
    const body = await req.json();
    const { shipmentId, driverId, notes } = body;

    if (!shipmentId || !driverId) {
      return NextResponse.json({ message: "shipmentId and driverId are required" }, { status: 400 });
    }

    const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) {
      return NextResponse.json({ message: "Shipment not found" }, { status: 404 });
    }

    if (!["READY_FOR_DISPATCH", "RECEIVED_FROM_PARTNER"].includes(shipment.status)) {
      return NextResponse.json({ message: "Shipment must be READY_FOR_DISPATCH or RECEIVED_FROM_PARTNER" }, { status: 400 });
    }

    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) {
      return NextResponse.json({ message: "Driver not found" }, { status: 404 });
    }
    if (driver.readinessStatus !== "READY") {
      return NextResponse.json({ message: "Driver is not ready" }, { status: 400 });
    }

    const assignment = await prisma.shipmentAssignment.create({
      data: { shipmentId, driverId, assignedBy: session.id, status: "ASSIGNED", notes },
    });

    const updated = await prisma.shipment.update({
      where: { id: shipmentId },
      data: { status: "ASSIGNED_TO_DRIVER", driverId, lastStatusUpdate: new Date(), updatedBy: session.id },
    });

    await prisma.shipmentStatusHistory.create({
      data: {
        shipmentId,
        oldStatus: shipment.status,
        newStatus: "ASSIGNED_TO_DRIVER",
        changedBy: session.id,
        reason: notes || "Assigned from dispatch",
        source: "DISPATCH",
      },
    });

    await createAuditLog({
      userId: session.id,
      action: "DISPATCH_ASSIGN",
      entityType: "Shipment",
      entityId: shipmentId,
      oldValue: JSON.stringify({ status: shipment.status, driverId: shipment.driverId }),
      newValue: JSON.stringify({ status: "ASSIGNED_TO_DRIVER", driverId }),
    });

    return NextResponse.json({ data: { assignment, shipment: updated } });
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
