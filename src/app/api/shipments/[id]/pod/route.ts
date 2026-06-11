import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("pod.view");
    const { id } = await params;

    const pod = await prisma.proofOfDelivery.findUnique({
      where: { shipmentId: id },
    });

    if (!pod) {
      return NextResponse.json({ message: "Proof of delivery not found" }, { status: 404 });
    }

    return NextResponse.json({ data: pod });
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
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("pod.manage");
    const { id } = await params;
    const body = await req.json();
    const { receiverName, receiverPhone, otpCode, notes, signatureFile, photoFile, locationLat, locationLng } = body;

    const shipment = await prisma.shipment.findUnique({ where: { id } });
    if (!shipment) {
      return NextResponse.json({ message: "Shipment not found" }, { status: 404 });
    }

    const existingPod = await prisma.proofOfDelivery.findUnique({ where: { shipmentId: id } });
    if (existingPod) {
      return NextResponse.json({ message: "Proof of delivery already exists for this shipment" }, { status: 409 });
    }

    const pod = await prisma.proofOfDelivery.create({
      data: {
        shipmentId: id,
        deliveredAt: new Date(),
        deliveredByDriverId: shipment.driverId,
        receiverName,
        receiverPhone,
        otpCodeMasked: otpCode ? otpCode.replace(/./g, "*") : null,
        signatureFile,
        photoFile,
        locationLat,
        locationLng,
        notes,
        createdBy: session.id,
      },
    });

    await prisma.shipment.update({
      where: { id },
      data: { status: "DELIVERED", lastStatusUpdate: new Date(), updatedBy: session.id },
    });

    await prisma.shipmentStatusHistory.create({
      data: {
        shipmentId: id,
        oldStatus: shipment.status,
        newStatus: "DELIVERED",
        changedBy: session.id,
        source: "POD",
      },
    });

    const activeAssignment = await prisma.shipmentAssignment.findFirst({
      where: { shipmentId: id, status: "ASSIGNED" },
      orderBy: { assignedAt: "desc" },
    });

    if (activeAssignment) {
      await prisma.shipmentAssignment.update({
        where: { id: activeAssignment.id },
        data: { status: "COMPLETED" },
      });
    }

    await createAuditLog({
      userId: session.id,
      action: "CREATE_POD",
      entityType: "ProofOfDelivery",
      entityId: pod.id,
      newValue: JSON.stringify({ receiverName, receiverPhone }),
    });

    return NextResponse.json({ data: pod }, { status: 201 });
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
    return NextResponse.json({ message }, { status });
  }
}
