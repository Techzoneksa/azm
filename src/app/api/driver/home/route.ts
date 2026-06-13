import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDriver, getActiveShift } from "@/lib/driver-auth";

export async function GET(_req: NextRequest) {
  try {
    const { userId, driverId, fullName } = await requireDriver();

    const [totalShipments, deliveredCount, failedCount, returnCount, activeShift, driver] =
      await Promise.all([
        prisma.shipment.count({ where: { driverId } }),
        prisma.shipment.count({ where: { driverId, status: "DELIVERED" } }),
        prisma.shipment.count({
          where: {
            driverId,
            status: {
              in: [
                "CUSTOMER_NOT_RESPONDING",
                "CUSTOMER_REQUESTED_RESCHEDULE",
                "WRONG_ADDRESS",
                "CUSTOMER_REFUSED",
                "CANNOT_ACCESS_LOCATION",
              ],
            },
          },
        }),
        prisma.shipment.count({ where: { driverId, status: "RETURN_PENDING" } }),
        getActiveShift(driverId),
        prisma.driver.findUnique({ where: { id: driverId } }),
      ]);

    return NextResponse.json({
      data: {
        driver: {
          id: driverId,
          fullName,
          phone: driver?.phone ?? null,
          email: driver?.email ?? null,
          city: driver?.city ?? null,
          vehicleType: driver?.vehicleType ?? null,
          plateNumber: driver?.plateNumber ?? null,
          status: driver?.status ?? null,
          readinessStatus: driver?.readinessStatus ?? null,
        },
        stats: {
          totalShipments,
          deliveredCount,
          failedCount,
          returnCount,
        },
        activeShift,
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
