import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("returns.manage");
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.shipmentReturn.findUnique({
      where: { id },
      include: { shipment: true },
    });
    if (!existing) {
      return NextResponse.json({ message: "Return not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { ...body };
    if (body.returnDueAt) updateData.returnDueAt = new Date(body.returnDueAt);
    if (body.returnedAt) updateData.returnedAt = new Date(body.returnedAt);

    const shipmentReturn = await prisma.shipmentReturn.update({
      where: { id },
      data: updateData,
    });

    if (body.status === "RETURNED_TO_PARTNER") {
      await prisma.shipment.update({
        where: { id: existing.shipmentId },
        data: { status: "RETURNED_TO_PARTNER", lastStatusUpdate: new Date(), updatedBy: session.id },
      });

      await prisma.shipmentStatusHistory.create({
        data: {
          shipmentId: existing.shipmentId,
          oldStatus: existing.shipment?.status,
          newStatus: "RETURNED_TO_PARTNER",
          changedBy: session.id,
          source: "RETURN",
        },
      });
    }

    await createAuditLog({
      userId: session.id,
      action: "PATCH",
      entityType: "ShipmentReturn",
      entityId: id,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(body),
    });

    return NextResponse.json({ data: shipmentReturn });
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("returns.manage");
    const { id } = await params;

    const existing = await prisma.shipmentReturn.findUnique({
      where: { id },
      include: { shipment: true },
    });
    if (!existing) {
      return NextResponse.json({ message: "Return not found" }, { status: 404 });
    }

    if (!["RETURN_PENDING", "CANCELLED"].includes(existing.status)) {
      return NextResponse.json({ message: "Can only cancel returns with RETURN_PENDING or CANCELLED status" }, { status: 400 });
    }

    const shipmentReturn = await prisma.shipmentReturn.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    await createAuditLog({
      userId: session.id,
      action: "DELETE",
      entityType: "ShipmentReturn",
      entityId: id,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify({ status: "CANCELLED" }),
    });

    return NextResponse.json({ data: shipmentReturn });
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
