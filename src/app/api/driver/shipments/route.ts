import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDriver } from "@/lib/driver-auth";

export async function GET(req: NextRequest) {
  try {
    const { driverId } = await requireDriver();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { driverId };
    if (status) where.status = status;

    const shipments = await prisma.shipment.findMany({
      where,
      select: {
        id: true,
        trackingNumber: true,
        partnerReference: true,
        recipientName: true,
        recipientPhone: true,
        recipientEmail: true,
        city: true,
        district: true,
        address: true,
        locationUrl: true,
        latitude: true,
        longitude: true,
        packageDescription: true,
        pieces: true,
        shipmentType: true,
        priority: true,
        deliveryWindow: true,
        customerNotes: true,
        partnerInstructions: true,
        status: true,
        lastStatusUpdate: true,
        createdAt: true,
        driver: {
          select: { id: true, fullName: true, phone: true, plateNumber: true },
        },
        assignments: {
          where: { status: "ASSIGNED" },
          select: { id: true, assignedAt: true, status: true },
          orderBy: { assignedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: shipments });
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
