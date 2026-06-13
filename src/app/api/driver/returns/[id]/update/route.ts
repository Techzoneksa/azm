import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDriver, assertShipmentOwnership, logFieldActivity } from "@/lib/driver-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, driverId } = await requireDriver();
    const { id } = await params;
    const { status, notes, proofFile, receiverName, locationLat, locationLng } =
      await req.json();

    const shipmentReturn = await prisma.shipmentReturn.findUnique({
      where: { id },
      include: { shipment: { select: { driverId: true } } },
    });

    if (!shipmentReturn) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 });
    }

    if (shipmentReturn.shipment.driverId !== driverId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (status === "RETURNED_TO_PARTNER") {
      return NextResponse.json(
        { error: "Setting RETURNED_TO_PARTNER requires admin approval" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      notes: notes ?? undefined,
      proofFile: proofFile ?? undefined,
      receivedByPartnerName: receiverName ?? undefined,
    };

    if (status) updateData.status = status;
    if (status === "RETURNED") updateData.returnedAt = new Date();

    const updated = await prisma.shipmentReturn.update({
      where: { id },
      data: updateData,
    });

    await logFieldActivity({
      driverId,
      shipmentId: shipmentReturn.shipmentId,
      type: "RETURN_UPDATE",
      description: `Return status updated to ${status || "no change"}`,
      locationLat,
      locationLng,
    });

    return NextResponse.json({ data: updated });
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
