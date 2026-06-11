import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("shipments.manage");
    const body = await req.json();
    const { action, shipmentIds } = body;

    if (!action || !shipmentIds || !Array.isArray(shipmentIds) || shipmentIds.length === 0) {
      return NextResponse.json({ message: "action and shipmentIds array are required" }, { status: 400 });
    }

    const results = { processed: 0, failed: 0, errors: [] as { id: string; error: string }[] };

    for (const id of shipmentIds) {
      try {
        const shipment = await prisma.shipment.findUnique({ where: { id } });
        if (!shipment) {
          results.failed++;
          results.errors.push({ id, error: "Shipment not found" });
          continue;
        }

        switch (action) {
          case "change_status": {
            const { newStatus } = body;
            if (!newStatus) {
              results.failed++;
              results.errors.push({ id, error: "newStatus is required" });
              continue;
            }
            await prisma.shipment.update({
              where: { id },
              data: { status: newStatus, lastStatusUpdate: new Date(), updatedBy: session.id },
            });
            await prisma.shipmentStatusHistory.create({
              data: {
                shipmentId: id,
                oldStatus: shipment.status,
                newStatus,
                changedBy: session.id,
                source: "BULK",
              },
            });
            break;
          }
          case "assign": {
            const { driverId } = body;
            if (!driverId) {
              results.failed++;
              results.errors.push({ id, error: "driverId is required" });
              continue;
            }
            if (shipment.status !== "READY_FOR_DISPATCH") {
              results.failed++;
              results.errors.push({ id, error: "Shipment must be READY_FOR_DISPATCH" });
              continue;
            }
            const driver = await prisma.driver.findUnique({ where: { id: driverId } });
            if (!driver || driver.readinessStatus !== "READY") {
              results.failed++;
              results.errors.push({ id, error: "Driver not found or not ready" });
              continue;
            }
            await prisma.shipmentAssignment.create({
              data: {
                shipmentId: id,
                driverId,
                assignedBy: session.id,
                status: "ASSIGNED",
                notes: body.notes,
              },
            });
            await prisma.shipment.update({
              where: { id },
              data: { status: "ASSIGNED_TO_DRIVER", driverId, lastStatusUpdate: new Date(), updatedBy: session.id },
            });
            await prisma.shipmentStatusHistory.create({
              data: {
                shipmentId: id,
                oldStatus: shipment.status,
                newStatus: "ASSIGNED_TO_DRIVER",
                changedBy: session.id,
                source: "BULK",
              },
            });
            break;
          }
          case "ready_for_dispatch": {
            await prisma.shipment.update({
              where: { id },
              data: { status: "READY_FOR_DISPATCH", lastStatusUpdate: new Date(), updatedBy: session.id },
            });
            await prisma.shipmentStatusHistory.create({
              data: {
                shipmentId: id,
                oldStatus: shipment.status,
                newStatus: "READY_FOR_DISPATCH",
                changedBy: session.id,
                source: "BULK",
              },
            });
            break;
          }
          case "needs_review": {
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
                source: "BULK",
              },
            });
            break;
          }
          case "bulk_export": {
            break;
          }
          default:
            results.failed++;
            results.errors.push({ id, error: `Unknown action: ${action}` });
            continue;
        }

        results.processed++;
      } catch (err) {
        results.failed++;
        results.errors.push({ id, error: err instanceof Error ? err.message : "Unknown error" });
      }
    }

    await createAuditLog({
      userId: session.id,
      action: "BULK_ACTION",
      entityType: "Shipment",
      newValue: JSON.stringify({ action, shipmentIds, results }),
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
