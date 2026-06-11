"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowLeft, Pencil, Layers, AlertCircle } from "lucide-react";

interface CoverageArea {
  _id: string;
  partner?: { _id: string; tradingNameAr: string };
  contract?: { _id: string; name: string };
  city: string;
  operationalZone: string;
  districts: string;
  coverageType: string;
  coverageDays: string;
  coverageStartTime: string;
  coverageEndTime: string;
  minExpectedShipments: number;
  maxExpectedShipments: number;
  needsDedicatedDrivers: boolean;
  status: string;
}

export default function CoverageAreaDetailPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split("/").slice(-2, -1)[0] ?? pathname.split("/").pop() ?? "";

  const [area, setArea] = useState<CoverageArea | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchArea = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/coverage-areas/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setArea(data.coverageArea ?? data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchArea();
  }, [fetchArea]);

  if (loading) {
    return (
      <DashboardLayout locale={locale} title={t("coverageAreas.details")}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !area) {
    return (
      <DashboardLayout locale={locale} title={t("coverageAreas.details")}>
        <EmptyState
          icon={<AlertCircle className="size-8" />}
          title={t("common.error")}
          action={{ label: t("errors.retry"), onClick: fetchArea }}
        />
      </DashboardLayout>
    );
  }

  const infoRows = [
    { label: t("coverageAreas.partner"), value: area.partner?.tradingNameAr ?? "-" },
    { label: t("coverageAreas.contract"), value: area.contract?.name ?? "-" },
    { label: t("coverageAreas.city"), value: area.city },
    { label: t("coverageAreas.operationalZone"), value: area.operationalZone },
    { label: t("coverageAreas.districts"), value: area.districts },
    { label: t("coverageAreas.coverageType"), value: t(`coverageAreas.${area.coverageType}`) },
    { label: t("coverageAreas.coverageDays"), value: area.coverageDays },
    { label: t("coverageAreas.coverageStartTime"), value: area.coverageStartTime },
    { label: t("coverageAreas.coverageEndTime"), value: area.coverageEndTime },
    { label: t("coverageAreas.minExpectedShipments"), value: String(area.minExpectedShipments ?? "-") },
    { label: t("coverageAreas.maxExpectedShipments"), value: String(area.maxExpectedShipments ?? "-") },
    { label: t("coverageAreas.needsDedicatedDrivers"), value: area.needsDedicatedDrivers ? t("common.yes") : t("common.no") },
  ];

  return (
    <DashboardLayout locale={locale} title={t("coverageAreas.details")}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/coverage-areas")}>
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("coverageAreas.details")}</h1>
            </div>
          </div>
          <Button onClick={() => router.push(`/coverage-areas/${id}/edit`)}>
            <Pencil className="size-4" />
            {t("common.edit")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{area.city} - {area.operationalZone}</CardTitle>
                <CardDescription>{area.partner?.tradingNameAr ?? ""}</CardDescription>
              </div>
              <StatusBadge status={area.status} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {infoRows.map((row) =>
                row.value ? (
                  <div key={row.label}>
                    <dt className="text-xs font-medium text-gray-500">{row.label}</dt>
                    <dd className="mt-0.5 text-sm font-medium text-gray-900">{row.value}</dd>
                  </div>
                ) : null
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
