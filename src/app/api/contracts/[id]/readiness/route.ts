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
    const session = await requirePermission("contracts.view");
    const { id: contractId } = await params;

    const items = await prisma.contractReadinessItem.findMany({
      where: { contractId },
      orderBy: { sortOrder: "asc" },
    });

    const mandatory = items.filter((i) => i.isMandatory);
    const optional = items.filter((i) => !i.isMandatory);
    const completedMandatory = mandatory.filter((i) => i.isCompleted).length;
    const completedOptional = optional.filter((i) => i.isCompleted).length;
    const percentage = mandatory.length > 0 ? Math.round((completedMandatory / mandatory.length) * 100) : 0;

    return NextResponse.json({
      data: items,
      summary: {
        totalMandatory: mandatory.length,
        completedMandatory,
        totalOptional: optional.length,
        completedOptional,
        percentage,
      },
    });
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("contracts.manage");
    const { id: contractId } = await params;
    const body = await req.json();
    const items: Array<{ itemKey: string; isCompleted: boolean }> = body.items;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { message: "items array is required" },
        { status: 400 }
      );
    }

    for (const item of items) {
      await prisma.contractReadinessItem.updateMany({
        where: { contractId, itemKey: item.itemKey },
        data: { isCompleted: item.isCompleted },
      });
    }

    const updatedItems = await prisma.contractReadinessItem.findMany({
      where: { contractId },
      orderBy: { sortOrder: "asc" },
    });

    const mandatory = updatedItems.filter((i) => i.isMandatory);
    const completedMandatory = mandatory.filter((i) => i.isCompleted).length;
    const percentage = mandatory.length > 0 ? Math.round((completedMandatory / mandatory.length) * 100) : 0;

    let readinessStatus: string;
    if (percentage >= 100) readinessStatus = "COMPLETE";
    else if (percentage >= 50) readinessStatus = "IN_PROGRESS";
    else readinessStatus = "INCOMPLETE";

    await prisma.operationalContract.update({
      where: { id: contractId },
      data: { readinessStatus, updatedBy: session.id },
    });

    await createAuditLog({
      userId: session.id,
      action: "UPDATE",
      entityType: "ContractReadiness",
      entityId: contractId,
      newValue: JSON.stringify({ items, readinessStatus, percentage }),
    });

    return NextResponse.json({
      data: updatedItems,
      summary: {
        totalMandatory: mandatory.length,
        completedMandatory,
        percentage,
        readinessStatus,
      },
    });
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
