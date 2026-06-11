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
import { Search, Plus, Eye, Pencil, Layers, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

interface CoverageArea {
  _id: string;
  city: string;
  operationalZone: string;
  districts?: string;
  partner?: { _id: string; tradingNameAr: string };
  coverageType: string;
  status: string;
}

export default function CoverageAreasPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [areas, setAreas] = useState<CoverageArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [partnerFilter, setPartnerFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  const fetchAreas = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      if (cityFilter) params.set("city", cityFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (partnerFilter) params.set("partnerId", partnerFilter);
      params.set("page", String(page));
      params.set("limit", String(pageSize));

      const res = await fetch(`/api/coverage-areas?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAreas(data.coverageAreas ?? data.data ?? []);
      setTotalPages(data.totalPages ?? Math.ceil((data.total ?? 0) / pageSize));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [cityFilter, statusFilter, partnerFilter, page]);

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  const statusOptions = [
    { value: "active", label: t("status.active") },
    { value: "inactive", label: t("status.inactive") },
    { value: "draft", label: t("status.draft") },
  ];

  return (
    <DashboardLayout locale={locale} title={t("coverageAreas.title")}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("coverageAreas.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("coverageAreas.subtitle")}</p>
          </div>
          <Button onClick={() => router.push("/coverage-areas/new")}>
            <Plus className="size-4" />
            {t("coverageAreas.new")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>{t("coverageAreas.title")}</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  options={[{ value: "", label: t("common.allStatuses") }, ...statusOptions]}
                  className="w-36"
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
                action={{ label: t("errors.retry"), onClick: fetchAreas }}
              />
            ) : areas.length === 0 ? (
              <EmptyState
                icon={<Layers className="size-8" />}
                title={t("common.noData")}
                action={{ label: t("coverageAreas.new"), onClick: () => router.push("/coverage-areas/new") }}
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("coverageAreas.city")}</TableHead>
                        <TableHead>{t("coverageAreas.operationalZone")}</TableHead>
                        <TableHead>{t("coverageAreas.districts")}</TableHead>
                        <TableHead>{t("coverageAreas.partner")}</TableHead>
                        <TableHead>{t("coverageAreas.coverageType")}</TableHead>
                        <TableHead>{t("common.status")}</TableHead>
                        <TableHead className="text-end">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {areas.map((area) => (
                        <TableRow
                          key={area._id}
                          className="cursor-pointer"
                          onClick={() => router.push(`/coverage-areas/${area._id}`)}
                        >
                          <TableCell className="font-medium">{area.city}</TableCell>
                          <TableCell>{area.operationalZone}</TableCell>
                          <TableCell className="max-w-xs truncate">{area.districts ?? "-"}</TableCell>
                          <TableCell>{area.partner?.tradingNameAr ?? "-"}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full border border-gray-300 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                              {t(`coverageAreas.${area.coverageType}`)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={area.status} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/coverage-areas/${area._id}`)}
                              >
                                <Eye className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/coverage-areas/${area._id}/edit`)}
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
