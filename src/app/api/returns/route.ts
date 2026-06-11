import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("returns.view");
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status") || "";
    const reason = searchParams.get("reason") || "";
    const partnerId = searchParams.get("partnerId") || "";
    const fromDate = searchParams.get("fromDate") || "";
    const toDate = searchParams.get("toDate") || "";
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (reason) where.reason = reason;

    if (fromDate || toDate) {
      const returnRequestedAt: Record<string, Date> = {};
      if (fromDate) returnRequestedAt.gte = new Date(fromDate);
      if (toDate) returnRequestedAt.lte = new Date(toDate);
      where.returnRequestedAt = returnRequestedAt;
    }

    if (search || partnerId) {
      const shipmentWhere: Record<string, unknown> = {};
      if (search) {
        shipmentWhere.OR = [{ trackingNumber: { contains: search } }];
      }
      if (partnerId) shipmentWhere.partnerId = partnerId;
      where.shipment = shipmentWhere;
    }

    const [data, total] = await Promise.all([
      prisma.shipmentReturn.findMany({
        where,
        skip,
        take: limit,
        include: {
          shipment: {
            select: {
              id: true,
              trackingNumber: true,
              recipientName: true,
              recipientPhone: true,
              city: true,
              partnerId: true,
              partner: { select: { id: true, tradingNameAr: true, tradingNameEn: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.shipmentReturn.count({ where }),
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
