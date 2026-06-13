import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDriver, getActiveShift } from "@/lib/driver-auth";

export async function GET(_req: NextRequest) {
  try {
    const { driverId } = await requireDriver();

    const activeShift = await getActiveShift(driverId);

    if (activeShift) {
      return NextResponse.json({ data: activeShift });
    }

    const lastShift = await prisma.driverShift.findFirst({
      where: { driverId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: lastShift ?? null });
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
