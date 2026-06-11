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
    const session = await requirePermission("activities.view");
    const { id } = await params;

    const activity = await prisma.activityLog.findUnique({
      where: { id },
    });

    if (!activity) {
      return NextResponse.json({ message: "Activity not found" }, { status: 404 });
    }

    return NextResponse.json({ data: activity });
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
    const session = await requirePermission("activities.manage");
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.activityLog.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Activity not found" }, { status: 404 });
    }

    const activity = await prisma.activityLog.update({
      where: { id },
      data: body,
    });

    await createAuditLog({
      userId: session.id,
      action: "PATCH",
      entityType: "ActivityLog",
      entityId: id,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(body),
    });

    return NextResponse.json({ data: activity });
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
    const session = await requirePermission("activities.manage");
    const { id } = await params;

    const existing = await prisma.activityLog.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Activity not found" }, { status: 404 });
    }

    await prisma.activityLog.delete({ where: { id } });

    await createAuditLog({
      userId: session.id,
      action: "DELETE",
      entityType: "ActivityLog",
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
