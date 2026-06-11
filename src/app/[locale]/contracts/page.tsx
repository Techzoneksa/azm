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
import { Search, Plus, Eye, Pencil, FileText, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

interface Contract {
  _id: string;
  contractNumber: string;
  name: string;
  partner?: { _id: string; tradingNameAr: string };
  contractType: string;
  status: string;
  startDate: string;
  endDate: string;
  readinessStatus: string;
}

export default function ContractsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [partnerFilter, setPartnerFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (partnerFilter) params.set("partnerId", partnerFilter);
      if (typeFilter) params.set("contractType", typeFilter);
      params.set("page", String(page));
      params.set("limit", String(pageSize));

      const res = await fetch(`/api/contracts?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setContracts(data.contracts ?? data.data ?? []);
      setTotalPages(data.totalPages ?? Math.ceil((data.total ?? 0) / pageSize));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, partnerFilter, typeFilter, page]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const statusOptions = [
    { value: "active", label: t("status.active") },
    { value: "draft", label: t("status.draft") },
    { value: "ended", label: t("status.ended") },
    { value: "suspended", label: t("status.suspended") },
  ];

  const typeOptions = [
    { value: "main", label: t("contracts.type_main") },
    { value: "sub", label: t("contracts.type_sub") },
    { value: "temporary", label: t("contracts.type_temporary") },
  ];

  return (
    <DashboardLayout locale={locale} title={t("contracts.title")}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("contracts.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("contracts.subtitle")}</p>
          </div>
          <Button onClick={() => router.push("/contracts/new")}>
            <Plus className="size-4" />
            {t("contracts.new")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>{t("contracts.title")}</CardTitle>
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
                  className="w-36"
                />
                <Select
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                  options={[{ value: "", label: t("common.allTypes") }, ...typeOptions]}
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
                action={{ label: t("errors.retry"), onClick: fetchContracts }}
              />
            ) : contracts.length === 0 ? (
              <EmptyState
                icon={<FileText className="size-8" />}
                title={t("common.noData")}
                action={{ label: t("contracts.new"), onClick: () => router.push("/contracts/new") }}
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("contracts.contractNumber")}</TableHead>
                        <TableHead>{t("contracts.name")}</TableHead>
                        <TableHead>{t("contracts.partner")}</TableHead>
                        <TableHead>{t("contracts.contractType")}</TableHead>
                        <TableHead>{t("common.status")}</TableHead>
                        <TableHead>{t("contracts.startDate")}</TableHead>
                        <TableHead>{t("contracts.endDate")}</TableHead>
                        <TableHead>{t("contracts.readinessStatus")}</TableHead>
                        <TableHead className="text-end">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contracts.map((contract) => (
                        <TableRow
                          key={contract._id}
                          className="cursor-pointer"
                          onClick={() => router.push(`/contracts/${contract._id}`)}
                        >
                          <TableCell className="font-medium">{contract.contractNumber}</TableCell>
                          <TableCell>{contract.name}</TableCell>
                          <TableCell>{contract.partner?.tradingNameAr ?? "-"}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full border border-gray-300 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                              {t(`contracts.${contract.contractType}`)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={contract.status} />
                          </TableCell>
                          <TableCell>{contract.startDate}</TableCell>
                          <TableCell>{contract.endDate}</TableCell>
                          <TableCell>
                            <StatusBadge status={contract.readinessStatus} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/contracts/${contract._id}`)}
                              >
                                <Eye className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/contracts/${contract._id}/edit`)}
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
