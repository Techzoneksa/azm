import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("partners.view");
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const partnerType = searchParams.get("partnerType") || "";
    const status = searchParams.get("status") || "";
    const city = searchParams.get("city") || "";
    const priority = searchParams.get("priority") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { tradingNameAr: { contains: search } },
        { tradingNameEn: { contains: search } },
        { legalName: { contains: search } },
        { officialEmail: { contains: search } },
        { primaryPhone: { contains: search } },
      ];
    }
    if (partnerType) where.partnerType = partnerType;
    if (status) where.status = status;
    if (city) where.city = city;
    if (priority) where.priority = priority;

    const [data, total] = await Promise.all([
      prisma.partner.findMany({
        where,
        skip,
        take: limit,
        include: { _count: { select: { contracts: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.partner.count({ where }),
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
    const session = await requirePermission("partners.manage");
    const body = await req.json();

    const partner = await prisma.partner.create({
      data: { ...body, createdBy: session.id, updatedBy: session.id },
    });

    await createAuditLog({
      userId: session.id,
      action: "CREATE",
      entityType: "Partner",
      entityId: partner.id,
      newValue: JSON.stringify(body),
    });

    return NextResponse.json({ data: partner }, { status: 201 });
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
