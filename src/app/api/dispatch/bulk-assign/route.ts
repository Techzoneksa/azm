import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("dispatch.manage");
    const body = await req.json();
    const { shipmentIds, driverId, notes } = body;

    if (!shipmentIds || !Array.isArray(shipmentIds) || shipmentIds.length === 0) {
      return NextResponse.json({ message: "shipmentIds array is required" }, { status: 400 });
    }
    if (!driverId) {
      return NextResponse.json({ message: "driverId is required" }, { status: 400 });
    }

    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) {
      return NextResponse.json({ message: "Driver not found" }, { status: 404 });
    }
    if (driver.readinessStatus !== "READY") {
      return NextResponse.json({ message: "Driver is not ready" }, { status: 400 });
    }

    const results = { processed: 0, failed: 0, errors: [] as { id: string; error: string }[] };

    for (const shipmentId of shipmentIds) {
      try {
        const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
        if (!shipment) {
          results.failed++;
          results.errors.push({ id: shipmentId, error: "Shipment not found" });
          continue;
        }
        if (!["READY_FOR_DISPATCH", "RECEIVED_FROM_PARTNER"].includes(shipment.status)) {
          results.failed++;
          results.errors.push({ id: shipmentId, error: "Shipment is not assignable" });
          continue;
        }

        await prisma.shipmentAssignment.create({
          data: { shipmentId, driverId, assignedBy: session.id, status: "ASSIGNED", notes },
        });

        await prisma.shipment.update({
          where: { id: shipmentId },
          data: { status: "ASSIGNED_TO_DRIVER", driverId, lastStatusUpdate: new Date(), updatedBy: session.id },
        });

        await prisma.shipmentStatusHistory.create({
          data: {
            shipmentId,
            oldStatus: shipment.status,
            newStatus: "ASSIGNED_TO_DRIVER",
            changedBy: session.id,
            source: "DISPATCH",
          },
        });

        results.processed++;
      } catch (err) {
        results.failed++;
        results.errors.push({ id: shipmentId, error: err instanceof Error ? err.message : "Unknown error" });
      }
    }

    await createAuditLog({
      userId: session.id,
      action: "DISPATCH_BULK_ASSIGN",
      entityType: "Shipment",
      newValue: JSON.stringify({ driverId, shipmentIds, results }),
    });

    return NextResponse.json({ data: results });
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
