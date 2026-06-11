import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const driverId = searchParams.get("driverId") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (driverId) where.driverId = driverId;
    if (search) {
      where.OR = [
        { plateNumber: { contains: search } },
        { brand: { contains: search } },
        { serialNumber: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        include: {
          driver: { select: { id: true, fullName: true, phone: true } },
          _count: { select: { documents: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.vehicle.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Unauthorized"
        ? "Unauthorized"
        : "Internal server error";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const vehicle = await prisma.vehicle.create({
      data: {
        ...body,
        createdBy: session.id,
        updatedBy: session.id,
      },
      include: {
        driver: { select: { id: true, fullName: true, phone: true } },
      },
    });

    await createAuditLog({
      userId: session.id,
      action: "CREATE",
      entityType: "Vehicle",
      entityId: vehicle.id,
      newValue: JSON.stringify(body),
    });

    return NextResponse.json({ data: vehicle }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Unauthorized"
        ? "Unauthorized"
        : "Internal server error";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}
