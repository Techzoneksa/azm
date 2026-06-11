import "server-only";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requirePermission("shipments.import");

    const headers = [
      "partnerReference",
      "orderNumber",
      "recipientName",
      "recipientPhone",
      "recipientEmail",
      "city",
      "district",
      "address",
      "shortAddress",
      "nationalAddress",
      "locationUrl",
      "pieces",
      "packageDescription",
      "deliveryDate",
      "deliveryWindow",
      "notes",
    ];

    const csvContent = headers.join(",") + "\n";

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="shipment-import-template.csv"',
      },
    });
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
