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
    const session = await requirePermission("partners.view");
    const { id: partnerId } = await params;

    const contacts = await prisma.partnerContact.findMany({
      where: { partnerId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: contacts });
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
    const session = await requirePermission("partners.manage");
    const { id: partnerId } = await params;
    const body = await req.json();

    const contact = await prisma.partnerContact.create({
      data: { ...body, partnerId },
    });

    await createAuditLog({
      userId: session.id,
      action: "CREATE",
      entityType: "PartnerContact",
      entityId: contact.id,
      newValue: JSON.stringify(body),
    });

    return NextResponse.json({ data: contact }, { status: 201 });
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
