import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("coverage_areas.view");
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const partnerId = searchParams.get("partnerId") || "";
    const contractId = searchParams.get("contractId") || "";
    const city = searchParams.get("city") || "";
    const status = searchParams.get("status") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (partnerId) where.partnerId = partnerId;
    if (contractId) where.contractId = contractId;
    if (city) where.city = city;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.coverageArea.findMany({
        where,
        skip,
        take: limit,
        include: { partner: { select: { id: true, tradingNameAr: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.coverageArea.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
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

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("coverage_areas.manage");
    const body = await req.json();

    const area = await prisma.coverageArea.create({
      data: { ...body, createdBy: session.id, updatedBy: session.id },
    });

    await createAuditLog({
      userId: session.id,
      action: "CREATE",
      entityType: "CoverageArea",
      entityId: area.id,
      newValue: JSON.stringify(body),
    });

    return NextResponse.json({ data: area }, { status: 201 });
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
