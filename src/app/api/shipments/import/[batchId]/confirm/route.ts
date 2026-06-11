import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const session = await requirePermission("shipments.import");
    const { batchId } = await params;

    const batch = await prisma.shipmentImportBatch.findUnique({
      where: { id: batchId },
      include: { rows: { where: { validationStatus: "VALID" } } },
    });

    if (!batch) {
      return NextResponse.json({ message: "Import batch not found" }, { status: 404 });
    }

    if (batch.status !== "VALIDATED") {
      return NextResponse.json({ message: "Batch must be in VALIDATED status to confirm" }, { status: 400 });
    }

    let confirmedCount = 0;

    for (const row of batch.rows) {
      const data = JSON.parse(row.normalizedData || row.rawData) as Record<string, string>;
      const trackingNumber = `AZM-${Date.now()}-${row.rowNumber}`;

      const shipment = await prisma.shipment.create({
        data: {
          trackingNumber,
          partnerId: batch.partnerId,
          contractId: batch.contractId,
          recipientName: data.recipientName || "",
          recipientPhone: data.recipientPhone || "",
          recipientEmail: data.recipientEmail || null,
          city: data.city || null,
          district: data.district || null,
          address: data.address || null,
          shortAddress: data.shortAddress || null,
          nationalAddress: data.nationalAddress || null,
          locationUrl: data.locationUrl || null,
          pieces: parseInt(data.pieces || "1"),
          packageDescription: data.packageDescription || null,
          deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
          deliveryWindow: data.deliveryWindow || null,
          status: "NEW",
          entrySource: "IMPORT",
          createdBy: session.id,
          updatedBy: session.id,
          partnerReference: data.partnerReference || null,
          orderNumber: data.orderNumber || null,
        },
      });

      await prisma.shipmentStatusHistory.create({
        data: {
          shipmentId: shipment.id,
          newStatus: "NEW",
          changedBy: session.id,
          source: "IMPORT",
        },
      });

      await prisma.shipmentImportRow.update({
        where: { id: row.id },
        data: { createdShipmentId: shipment.id },
      });

      confirmedCount++;
    }

    await prisma.shipmentImportBatch.update({
      where: { id: batchId },
      data: { status: "CONFIRMED", confirmedAt: new Date(), validRows: confirmedCount },
    });

    await createAuditLog({
      userId: session.id,
      action: "IMPORT_CONFIRM",
      entityType: "ShipmentImportBatch",
      entityId: batchId,
      newValue: JSON.stringify({ confirmed: confirmedCount }),
    });

    return NextResponse.json({ data: { confirmed: confirmedCount, batchId } });
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
