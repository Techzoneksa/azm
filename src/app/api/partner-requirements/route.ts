import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("requirements.view");
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const partnerId = searchParams.get("partnerId") || "";
    const contractId = searchParams.get("contractId") || "";
    const isMandatory = searchParams.get("isMandatory") || "";
    const status = searchParams.get("status") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (partnerId) where.partnerId = partnerId;
    if (contractId) where.contractId = contractId;
    if (isMandatory) where.isMandatory = isMandatory === "true";
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.partnerRequirement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.partnerRequirement.count({ where }),
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
    const session = await requirePermission("requirements.manage");
    const body = await req.json();

    const requirement = await prisma.partnerRequirement.create({
      data: { ...body, createdBy: session.id, updatedBy: session.id },
    });

    await createAuditLog({
      userId: session.id,
      action: "CREATE",
      entityType: "PartnerRequirement",
      entityId: requirement.id,
      newValue: JSON.stringify(body),
    });

    return NextResponse.json({ data: requirement }, { status: 201 });
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
