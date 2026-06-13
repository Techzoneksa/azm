import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDriver, getActiveShift, logFieldActivity } from "@/lib/driver-auth";

export async function POST(req: NextRequest) {
  try {
    const { userId, driverId } = await requireDriver();
    const { locationLat, locationLng, notes } = await req.json();

    const existingActive = await getActiveShift(driverId);
    if (existingActive) {
      return NextResponse.json(
        { error: "An active shift already exists" },
        { status: 400 }
      );
    }

    const shift = await prisma.driverShift.create({
      data: {
        driverId,
        status: "ACTIVE",
        startedAt: new Date(),
        startedBy: userId,
        startLocationLat: locationLat ?? null,
        startLocationLng: locationLng ?? null,
        notes: notes ?? null,
      },
    });

    await logFieldActivity({
      driverId,
      shiftId: shift.id,
      type: "SHIFT_START",
      description: "Shift started",
      locationLat,
      locationLng,
    });

    return NextResponse.json({ data: shift }, { status: 201 });
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
