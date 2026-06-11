import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const session = await requirePermission("shipments.import");
    const { batchId } = await params;

    const batch = await prisma.shipmentImportBatch.findUnique({
      where: { id: batchId },
      include: {
        partner: { select: { id: true, tradingNameAr: true, tradingNameEn: true } },
        contract: { select: { id: true, name: true, contractNumber: true } },
        rows: { orderBy: { rowNumber: "asc" } },
      },
    });

    if (!batch) {
      return NextResponse.json({ message: "Import batch not found" }, { status: 404 });
    }

    return NextResponse.json({ data: batch });
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
