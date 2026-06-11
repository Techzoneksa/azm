import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  try {
    const session = await requirePermission("partners.view");
    const { contactId } = await params;

    const contact = await prisma.partnerContact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return NextResponse.json({ message: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json({ data: contact });
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  try {
    const session = await requirePermission("partners.manage");
    const { contactId } = await params;
    const body = await req.json();

    const existing = await prisma.partnerContact.findUnique({ where: { id: contactId } });
    if (!existing) {
      return NextResponse.json({ message: "Contact not found" }, { status: 404 });
    }

    const contact = await prisma.partnerContact.update({
      where: { id: contactId },
      data: body,
    });

    await createAuditLog({
      userId: session.id,
      action: "PATCH",
      entityType: "PartnerContact",
      entityId: contactId,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(body),
    });

    return NextResponse.json({ data: contact });
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  try {
    const session = await requirePermission("partners.manage");
    const { contactId } = await params;

    const existing = await prisma.partnerContact.findUnique({ where: { id: contactId } });
    if (!existing) {
      return NextResponse.json({ message: "Contact not found" }, { status: 404 });
    }

    await prisma.partnerContact.update({
      where: { id: contactId },
      data: { isActive: false },
    });

    await createAuditLog({
      userId: session.id,
      action: "DELETE",
      entityType: "PartnerContact",
      entityId: contactId,
      oldValue: JSON.stringify(existing),
    });

    return NextResponse.json({ message: "Deleted successfully" });
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
