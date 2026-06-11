import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const entityId = searchParams.get("entityId") || "";
    const status = searchParams.get("status") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (entityId) where.entityId = entityId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.complianceRecord.findMany({
        where,
        skip,
        take: limit,
        include: {
          entity: true,
          documents: true,
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.complianceRecord.count({ where }),
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
    const { entityId, ...data } = body;

    const record = await prisma.complianceRecord.create({
      data: {
        ...data,
        entityId,
        createdBy: session.id,
        updatedBy: session.id,
      },
      include: { entity: true, documents: true },
    });

    await createAuditLog({
      userId: session.id,
      action: "CREATE",
      entityType: "ComplianceRecord",
      entityId: record.id,
      newValue: JSON.stringify(body),
    });

    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Unauthorized"
        ? "Unauthorized"
        : "Internal server error";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}
