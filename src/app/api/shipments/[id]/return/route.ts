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
    const session = await requirePermission("returns.manage");
    const { id } = await params;
    const body = await req.json();
    const { reason, status, returnDueAt, notes } = body;

    if (!reason) {
      return NextResponse.json({ message: "reason is required" }, { status: 400 });
    }

    const shipment = await prisma.shipment.findUnique({ where: { id } });
    if (!shipment) {
      return NextResponse.json({ message: "Shipment not found" }, { status: 404 });
    }

    const shipmentReturn = await prisma.shipmentReturn.create({
      data: {
        shipmentId: id,
        reason,
        status: status || "RETURN_PENDING",
        returnDueAt: returnDueAt ? new Date(returnDueAt) : null,
        notes,
      },
    });

    await prisma.shipment.update({
      where: { id },
      data: { status: "RETURN_PENDING", lastStatusUpdate: new Date(), updatedBy: session.id },
    });

    await prisma.shipmentStatusHistory.create({
      data: {
        shipmentId: id,
        oldStatus: shipment.status,
        newStatus: "RETURN_PENDING",
        changedBy: session.id,
        reason,
        source: "RETURN",
      },
    });

    await createAuditLog({
      userId: session.id,
      action: "CREATE_RETURN",
      entityType: "ShipmentReturn",
      entityId: shipmentReturn.id,
      newValue: JSON.stringify({ reason, status, returnDueAt, notes }),
    });

    return NextResponse.json({ data: shipmentReturn }, { status: 201 });
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
