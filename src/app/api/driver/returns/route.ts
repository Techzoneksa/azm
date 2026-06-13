import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDriver } from "@/lib/driver-auth";

export async function GET(_req: NextRequest) {
  try {
    const { driverId } = await requireDriver();

    const returns = await prisma.shipmentReturn.findMany({
      where: {
        shipment: { driverId },
      },
      include: {
        shipment: {
          select: {
            id: true,
            trackingNumber: true,
            partnerReference: true,
            recipientName: true,
            recipientPhone: true,
            city: true,
            district: true,
            address: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: returns });
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
