import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const entityId = searchParams.get("entityId") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (entityId) where.entityId = entityId;

    const [data, total] = await Promise.all([
      prisma.officialLink.findMany({
        where,
        skip,
        take: limit,
        include: { entity: true },
        orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      }),
      prisma.officialLink.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
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
    const session = await requireAuth();
    const body = await req.json();

    const link = await prisma.officialLink.create({
      data: body,
      include: { entity: true },
    });

    await createAuditLog({
      userId: session.id,
      action: "CREATE",
      entityType: "OfficialLink",
      entityId: link.id,
      newValue: JSON.stringify(body),
    });

    return NextResponse.json({ data: link }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Unauthorized"
        ? "Unauthorized"
        : "Internal server error";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}
