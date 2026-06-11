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
import { Search, Plus, Eye, Pencil, Building2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

interface Partner {
  _id: string;
  tradingNameAr: string;
  partnerType: string;
  city: string;
  status: string;
  priority: string;
  contractsCount?: number;
  lastContactedAt?: string;
}

export default function PartnersPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter) params.set("partnerType", typeFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (cityFilter) params.set("city", cityFilter);
      if (priorityFilter) params.set("priority", priorityFilter);
      params.set("page", String(page));
      params.set("limit", String(pageSize));

      const res = await fetch(`/api/partners?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPartners(data.partners ?? data.data ?? []);
      setTotalPages(data.totalPages ?? Math.ceil((data.total ?? 0) / pageSize));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, cityFilter, priorityFilter, page]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const typeOptions = [
    { value: "carrier", label: t("partners.type_carrier") },
    { value: "supplier", label: t("partners.type_supplier") },
    { value: "client", label: t("partners.type_client") },
    { value: "service_provider", label: t("partners.type_service_provider") },
  ];

  const statusOptions = [
    { value: "active", label: t("status.active") },
    { value: "inactive", label: t("status.inactive") },
    { value: "draft", label: t("status.draft") },
    { value: "suspended", label: t("status.suspended") },
  ];

  const priorityOptions = [
    { value: "low", label: t("partners.priority_low") },
    { value: "medium", label: t("partners.priority_medium") },
    { value: "high", label: t("partners.priority_high") },
    { value: "critical", label: t("partners.priority_critical") },
  ];

  return (
    <DashboardLayout locale={locale} title={t("partners.title")}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("partners.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("partners.subtitle")}</p>
          </div>
          <Button onClick={() => router.push("/partners/new")}>
            <Plus className="size-4" />
            {t("partners.new")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>{t("partners.title")}</CardTitle>
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
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                  options={[{ value: "", label: t("common.allTypes") }, ...typeOptions]}
                  className="w-36"
                />
                <Select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  options={[{ value: "", label: t("common.allStatuses") }, ...statusOptions]}
                  className="w-36"
                />
                <Select
                  value={priorityFilter}
                  onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
                  options={[{ value: "", label: t("common.allPriorities") }, ...priorityOptions]}
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
                action={{ label: t("errors.retry"), onClick: fetchPartners }}
              />
            ) : partners.length === 0 ? (
              <EmptyState
                icon={<Building2 className="size-8" />}
                title={t("common.noData")}
                action={{ label: t("partners.new"), onClick: () => router.push("/partners/new") }}
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("partners.tradingNameAr")}</TableHead>
                        <TableHead>{t("partners.partnerType")}</TableHead>
                        <TableHead>{t("partners.city")}</TableHead>
                        <TableHead>{t("common.status")}</TableHead>
                        <TableHead>{t("partners.priority")}</TableHead>
                        <TableHead>{t("partners.contractsCount")}</TableHead>
                        <TableHead>{t("partners.lastContactedAt")}</TableHead>
                        <TableHead className="text-end">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partners.map((partner) => (
                        <TableRow
                          key={partner._id}
                          className="cursor-pointer"
                          onClick={() => router.push(`/partners/${partner._id}`)}
                        >
                          <TableCell className="font-medium">{partner.tradingNameAr}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full border border-gray-300 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                              {t(`partners.${partner.partnerType}`)}
                            </span>
                          </TableCell>
                          <TableCell>{partner.city}</TableCell>
                          <TableCell>
                            <StatusBadge status={partner.status} />
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full border border-gray-300 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                              {t(`partners.${partner.priority}`)}
                            </span>
                          </TableCell>
                          <TableCell>{partner.contractsCount ?? 0}</TableCell>
                          <TableCell>{partner.lastContactedAt ?? "-"}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/partners/${partner._id}`)}
                              >
                                <Eye className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/partners/${partner._id}/edit`)}
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
