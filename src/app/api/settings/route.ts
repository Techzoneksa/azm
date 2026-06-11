import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const group = searchParams.get("group") || "";
    const key = searchParams.get("key") || "";

    const where: Record<string, unknown> = {};
    if (group) where.group = group;
    if (key) where.key = key;

    const settings = await prisma.systemSetting.findMany({
      where,
      orderBy: [{ group: "asc" }, { key: "asc" }],
    });

    return NextResponse.json({ data: settings });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Unauthorized"
        ? "Unauthorized"
        : "Internal server error";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const body = await req.json();
    const { key, value, type, group, description, isEncrypted } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { message: "Key and value are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.systemSetting.findUnique({ where: { key } });

    if (existing) {
      const setting = await prisma.systemSetting.update({
        where: { key },
        data: { value, type, group, description, isEncrypted },
      });

      await createAuditLog({
        userId: session.id,
        action: "UPDATE",
        entityType: "SystemSetting",
        entityId: setting.id,
        oldValue: JSON.stringify(existing),
        newValue: JSON.stringify(body),
      });

      return NextResponse.json({ data: setting });
    }

    const setting = await prisma.systemSetting.create({
      data: { key, value, type, group, description, isEncrypted },
    });

    await createAuditLog({
      userId: session.id,
      action: "CREATE",
      entityType: "SystemSetting",
      entityId: setting.id,
      newValue: JSON.stringify(body),
    });

    return NextResponse.json({ data: setting }, { status: 201 });
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
