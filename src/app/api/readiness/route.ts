import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("readiness.view");
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "categories";

    if (type === "scores") {
      const scores = await prisma.readinessScore.findMany({
        include: { category: true },
        orderBy: { calculatedAt: "desc" },
      });
      return NextResponse.json({ data: scores });
    }

    const categories = await prisma.readinessCategory.findMany({
      where: { isActive: true },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        scores: { orderBy: { calculatedAt: "desc" }, take: 1 },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ data: categories });
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
    const session = await requirePermission("readiness.manage");
    const body = await req.json();
    const { type } = body;

    if (type === "category") {
      const { items, ...categoryData } = body;
      const category = await prisma.readinessCategory.create({
        data: {
          ...categoryData,
          items: items
            ? { create: items }
            : undefined,
        },
        include: { items: true },
      });

      await createAuditLog({
        userId: session.id,
        action: "CREATE",
        entityType: "ReadinessCategory",
        entityId: category.id,
        newValue: JSON.stringify(body),
      });

      return NextResponse.json({ data: category }, { status: 201 });
    }

    if (type === "item") {
      const { categoryId, ...itemData } = body;
      const item = await prisma.readinessItem.create({
        data: { ...itemData, categoryId },
      });

      await createAuditLog({
        userId: session.id,
        action: "CREATE",
        entityType: "ReadinessItem",
        entityId: item.id,
        newValue: JSON.stringify(body),
      });

      return NextResponse.json({ data: item }, { status: 201 });
    }

    if (type === "toggle-item") {
      const { itemId, isCompleted } = body;

      const item = await prisma.readinessItem.update({
        where: { id: itemId },
        data: { isCompleted },
      });

      const categoryItems = await prisma.readinessItem.findMany({
        where: { categoryId: item.categoryId },
      });

      const totalItems = categoryItems.length;
      const completedItems = categoryItems.filter((i) => i.isCompleted).length;
      const score = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

      const category = await prisma.readinessCategory.findUnique({
        where: { id: item.categoryId },
      });

      if (category) {
        await prisma.readinessScore.create({
          data: {
            categoryId: category.id,
            categoryName: category.name,
            categoryNameAr: category.nameAr,
            weight: category.weight,
            score,
            totalItems,
            completedItems,
          },
        });
      }

      return NextResponse.json({
        data: { item, score: { score, totalItems, completedItems } },
      });
    }

    return NextResponse.json(
      { message: "Invalid type. Use 'category', 'item', or 'toggle-item'." },
      { status: 400 }
    );
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Unauthorized"
        ? "Unauthorized"
        : "Internal server error";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}
