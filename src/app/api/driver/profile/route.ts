import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDriver } from "@/lib/driver-auth";

export async function GET(_req: NextRequest) {
  try {
    const { driverId } = await requireDriver();

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        documents: { orderBy: { createdAt: "desc" } },
        user: { select: { id: true, email: true } },
        _count: { select: { shipments: true } },
      },
    });

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    const deliveredCount = await prisma.shipment.count({
      where: { driverId, status: "DELIVERED" },
    });

    return NextResponse.json({
      data: {
        id: driver.id,
        fullName: driver.fullName,
        phone: driver.phone,
        email: driver.email ?? driver.user?.email ?? null,
        city: driver.city,
        district: driver.district,
        vehicleType: driver.vehicleType,
        plateNumber: driver.plateNumber,
        status: driver.status,
        readinessStatus: driver.readinessStatus,
        nationalId: driver.nationalId,
        documents: driver.documents,
        stats: {
          totalShipments: driver._count.shipments,
          deliveredCount,
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
    return NextResponse.json({ error: message }, { status });
  }
}
