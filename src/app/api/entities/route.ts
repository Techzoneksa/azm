import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAuth();

    const entities = await prisma.governmentEntity.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { complianceRecords: true, officialLinks: true } },
      },
    });

    return NextResponse.json({ data: entities });
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

    const entity = await prisma.governmentEntity.create({ data: body });

    await createAuditLog({
      userId: session.id,
      action: "CREATE",
      entityType: "GovernmentEntity",
      entityId: entity.id,
      newValue: JSON.stringify(body),
    });

    return NextResponse.json({ data: entity }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Unauthorized"
        ? "Unauthorized"
        : "Internal server error";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}
