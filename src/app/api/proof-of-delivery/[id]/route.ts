import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("pod.manage");
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.proofOfDelivery.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Proof of delivery not found" }, { status: 404 });
    }

    const pod = await prisma.proofOfDelivery.update({
      where: { id },
      data: {
        ...body,
        otpCodeMasked: body.otpCode ? body.otpCode.replace(/./g, "*") : undefined,
      },
    });

    await createAuditLog({
      userId: session.id,
      action: "PATCH",
      entityType: "ProofOfDelivery",
      entityId: id,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(body),
    });

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
