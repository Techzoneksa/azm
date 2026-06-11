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
import { ArrowLeft, Pencil, MapPin, AlertCircle, Phone, User, Globe } from "lucide-react";

interface PickupPoint {
  _id: string;
  name: string;
  partner?: { _id: string; tradingNameAr: string };
  pointType: string;
  city: string;
  district: string;
  address: string;
  nationalAddress: string;
  mapLink: string;
  contactPerson: string;
  contactPhone: string;
  workingDays: string;
  workingHours: string;
  pickupInstructions: string;
  requiresAppointment: boolean;
  status: string;
}

export default function PickupPointDetailPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split("/").slice(-2, -1)[0] ?? pathname.split("/").pop() ?? "";

  const [point, setPoint] = useState<PickupPoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchPoint = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/pickup-points/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPoint(data.pickupPoint ?? data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPoint();
  }, [fetchPoint]);

  if (loading) {
    return (
      <DashboardLayout locale={locale} title={t("pickupPoints.details")}>
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

  if (error || !point) {
    return (
      <DashboardLayout locale={locale} title={t("pickupPoints.details")}>
        <EmptyState
          icon={<AlertCircle className="size-8" />}
          title={t("common.error")}
          action={{ label: t("errors.retry"), onClick: fetchPoint }}
        />
      </DashboardLayout>
    );
  }

  const infoRows = [
    { label: t("pickupPoints.name"), value: point.name },
    { label: t("pickupPoints.partner"), value: point.partner?.tradingNameAr ?? "-" },
    { label: t("pickupPoints.pointType"), value: t(`pickupPoints.${point.pointType}`) },
    { label: t("pickupPoints.city"), value: point.city },
    { label: t("pickupPoints.district"), value: point.district },
    { label: t("pickupPoints.address"), value: point.address },
    { label: t("pickupPoints.nationalAddress"), value: point.nationalAddress },
    { label: t("pickupPoints.contactPerson"), value: point.contactPerson },
    { label: t("pickupPoints.contactPhone"), value: point.contactPhone },
    { label: t("pickupPoints.workingDays"), value: point.workingDays },
    { label: t("pickupPoints.workingHours"), value: point.workingHours },
    { label: t("pickupPoints.requiresAppointment"), value: point.requiresAppointment ? t("common.yes") : t("common.no") },
  ];

  return (
    <DashboardLayout locale={locale} title={t("pickupPoints.details")}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/pickup-points")}>
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("pickupPoints.details")}</h1>
            </div>
          </div>
          <Button onClick={() => router.push(`/pickup-points/${id}/edit`)}>
            <Pencil className="size-4" />
            {t("common.edit")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{point.name}</CardTitle>
                <CardDescription>{point.partner?.tradingNameAr ?? ""}</CardDescription>
              </div>
              <StatusBadge status={point.status} />
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
            {point.pickupInstructions && (
              <div className="mt-4">
                <dt className="text-xs font-medium text-gray-500">{t("pickupPoints.pickupInstructions")}</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{point.pickupInstructions}</dd>
              </div>
            )}
            {point.mapLink && (
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={() => window.open(point.mapLink, "_blank")}>
                  <MapPin className="size-4 me-1" />
                  {t("pickupPoints.viewOnMap")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
