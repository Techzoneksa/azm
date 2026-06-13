"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, Plus, Eye, Pencil, MapPin, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

interface PickupPoint {
  _id: string;
  name: string;
  partner?: { _id: string; tradingNameAr: string };
  pointType: string;
  city: string;
  status: string;
  contactPerson: string;
}

export default function PickupPointsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [points, setPoints] = useState<PickupPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [partnerFilter, setPartnerFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  const fetchPoints = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (partnerFilter) params.set("partnerId", partnerFilter);
      if (cityFilter) params.set("city", cityFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("pointType", typeFilter);
      params.set("page", String(page));
      params.set("limit", String(pageSize));

      const res = await fetch(`/api/pickup-points?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPoints(data.pickupPoints ?? data.data ?? []);
      setTotalPages(data.totalPages ?? Math.ceil((data.total ?? 0) / pageSize));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [search, partnerFilter, cityFilter, statusFilter, typeFilter, page]);

  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  const statusOptions = [
    { value: "active", label: t("status.active") },
    { value: "inactive", label: t("status.inactive") },
    { value: "draft", label: t("status.draft") },
  ];

  const typeOptions = [
    { value: "warehouse", label: t("pickupPoints.type_warehouse") },
    { value: "store", label: t("pickupPoints.type_store") },
    { value: "hub", label: t("pickupPoints.type_hub") },
    { value: "drop_off", label: t("pickupPoints.type_drop_off") },
  ];

  return (
    <DashboardLayout locale={locale} title={t("pickupPoints.title")}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("pickupPoints.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("pickupPoints.subtitle")}</p>
          </div>
          <Button onClick={() => router.push("/pickup-points/new")}>
            <Plus className="size-4" />
            {t("pickupPoints.new")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>{t("pickupPoints.title")}</CardTitle>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder={t("common.search")}
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="ps-9 w-48"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  options={[{ value: "", label: t("common.allStatuses") }, ...statusOptions]}
                  className="w-32"
                />
                <Select
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                  options={[{ value: "", label: t("common.allTypes") }, ...typeOptions]}
                  className="w-32"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : error ? (
              <EmptyState
                icon={<AlertCircle className="size-8" />}
                title={t("common.error")}
                action={{ label: t("errors.retry"), onClick: fetchPoints }}
              />
            ) : points.length === 0 ? (
              <EmptyState
                icon={<MapPin className="size-8" />}
                title={t("common.noData")}
                action={{ label: t("pickupPoints.new"), onClick: () => router.push("/pickup-points/new") }}
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("pickupPoints.name")}</TableHead>
                        <TableHead>{t("pickupPoints.partner")}</TableHead>
                        <TableHead>{t("pickupPoints.pointType")}</TableHead>
                        <TableHead>{t("pickupPoints.city")}</TableHead>
                        <TableHead>{t("common.status")}</TableHead>
                        <TableHead>{t("pickupPoints.contactPerson")}</TableHead>
                        <TableHead className="text-end">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {points.map((point) => (
                        <TableRow
                          key={point._id}
                          className="cursor-pointer"
                          onClick={() => router.push(`/pickup-points/${point._id}`)}
                        >
                          <TableCell className="font-medium">{point.name}</TableCell>
                          <TableCell>{point.partner?.tradingNameAr ?? "-"}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full border border-gray-300 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                              {t(`pickupPoints.type_${point.pointType}`)}
                            </span>
                          </TableCell>
                          <TableCell>{point.city}</TableCell>
                          <TableCell>
                            <StatusBadge status={point.status} formatLabel={(key) => t("status." + key)} />
                          </TableCell>
                          <TableCell>{point.contactPerson ?? "-"}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/pickup-points/${point._id}`)}
                              >
                                <Eye className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/pickup-points/${point._id}/edit`)}
                              >
                                <Pencil className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      {t("readiness.itemsCompleted")} {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
