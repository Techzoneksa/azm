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
    const session = await requirePermission("shipments.assign");
    const { id } = await params;
    const body = await req.json();

    const shipment = await prisma.shipment.findUnique({ where: { id } });
    if (!shipment) {
      return NextResponse.json({ message: "Shipment not found" }, { status: 404 });
    }

    if (body.action === "unassign") {
      if (shipment.status !== "ASSIGNED_TO_DRIVER") {
        return NextResponse.json({ message: "Shipment is not currently assigned" }, { status: 400 });
      }

      const currentAssignment = await prisma.shipmentAssignment.findFirst({
        where: { shipmentId: id, status: "ASSIGNED" },
        orderBy: { assignedAt: "desc" },
      });

      if (currentAssignment) {
        await prisma.shipmentAssignment.update({
          where: { id: currentAssignment.id },
          data: { status: "UNASSIGNED", unassignedAt: new Date(), notes: body.notes || currentAssignment.notes },
        });
      }

      const updated = await prisma.shipment.update({
        where: { id },
        data: { status: "READY_FOR_DISPATCH", driverId: null, lastStatusUpdate: new Date(), updatedBy: session.id },
      });

      await prisma.shipmentStatusHistory.create({
        data: {
          shipmentId: id,
          oldStatus: shipment.status,
          newStatus: "READY_FOR_DISPATCH",
          changedBy: session.id,
          reason: body.notes || "Driver unassigned",
          source: "MANUAL",
        },
      });

      await createAuditLog({
        userId: session.id,
        action: "UNASSIGN_DRIVER",
        entityType: "Shipment",
        entityId: id,
        oldValue: JSON.stringify({ status: shipment.status, driverId: shipment.driverId }),
        newValue: JSON.stringify({ status: "READY_FOR_DISPATCH", driverId: null }),
      });

      return NextResponse.json({ data: updated });
    }

    if (!body.driverId) {
      return NextResponse.json({ message: "driverId is required" }, { status: 400 });
    }

    if (!["READY_FOR_DISPATCH", "RECEIVED_FROM_PARTNER"].includes(shipment.status)) {
      return NextResponse.json({ message: "Shipment must be READY_FOR_DISPATCH or RECEIVED_FROM_PARTNER to assign" }, { status: 400 });
    }

    const driver = await prisma.driver.findUnique({ where: { id: body.driverId } });
    if (!driver) {
      return NextResponse.json({ message: "Driver not found" }, { status: 404 });
    }
    if (driver.readinessStatus !== "READY") {
      return NextResponse.json({ message: "Driver is not ready for assignments" }, { status: 400 });
    }

    const assignment = await prisma.shipmentAssignment.create({
      data: {
        shipmentId: id,
        driverId: body.driverId,
        assignedBy: session.id,
        status: "ASSIGNED",
        notes: body.notes,
      },
    });

    const updated = await prisma.shipment.update({
      where: { id },
      data: { status: "ASSIGNED_TO_DRIVER", driverId: body.driverId, lastStatusUpdate: new Date(), updatedBy: session.id },
    });

    await prisma.shipmentStatusHistory.create({
      data: {
        shipmentId: id,
        oldStatus: shipment.status,
        newStatus: "ASSIGNED_TO_DRIVER",
        changedBy: session.id,
        reason: body.notes || "Driver assigned",
        source: "MANUAL",
      },
    });

    await createAuditLog({
      userId: session.id,
      action: "ASSIGN_DRIVER",
      entityType: "Shipment",
      entityId: id,
      oldValue: JSON.stringify({ status: shipment.status, driverId: shipment.driverId }),
      newValue: JSON.stringify({ status: "ASSIGNED_TO_DRIVER", driverId: body.driverId }),
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
