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
import { Search, Plus, Eye, Pencil, Users, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

interface Driver {
  _id: string;
  fullName: string;
  phone: string;
  nationalId: string;
  city: string;
  status: string;
  readinessStatus: string;
  documentsCount?: number;
}

export default function DriversPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", String(pageSize));

      const res = await fetch(`/api/drivers?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setDrivers(data.drivers ?? data.data ?? []);
      setTotalPages(data.totalPages ?? Math.ceil((data.total ?? 0) / pageSize));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const statusOptions = [
    { value: "active", label: t("status.active") },
    { value: "inactive", label: t("status.inactive") },
    { value: "draft", label: t("status.draft") },
    { value: "suspended", label: t("status.suspended") },
  ];

  return (
    <DashboardLayout locale={locale} title={t("drivers.title")}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("drivers.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("drivers.subtitle")}</p>
          </div>
          <Button onClick={() => router.push("/drivers/new")}>
            <Plus className="size-4" />
            {t("drivers.new")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>{t("drivers.title")}</CardTitle>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder={t("common.search")}
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="ps-9"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  options={[{ value: "", label: t("common.all") }, ...statusOptions]}
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
                title={t("common.error")}
                action={{ label: t("errors.retry"), onClick: fetchDrivers }}
              />
            ) : drivers.length === 0 ? (
              <EmptyState
                icon={<Users className="size-8" />}
                title={t("common.noData")}
                action={{ label: t("drivers.new"), onClick: () => router.push("/drivers/new") }}
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("drivers.fullName")}</TableHead>
                        <TableHead>{t("drivers.phone")}</TableHead>
                        <TableHead>{t("drivers.nationalId")}</TableHead>
                        <TableHead>{t("drivers.city")}</TableHead>
                        <TableHead>{t("common.status")}</TableHead>
                        <TableHead>{t("drivers.readinessStatus")}</TableHead>
                        <TableHead>{t("drivers.documents")}</TableHead>
                        <TableHead className="text-end">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drivers.map((driver) => (
                        <TableRow key={driver._id}>
                          <TableCell className="font-medium">{driver.fullName}</TableCell>
                          <TableCell>{driver.phone}</TableCell>
                          <TableCell>{driver.nationalId}</TableCell>
                          <TableCell>{driver.city}</TableCell>
                          <TableCell>
                            <StatusBadge status={driver.status} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={driver.readinessStatus} />
                          </TableCell>
                          <TableCell>{driver.documentsCount ?? 0}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/drivers/${driver._id}`)}
                              >
                                <Eye className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/drivers/${driver._id}/edit`)}
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
