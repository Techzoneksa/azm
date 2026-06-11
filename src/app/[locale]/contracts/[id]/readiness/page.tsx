"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface ReadinessItem {
  _id: string;
  name: string;
  nameAr: string;
  isMandatory: boolean;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
}

export default function ReadinessChecklistPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split("/").slice(-2, -1)[0] ?? pathname.split("/").slice(-3, -2)[0] ?? "";

  const [items, setItems] = useState<ReadinessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/contracts/${id}/readiness`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setItems(data.items ?? data.data ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const toggleItem = async (itemId: string, currentCompleted: boolean) => {
    setToggling(itemId);
    try {
      const res = await fetch(`/api/contracts/${id}/readiness/${itemId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !currentCompleted }),
      });
      if (!res.ok) throw new Error("Failed to toggle");
      setItems((prev) =>
        prev.map((item) =>
          item._id === itemId ? { ...item, isCompleted: !currentCompleted } : item
        )
      );
    } catch {
      //
    } finally {
      setToggling(null);
    }
  };

  const mandatoryItems = items.filter((i) => i.isMandatory);
  const optionalItems = items.filter((i) => !i.isMandatory);
  const completedCount = items.filter((i) => i.isCompleted).length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <DashboardLayout locale={locale} title={t("contracts.readiness")}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/contracts/${id}`)}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("contracts.readiness")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("contracts.readinessDescription")}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("contracts.readinessProgress")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Progress value={progress} className="flex-1" />
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                {completedCount}/{items.length}
              </span>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            icon={<AlertCircle className="size-8" />}
            title={t("common.error")}
            action={{ label: t("errors.retry"), onClick: fetchItems }}
          />
        ) : items.length === 0 ? (
          <EmptyState icon={<CheckCircle2 className="size-8" />} title={t("common.noData")} />
        ) : (
          <>
            {mandatoryItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("contracts.mandatoryItems")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {mandatoryItems.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleItem(item._id, item.isCompleted)}
                          disabled={toggling === item._id}
                          className={`size-5 rounded border-2 flex items-center justify-center transition-colors ${
                            item.isCompleted
                              ? "bg-green-500 border-green-500 text-white"
                              : "border-gray-300 hover:border-blue-400"
                          }`}
                        >
                          {toggling === item._id ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : item.isCompleted ? (
                            <CheckCircle2 className="size-4" />
                          ) : null}
                        </button>
                        <span className="text-sm font-medium text-gray-900">{item.nameAr}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {t("contracts.mandatory")}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {optionalItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("contracts.optionalItems")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {optionalItems.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleItem(item._id, item.isCompleted)}
                          disabled={toggling === item._id}
                          className={`size-5 rounded border-2 flex items-center justify-center transition-colors ${
                            item.isCompleted
                              ? "bg-green-500 border-green-500 text-white"
                              : "border-gray-300 hover:border-blue-400"
                          }`}
                        >
                          {toggling === item._id ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : item.isCompleted ? (
                            <CheckCircle2 className="size-4" />
                          ) : null}
                        </button>
                        <span className="text-sm font-medium text-gray-900">{item.nameAr}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {t("contracts.optional")}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
