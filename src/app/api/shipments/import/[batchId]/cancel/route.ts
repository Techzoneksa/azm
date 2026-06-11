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

    const batch = await prisma.shipmentImportBatch.findUnique({ where: { id: batchId } });
    if (!batch) {
      return NextResponse.json({ message: "Import batch not found" }, { status: 404 });
    }

    await prisma.shipmentImportBatch.update({
      where: { id: batchId },
      data: { status: "CANCELLED" },
    });

    await createAuditLog({
      userId: session.id,
      action: "IMPORT_CANCEL",
      entityType: "ShipmentImportBatch",
      entityId: batchId,
      oldValue: JSON.stringify({ status: batch.status }),
      newValue: JSON.stringify({ status: "CANCELLED" }),
    });

    return NextResponse.json({ data: { batchId, status: "CANCELLED" } });
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
