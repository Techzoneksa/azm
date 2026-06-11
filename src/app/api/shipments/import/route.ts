import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function validatePhone(phone: string): boolean {
  return /^\+?[\d\s\-()]{7,20}$/.test(phone);
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("shipments.import");
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const partnerId = (formData.get("partnerId") as string) || "";
    const contractId = (formData.get("contractId") as string) || "";

    if (!file) {
      return NextResponse.json({ message: "File is required" }, { status: 400 });
    }
    if (!partnerId) {
      return NextResponse.json({ message: "partnerId is required" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      return NextResponse.json({ message: "File has no data rows" }, { status: 400 });
    }

    const headers = parseCsvLine(lines[0]);
    const rows = lines.slice(1);

    const batch = await prisma.shipmentImportBatch.create({
      data: {
        partnerId,
        contractId: contractId || null,
        fileName: file.name,
        fileType: file.name.endsWith(".csv") ? "CSV" : "EXCEL",
        totalRows: rows.length,
        uploadedBy: session.id,
        status: "VALIDATED",
      },
    });

    const validRows: Record<string, unknown>[] = [];
    const errorRows: { rowNumber: number; errors: string[] }[] = [];
    const duplicateRows: { rowNumber: number; trackingNumber?: string }[] = [];
    let validCount = 0;
    let errorCount = 0;
    const duplicateCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const values = parseCsvLine(rows[i]);
      const rowData: Record<string, string> = {};
      headers.forEach((h, idx) => { rowData[h.trim()] = values[idx] || ""; });

      const rowErrors: string[] = [];

      if (!rowData.recipientName) rowErrors.push("recipientName is required");
      if (!rowData.recipientPhone) rowErrors.push("recipientPhone is required");
      else if (!validatePhone(rowData.recipientPhone)) rowErrors.push("Invalid recipientPhone format");
      if (!rowData.city) rowErrors.push("city is required");

      const trackingNumber = `AZM-${Date.now()}-${i}`;

      if (rowErrors.length > 0) {
        errorCount++;
        errorRows.push({ rowNumber: i + 1, errors: rowErrors });
      } else {
        validCount++;
        validRows.push(rowData);
      }

      await prisma.shipmentImportRow.create({
        data: {
          batchId: batch.id,
          rowNumber: i + 1,
          rawData: JSON.stringify(rowData),
          normalizedData: JSON.stringify(rowData),
          validationStatus: rowErrors.length > 0 ? "ERROR" : "VALID",
          validationErrors: rowErrors.length > 0 ? JSON.stringify(rowErrors) : null,
        },
      });
    }

    await prisma.shipmentImportBatch.update({
      where: { id: batch.id },
      data: {
        validRows: validCount,
        errorRows: errorCount,
        duplicateRows: duplicateCount,
        status: validCount > 0 ? "VALIDATED" : "ERROR",
      },
    });

    return NextResponse.json({
      data: {
        batchId: batch.id,
        totalRows: rows.length,
        validRows: validCount,
        errorRows: errorCount,
        duplicateRows: duplicateCount,
        rows: validRows.slice(0, 10).map((r, idx) => ({ rowNumber: idx + 1, data: r })),
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
