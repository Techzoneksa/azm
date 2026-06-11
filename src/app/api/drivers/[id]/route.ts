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

    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        documents: true,
        vehicles: true,
      },
    });

    if (!driver) {
      return NextResponse.json(
        { message: "Driver not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: driver });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Unauthorized"
        ? "Unauthorized"
        : "Internal server error";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.driver.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { message: "Driver not found" },
        { status: 404 }
      );
    }

    const driver = await prisma.driver.update({
      where: { id },
      data: { ...body, updatedBy: session.id },
      include: { documents: true, vehicles: true },
    });

    await createAuditLog({
      userId: session.id,
      action: "UPDATE",
      entityType: "Driver",
      entityId: id,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(body),
    });

    return NextResponse.json({ data: driver });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Unauthorized"
        ? "Unauthorized"
        : "Internal server error";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.driver.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { message: "Driver not found" },
        { status: 404 }
      );
    }

    const driver = await prisma.driver.update({
      where: { id },
      data: { ...body, updatedBy: session.id },
      include: { documents: true, vehicles: true },
    });

    await createAuditLog({
      userId: session.id,
      action: "PATCH",
      entityType: "Driver",
      entityId: id,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(body),
    });

    return NextResponse.json({ data: driver });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Unauthorized"
        ? "Unauthorized"
        : "Internal server error";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const existing = await prisma.driver.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { message: "Driver not found" },
        { status: 404 }
      );
    }

    await prisma.driver.delete({ where: { id } });

    await createAuditLog({
      userId: session.id,
      action: "DELETE",
      entityType: "Driver",
      entityId: id,
      oldValue: JSON.stringify(existing),
    });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Unauthorized"
        ? "Unauthorized"
        : "Internal server error";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}
