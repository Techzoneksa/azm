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
    const session = await requirePermission("partners.view");
    const { id } = await params;

    const partner = await prisma.partner.findUnique({
      where: { id },
      include: {
        contacts: true,
        contracts: true,
        pickupPoints: true,
        coverageAreas: true,
        requirements: true,
        integration: true,
        activities: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!partner) {
      return NextResponse.json({ message: "Partner not found" }, { status: 404 });
    }

    return NextResponse.json({ data: partner });
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
    const session = await requirePermission("partners.manage");
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.partner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Partner not found" }, { status: 404 });
    }

    const partner = await prisma.partner.update({
      where: { id },
      data: { ...body, updatedBy: session.id },
    });

    await createAuditLog({
      userId: session.id,
      action: "PATCH",
      entityType: "Partner",
      entityId: id,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(body),
    });

    return NextResponse.json({ data: partner });
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
    const session = await requirePermission("partners.manage");
    const { id } = await params;

    const existing = await prisma.partner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Partner not found" }, { status: 404 });
    }

    await prisma.partner.update({
      where: { id },
      data: { isActive: false, updatedBy: session.id },
    });

    await createAuditLog({
      userId: session.id,
      action: "DELETE",
      entityType: "Partner",
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
