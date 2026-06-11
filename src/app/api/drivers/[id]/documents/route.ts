import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const driver = await prisma.driver.findUnique({ where: { id } });
    if (!driver) {
      return NextResponse.json(
        { message: "Driver not found" },
        { status: 404 }
      );
    }

    const documents = await prisma.driverDocument.findMany({
      where: { driverId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: documents });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Unauthorized"
        ? "Unauthorized"
        : "Internal server error";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const driver = await prisma.driver.findUnique({ where: { id } });
    if (!driver) {
      return NextResponse.json(
        { message: "Driver not found" },
        { status: 404 }
      );
    }

    const document = await prisma.driverDocument.create({
      data: {
        driverId: id,
        ...body,
        createdBy: session.id,
        updatedBy: session.id,
      },
    });

    await createAuditLog({
      userId: session.id,
      action: "CREATE",
      entityType: "DriverDocument",
      entityId: document.id,
      newValue: JSON.stringify(body),
    });

    return NextResponse.json({ data: document }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Unauthorized"
        ? "Unauthorized"
        : "Internal server error";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}
