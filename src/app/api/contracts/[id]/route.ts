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
    const { id } = await params;

    const contract = await prisma.operationalContract.findUnique({
      where: { id },
      include: {
        partner: { select: { id: true, tradingNameAr: true } },
        readinessItems: { orderBy: { sortOrder: "asc" } },
        coverageAreas: true,
      },
    });

    if (!contract) {
      return NextResponse.json({ message: "Contract not found" }, { status: 404 });
    }

    return NextResponse.json({ data: contract });
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
    const session = await requirePermission("contracts.manage");
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.operationalContract.findUnique({
      where: { id },
      include: { readinessItems: true },
    });
    if (!existing) {
      return NextResponse.json({ message: "Contract not found" }, { status: 404 });
    }

    if (body.status === "ACTIVE" && existing.status !== "ACTIVE") {
      const incomplete = existing.readinessItems.filter(
        (item) => item.isMandatory && !item.isCompleted
      );
      if (incomplete.length > 0) {
        return NextResponse.json(
          {
            message: "Cannot activate contract. Mandatory readiness items are incomplete.",
            incompleteItems: incomplete.map((i) => ({ id: i.id, name: i.name, itemKey: i.itemKey })),
          },
          { status: 400 }
        );
      }
    }

    const contract = await prisma.operationalContract.update({
      where: { id },
      data: { ...body, updatedBy: session.id },
      include: {
        partner: { select: { id: true, tradingNameAr: true } },
        readinessItems: { orderBy: { sortOrder: "asc" } },
        coverageAreas: true,
      },
    });

    await createAuditLog({
      userId: session.id,
      action: "PATCH",
      entityType: "OperationalContract",
      entityId: id,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(body),
    });

    return NextResponse.json({ data: contract });
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
    const session = await requirePermission("contracts.manage");
    const { id } = await params;

    const existing = await prisma.operationalContract.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Contract not found" }, { status: 404 });
    }

    await prisma.operationalContract.update({
      where: { id },
      data: { isActive: false, updatedBy: session.id },
    });

    await createAuditLog({
      userId: session.id,
      action: "DELETE",
      entityType: "OperationalContract",
      entityId: id,
      oldValue: JSON.stringify(existing),
    });

    return NextResponse.json({ message: "Deleted successfully" });
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
