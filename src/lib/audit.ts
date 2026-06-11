import "server-only";
import { prisma } from "./prisma";

export async function createAuditLog(params: {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await prisma.auditLog.create({ data: params });
  } catch {
    console.error("Failed to create audit log");
  }
}
