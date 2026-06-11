import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("shipments.view");
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const partnerId = searchParams.get("partnerId") || "";
    const contractId = searchParams.get("contractId") || "";
    const city = searchParams.get("city") || "";
    const district = searchParams.get("district") || "";
    const status = searchParams.get("status") || "";
    const driverId = searchParams.get("driverId") || "";
    const entrySource = searchParams.get("entrySource") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const overdue = searchParams.get("overdue") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { trackingNumber: { contains: search } },
        { partnerReference: { contains: search } },
        { orderNumber: { contains: search } },
        { recipientName: { contains: search } },
        { recipientPhone: { contains: search } },
      ];
    }
    if (partnerId) where.partnerId = partnerId;
    if (contractId) where.contractId = contractId;
    if (city) where.city = city;
    if (district) where.district = district;
    if (status) where.status = status;
    if (driverId) where.driverId = driverId;
    if (entrySource) where.entrySource = entrySource;
    if (dateFrom || dateTo) {
      const createdAt: Record<string, Date> = {};
      if (dateFrom) createdAt.gte = new Date(dateFrom);
      if (dateTo) createdAt.lte = new Date(dateTo);
      where.createdAt = createdAt;
    }
    if (overdue === "true") {
      where.deliveryDate = { lt: new Date() };
      where.status = { in: ["NEW", "ASSIGNED_TO_DRIVER", "OUT_FOR_DELIVERY", "FAILED_ATTEMPT", "CUSTOMER_NOT_RESPONDING"] };
    }

    const [data, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        skip,
        take: limit,
        include: {
          partner: { select: { id: true, tradingNameAr: true, tradingNameEn: true } },
          contract: { select: { id: true, name: true, contractNumber: true } },
          driver: { select: { id: true, fullName: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.shipment.count({ where }),
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
    const session = await requirePermission("shipments.manage");
    const body = await req.json();
    const trackingNumber = `AZM-${Date.now()}`;

    const shipment = await prisma.shipment.create({
      data: {
        ...body,
        trackingNumber,
        status: "NEW",
        entrySource: body.entrySource || "MANUAL",
        createdBy: session.id,
        updatedBy: session.id,
      },
    });

    await prisma.shipmentStatusHistory.create({
      data: {
        shipmentId: shipment.id,
        newStatus: "NEW",
        changedBy: session.id,
        source: "MANUAL",
      },
    });

    await createAuditLog({
      userId: session.id,
      action: "CREATE",
      entityType: "Shipment",
      entityId: shipment.id,
      newValue: JSON.stringify({ ...body, trackingNumber }),
    });

    return NextResponse.json({ data: shipment }, { status: 201 });
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
