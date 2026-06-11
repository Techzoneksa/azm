import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

const DEFAULT_READINESS_ITEMS = [
  { itemKey: "CONTRACT_SIGNED", name: "Contract Signed", nameAr: "تم توقيع العقد", isMandatory: true },
  { itemKey: "PICKUP_POINTS_DEFINED", name: "Pickup Points Defined", nameAr: "تم تحديد نقاط التحميل", isMandatory: true },
  { itemKey: "COVERAGE_AREAS_DEFINED", name: "Coverage Areas Defined", nameAr: "تم تحديد مناطق التغطية", isMandatory: true },
  { itemKey: "INTEGRATION_CONFIGURED", name: "Integration Configured", nameAr: "تم تكوين التكامل", isMandatory: true },
  { itemKey: "OPERATIONAL_PROCESS", name: "Operational Process Defined", nameAr: "تم تحديد العملية التشغيلية", isMandatory: true },
  { itemKey: "SLA_AGREED", name: "SLA Agreed", nameAr: "تم الاتفاق على مستوى الخدمة", isMandatory: true },
  { itemKey: "PRICING_AGREED", name: "Pricing Agreed", nameAr: "تم الاتفاق على التسعير", isMandatory: false },
  { itemKey: "TRAINING_COMPLETED", name: "Training Completed", nameAr: "تم التدريب", isMandatory: false },
];

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("contracts.view");
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const partnerId = searchParams.get("partnerId") || "";
    const status = searchParams.get("status") || "";
    const contractType = searchParams.get("contractType") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (partnerId) where.partnerId = partnerId;
    if (status) where.status = status;
    if (contractType) where.contractType = contractType;

    const [data, total] = await Promise.all([
      prisma.operationalContract.findMany({
        where,
        skip,
        take: limit,
        include: { partner: { select: { id: true, tradingNameAr: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.operationalContract.count({ where }),
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
    const session = await requirePermission("contracts.manage");
    const body = await req.json();

    const contract = await prisma.operationalContract.create({
      data: {
        ...body,
        createdBy: session.id,
        updatedBy: session.id,
        readinessItems: {
          create: DEFAULT_READINESS_ITEMS.map((item, i) => ({
            ...item,
            sortOrder: i + 1,
          })),
        },
      },
      include: { readinessItems: true },
    });

    await createAuditLog({
      userId: session.id,
      action: "CREATE",
      entityType: "OperationalContract",
      entityId: contract.id,
      newValue: JSON.stringify(body),
    });

    return NextResponse.json({ data: contract }, { status: 201 });
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
