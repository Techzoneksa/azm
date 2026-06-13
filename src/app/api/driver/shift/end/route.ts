import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDriver, getActiveShift, logFieldActivity } from "@/lib/driver-auth";

export async function POST(req: NextRequest) {
  try {
    const { userId, driverId } = await requireDriver();
    const { locationLat, locationLng, notes } = await req.json();

    const activeShift = await getActiveShift(driverId);
    if (!activeShift) {
      return NextResponse.json(
        { error: "No active shift found" },
        { status: 400 }
      );
    }

    const openShipments = await prisma.shipment.count({
      where: {
        driverId,
        status: { in: ["OUT_FOR_DELIVERY", "RETURN_PENDING"] },
      },
    });

    if (openShipments > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot end shift. You have shipments in OUT_FOR_DELIVERY or RETURN_PENDING status.",
        },
        { status: 400 }
      );
    }

    const shift = await prisma.driverShift.update({
      where: { id: activeShift.id },
      data: {
        status: "ENDED",
        endedAt: new Date(),
        endedBy: userId,
        endLocationLat: locationLat ?? null,
        endLocationLng: locationLng ?? null,
        notes: notes ?? undefined,
      },
    });

    await logFieldActivity({
      driverId,
      shiftId: shift.id,
      type: "SHIFT_END",
      description: "Shift ended",
      locationLat,
      locationLng,
    });

    return NextResponse.json({ data: shift });
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
