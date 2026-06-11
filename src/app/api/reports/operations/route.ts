import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";

const FAILURE_STATUSES = ["FAILED_ATTEMPT", "CUSTOMER_NOT_RESPONDING", "ADDRESS_NOT_FOUND", "RECIPIENT_REFUSED", "DAMAGED", "LOST"];

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("operations_reports.view");
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const partnerId = searchParams.get("partnerId") || "";
    const contractId = searchParams.get("contractId") || "";
    const city = searchParams.get("city") || "";
    const driverId = searchParams.get("driverId") || "";

    const startDate = new Date(dateStr + "T00:00:00.000Z");
    const endDate = new Date(dateStr + "T23:59:59.999Z");

    const baseWhere: Record<string, unknown> = {
      createdAt: { gte: startDate, lte: endDate },
    };
    if (partnerId) baseWhere.partnerId = partnerId;
    if (contractId) baseWhere.contractId = contractId;
    if (city) baseWhere.city = city;
    if (driverId) baseWhere.driverId = driverId;

    const statusWhere = { ...baseWhere };

    const [
      totalShipments,
      receivedShipments,
      readyShipments,
      assignedShipments,
      outForDelivery,
      deliveredShipments,
      failedShipments,
      returnedShipments,
      needsReviewShipments,
      openShipments,
    ] = await Promise.all([
      prisma.shipment.count({ where: baseWhere }),
      prisma.shipment.count({ where: { ...statusWhere, status: "RECEIVED_FROM_PARTNER" } }),
      prisma.shipment.count({ where: { ...statusWhere, status: "READY_FOR_DISPATCH" } }),
      prisma.shipment.count({ where: { ...statusWhere, status: "ASSIGNED_TO_DRIVER" } }),
      prisma.shipment.count({ where: { ...statusWhere, status: "OUT_FOR_DELIVERY" } }),
      prisma.shipment.count({ where: { ...statusWhere, status: "DELIVERED" } }),
      prisma.shipment.count({ where: { ...statusWhere, status: { in: FAILURE_STATUSES } } }),
      prisma.shipment.count({ where: { ...statusWhere, status: { in: ["RETURN_PENDING", "RETURNED_TO_PARTNER"] } } }),
      prisma.shipment.count({ where: { ...statusWhere, status: "NEEDS_REVIEW" } }),
      prisma.shipment.count({
        where: { ...statusWhere, status: { notIn: ["DELIVERED", "RETURNED_TO_PARTNER", "CANCELLED"] } },
      }),
    ]);

    const deliverySuccessRate = (deliveredShipments + failedShipments) > 0
      ? Math.round((deliveredShipments / (deliveredShipments + failedShipments)) * 10000) / 100
      : 0;

    const failureReasons = await prisma.deliveryAttempt.groupBy({
      by: ["reason"],
      where: {
        shipment: { ...baseWhere },
        status: { in: FAILURE_STATUSES },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    const topFailureReasons = failureReasons.map((r) => ({
      reason: r.reason || "Unknown",
      count: r._count.id,
    }));

    const partnerShipments = await prisma.shipment.groupBy({
      by: ["partnerId"],
      where: baseWhere,
      _count: { id: true },
    });

    const partnerIds = partnerShipments.map((p) => p.partnerId);
    const partners = partnerIds.length > 0
      ? await prisma.partner.findMany({
          where: { id: { in: partnerIds } },
          select: { id: true, tradingNameAr: true, tradingNameEn: true },
        })
      : [];

    const partnerPerformance = partnerShipments.map((ps) => {
      const partner = partners.find((p) => p.id === ps.partnerId);
      return {
        partnerId: ps.partnerId,
        partnerName: partner?.tradingNameAr || partner?.tradingNameEn || "Unknown",
        total: ps._count.id,
      };
    });

    const driverDeliveries = await prisma.shipment.groupBy({
      by: ["driverId"],
      where: { ...baseWhere, driverId: { not: null } },
      _count: { id: true },
    });

    const driverIds = driverDeliveries.map((d) => d.driverId).filter(Boolean) as string[];
    const drivers = driverIds.length > 0
      ? await prisma.driver.findMany({
          where: { id: { in: driverIds } },
          select: { id: true, fullName: true, phone: true },
        })
      : [];

    const driverPerformance = driverDeliveries.map((dd) => {
      const driver = drivers.find((d) => d.id === dd.driverId);
      return {
        driverId: dd.driverId,
        driverName: driver?.fullName || "Unknown",
        total: dd._count.id,
      };
    });

    return NextResponse.json({
      data: {
        date: dateStr,
        totalShipments,
        receivedShipments,
        readyShipments,
        assignedShipments,
        outForDelivery,
        deliveredShipments,
        failedShipments,
        returnedShipments,
        deliverySuccessRate,
        topFailureReasons,
        partnerPerformance,
        driverPerformance,
        openShipments,
        needsReviewShipments,
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
