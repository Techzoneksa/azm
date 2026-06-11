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
    const session = await requirePermission("coverage_areas.view");
    const { id } = await params;

    const area = await prisma.coverageArea.findUnique({
      where: { id },
      include: {
        partner: { select: { id: true, tradingNameAr: true } },
        contract: { select: { id: true, name: true } },
      },
    });

    if (!area) {
      return NextResponse.json({ message: "Coverage area not found" }, { status: 404 });
    }

    return NextResponse.json({ data: area });
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
    const session = await requirePermission("coverage_areas.manage");
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.coverageArea.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Coverage area not found" }, { status: 404 });
    }

    const area = await prisma.coverageArea.update({
      where: { id },
      data: { ...body, updatedBy: session.id },
      include: {
        partner: { select: { id: true, tradingNameAr: true } },
        contract: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      userId: session.id,
      action: "PATCH",
      entityType: "CoverageArea",
      entityId: id,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(body),
    });

    return NextResponse.json({ data: area });
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
    const session = await requirePermission("coverage_areas.manage");
    const { id } = await params;

    const existing = await prisma.coverageArea.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Coverage area not found" }, { status: 404 });
    }

    await prisma.coverageArea.update({
      where: { id },
      data: { isActive: false, updatedBy: session.id },
    });

    await createAuditLog({
      userId: session.id,
      action: "DELETE",
      entityType: "CoverageArea",
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
