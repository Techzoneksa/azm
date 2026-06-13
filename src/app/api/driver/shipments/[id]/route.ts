import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDriver, assertShipmentOwnership } from "@/lib/driver-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { driverId } = await requireDriver();
    const { id } = await params;

    await assertShipmentOwnership(id, driverId);

    const shipment = await prisma.shipment.findUnique({
      where: { id },
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
        updatedAt: true,
        driver: {
          select: { id: true, fullName: true, phone: true, plateNumber: true },
        },
        deliveryAttempts: {
          orderBy: { attemptNumber: "desc" },
        },
        proofOfDelivery: true,
        returns: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    return NextResponse.json({ data: shipment });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message === "Unauthorized"
          ? "Unauthorized"
          : error.message === "Shipment not found"
            ? "Shipment not found"
            : error.message === "Forbidden"
              ? "Forbidden"
              : "Internal server error"
        : "Internal server error";
    const status =
      message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : message === "Shipment not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
