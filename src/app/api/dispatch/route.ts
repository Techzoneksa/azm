import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";

const DISPATCH_COLUMNS = [
  "NEW",
  "RECEIVED_FROM_PARTNER",
  "READY_FOR_DISPATCH",
  "ASSIGNED_TO_DRIVER",
  "OUT_FOR_DELIVERY",
  "FAILED_ATTEMPT",
  "DELIVERED",
  "RETURN_PENDING",
  "RETURNED_TO_PARTNER",
  "NEEDS_REVIEW",
] as const;

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("dispatch.view");
    const { searchParams } = new URL(req.url);
    const partnerId = searchParams.get("partnerId") || "";
    const contractId = searchParams.get("contractId") || "";
    const city = searchParams.get("city") || "";
    const district = searchParams.get("district") || "";
    const driverId = searchParams.get("driverId") || "";
    const search = searchParams.get("search") || "";

    const baseWhere: Record<string, unknown> = {};
    if (partnerId) baseWhere.partnerId = partnerId;
    if (contractId) baseWhere.contractId = contractId;
    if (city) baseWhere.city = city;
    if (district) baseWhere.district = district;
    if (driverId) baseWhere.driverId = driverId;
    if (search) {
      baseWhere.OR = [
        { trackingNumber: { contains: search } },
        { recipientName: { contains: search } },
      ];
    }

    const columns: Record<string, number> = {};
    const columnData: Record<string, unknown[]> = {};

    for (const col of DISPATCH_COLUMNS) {
      const colWhere = { ...baseWhere, status: col };
      const [count, items] = await Promise.all([
        prisma.shipment.count({ where: colWhere }),
        prisma.shipment.findMany({
          where: colWhere,
          take: 10,
          select: {
            id: true,
            trackingNumber: true,
            recipientName: true,
            recipientPhone: true,
            city: true,
            district: true,
            deliveryDate: true,
            pieces: true,
            priority: true,
            driverId: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        }),
      ]);
      columns[col] = count;
      columnData[col] = items;
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const delayedShipments = await prisma.shipment.count({
      where: {
        deliveryDate: { lt: now },
        status: { in: ["NEW", "ASSIGNED_TO_DRIVER", "OUT_FOR_DELIVERY", "FAILED_ATTEMPT", "CUSTOMER_NOT_RESPONDING"] },
        ...(search ? { OR: [{ trackingNumber: { contains: search } }, { recipientName: { contains: search } }] } : {}),
        ...(partnerId ? { partnerId } : {}),
      },
    });

    const unassignedShipments = await prisma.shipment.count({
      where: {
        status: "READY_FOR_DISPATCH",
        driverId: null,
        ...(partnerId ? { partnerId } : {}),
        ...(city ? { city } : {}),
      },
    });

    const staleShipments = await prisma.shipment.count({
      where: {
        lastStatusUpdate: { lt: twentyFourHoursAgo },
        status: { notIn: ["DELIVERED", "RETURNED_TO_PARTNER", "CANCELLED"] },
        ...(partnerId ? { partnerId } : {}),
      },
    });

    return NextResponse.json({
      data: {
        columns,
        columnData,
        alerts: {
          delayedShipments,
          unassignedShipments,
          staleShipments,
        },
      },
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
