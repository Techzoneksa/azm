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
import { Search, Eye, Package, AlertCircle, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";

interface ReturnRecord {
  _id: string;
  shipment?: { _id: string; trackingNumber: string };
  reason: string;
  status: string;
  returnRequestedAt: string;
  returnDueAt?: string;
  returnedAt?: string;
  recipientName?: string;
  recipientPhone?: string;
  partner?: { _id: string; tradingNameAr: string };
}

export default function ReturnsPage() {
  const t = useTranslations("returns");
  const tShip = useTranslations("shipments");
  const tCommon = useTranslations("common");
  const fmtStatus = (key: string) => t("status_" + key);
  const locale = useLocale();
  const router = useRouter();

  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (reasonFilter) params.set("reason", reasonFilter);
      params.set("page", String(page));
      params.set("limit", String(pageSize));

      const res = await fetch(`/api/returns?${params}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setReturns(json.data ?? []);
      setTotalPages(json.pagination?.totalPages ?? 1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, reasonFilter, page]);

  useEffect(() => { fetchReturns(); }, [fetchReturns]);

  const statusOptions = [
    { value: "", label: tCommon("all") },
    { value: "RETURN_PENDING", label: t("status_return_pending") },
    { value: "WITH_DRIVER", label: t("status_with_driver") },
    { value: "RETURNED_TO_PICKUP_POINT", label: t("status_returned_to_pickup_point") },
    { value: "RETURNED_TO_PARTNER", label: t("status_returned_to_partner") },
    { value: "CANCELLED", label: t("status_cancelled") },
  ];

  const reasonOptions = [
    { value: "", label: tCommon("all") },
    { value: "customer_refused", label: t("reason_customer_refused") },
    { value: "customer_not_responding", label: t("reason_customer_not_responding") },
    { value: "wrong_address", label: t("reason_wrong_address") },
    { value: "cancelled_by_partner", label: t("reason_cancelled_by_partner") },
    { value: "damaged_package", label: t("reason_damaged_package") },
    { value: "max_attempts_reached", label: t("reason_max_attempts_reached") },
    { value: "other", label: t("reason_other") },
  ];

  return (
    <DashboardLayout locale={locale} title={t("title")}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>{t("title")}</CardTitle>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder={tCommon("search")}
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="ps-9 w-48"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  options={statusOptions}
                  className="w-40"
                />
                <Select
                  value={reasonFilter}
                  onChange={(e) => { setReasonFilter(e.target.value); setPage(1); }}
                  options={reasonOptions}
                  className="w-40"
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
                title={tCommon("error")}
                action={{ label: tCommon("retry"), onClick: fetchReturns }}
              />
            ) : returns.length === 0 ? (
              <EmptyState
                icon={<Package className="size-8" />}
                title={tCommon("noData")}
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{tShip("trackingNumber")}</TableHead>
                        <TableHead>{tShip("recipientName")}</TableHead>
                        <TableHead>{tShip("partner")}</TableHead>
                        <TableHead>{t("reason")}</TableHead>
                        <TableHead>{tCommon("status")}</TableHead>
                        <TableHead>{t("returnRequestedAt")}</TableHead>
                        <TableHead className="text-end">{tCommon("actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {returns.map((r) => (
                        <TableRow
                          key={r._id}
                          className="cursor-pointer"
                          onClick={() => router.push(`/returns/${r._id}`)}
                        >
                          <TableCell className="font-mono text-xs font-medium">
                            {r.shipment?.trackingNumber ?? "-"}
                          </TableCell>
                          <TableCell>{r.recipientName ?? "-"}</TableCell>
                          <TableCell>{r.partner?.tradingNameAr ?? "-"}</TableCell>
                          <TableCell className="text-xs">
                            {t(`reason_${r.reason}`)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={r.status} formatLabel={fmtStatus} />
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {new Date(r.returnRequestedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => { e.stopPropagation(); router.push(`/returns/${r._id}`); }}
                            >
                              <Eye className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="text-sm text-gray-600">{page} / {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
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
