import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDriver, assertShipmentOwnership, logFieldActivity } from "@/lib/driver-auth";
import { createAuditLog } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, driverId } = await requireDriver();
    const { id } = await params;
    const { receiverName, receiverPhone, otp, notes, locationLat, locationLng } =
      await req.json();

    const shipment = await assertShipmentOwnership(id, driverId);

    const existingPod = await prisma.proofOfDelivery.findUnique({
      where: { shipmentId: id },
    });
    if (existingPod) {
      return NextResponse.json(
        { error: "Proof of delivery already exists for this shipment" },
        { status: 409 }
      );
    }

    const pod = await prisma.proofOfDelivery.create({
      data: {
        shipmentId: id,
        deliveredAt: new Date(),
        deliveredByDriverId: driverId,
        receiverName: receiverName ?? null,
        receiverPhone: receiverPhone ?? null,
        otpCodeMasked: otp ? otp.replace(/./g, "*") : null,
        notes: notes ?? null,
        locationLat: locationLat ?? null,
        locationLng: locationLng ?? null,
        createdBy: userId,
      },
    });

    await prisma.shipment.update({
      where: { id },
      data: { status: "DELIVERED", lastStatusUpdate: new Date(), updatedBy: userId },
    });

    await prisma.shipmentStatusHistory.create({
      data: {
        shipmentId: id,
        oldStatus: shipment.status,
        newStatus: "DELIVERED",
        changedBy: userId,
        source: "POD",
        notes,
      },
    });

    await createAuditLog({
      userId,
      action: "CREATE_POD",
      entityType: "ProofOfDelivery",
      entityId: pod.id,
      newValue: JSON.stringify({ receiverName, receiverPhone }),
    });

    await logFieldActivity({
      driverId,
      shipmentId: id,
      type: "POD",
      description: "Proof of delivery recorded",
      locationLat,
      locationLng,
    });

    return NextResponse.json({ data: pod }, { status: 201 });
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
