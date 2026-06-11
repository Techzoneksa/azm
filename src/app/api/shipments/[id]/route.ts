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
    const session = await requirePermission("shipments.view");
    const { id } = await params;

    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        partner: { select: { id: true, tradingNameAr: true, tradingNameEn: true, primaryPhone: true } },
        contract: { select: { id: true, name: true, contractNumber: true } },
        pickupPoint: true,
        coverageArea: true,
        driver: { select: { id: true, fullName: true, phone: true, plateNumber: true } },
        proofOfDelivery: true,
        returns: { orderBy: { createdAt: "desc" } },
        statusHistory: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    });

    if (!shipment) {
      return NextResponse.json({ message: "Shipment not found" }, { status: 404 });
    }

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("shipments.manage");
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.shipment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Shipment not found" }, { status: 404 });
    }

    const statusChanged = body.status && body.status !== existing.status;

    const shipment = await prisma.shipment.update({
      where: { id },
      data: {
        ...body,
        updatedBy: session.id,
        lastStatusUpdate: statusChanged ? new Date() : undefined,
      },
    });

    if (statusChanged) {
      await prisma.shipmentStatusHistory.create({
        data: {
          shipmentId: id,
          oldStatus: existing.status,
          newStatus: body.status,
          changedBy: session.id,
          source: "MANUAL",
        },
      });
    }

    await createAuditLog({
      userId: session.id,
      action: "PATCH",
      entityType: "Shipment",
      entityId: id,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(body),
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("shipments.manage");
    const { id } = await params;

    const existing = await prisma.shipment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Shipment not found" }, { status: 404 });
    }

    const shipment = await prisma.shipment.update({
      where: { id },
      data: { status: "CANCELLED", updatedBy: session.id, lastStatusUpdate: new Date() },
    });

    await prisma.shipmentStatusHistory.create({
      data: {
        shipmentId: id,
        oldStatus: existing.status,
        newStatus: "CANCELLED",
        changedBy: session.id,
        reason: "Shipment cancelled",
        source: "MANUAL",
      },
    });

    await createAuditLog({
      userId: session.id,
      action: "DELETE",
      entityType: "Shipment",
      entityId: id,
      oldValue: JSON.stringify(existing),
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
