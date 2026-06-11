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
    const session = await requirePermission("requirements.view");
    const { id } = await params;

    const requirement = await prisma.partnerRequirement.findUnique({
      where: { id },
    });

    if (!requirement) {
      return NextResponse.json({ message: "Requirement not found" }, { status: 404 });
    }

    return NextResponse.json({ data: requirement });
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
    const session = await requirePermission("requirements.manage");
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.partnerRequirement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Requirement not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { ...body, updatedBy: session.id };
    if (body.isCompleted === true && !existing.isCompleted) {
      updateData.completedAt = new Date();
      updateData.completedBy = session.id;
    }

    const requirement = await prisma.partnerRequirement.update({
      where: { id },
      data: updateData,
    });

    await createAuditLog({
      userId: session.id,
      action: "PATCH",
      entityType: "PartnerRequirement",
      entityId: id,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(body),
    });

    return NextResponse.json({ data: requirement });
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
    const session = await requirePermission("requirements.manage");
    const { id } = await params;

    const existing = await prisma.partnerRequirement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Requirement not found" }, { status: 404 });
    }

    await prisma.partnerRequirement.delete({ where: { id } });

    await createAuditLog({
      userId: session.id,
      action: "DELETE",
      entityType: "PartnerRequirement",
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
