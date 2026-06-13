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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Search, Plus, Eye, Pencil, Package, AlertCircle, ChevronLeft, ChevronRight,
  Upload, Download, CheckSquare, Truck, XCircle, Flag
} from "lucide-react";
import { Label } from "@/components/ui/label";

interface Shipment {
  _id: string;
  trackingNumber: string;
  partnerReference?: string;
  orderNumber?: string;
  partner?: { _id: string; tradingNameAr: string };
  contract?: { _id: string; name: string };
  recipientName: string;
  recipientPhone: string;
  city: string;
  status: string;
  priority: string;
  driver?: { _id: string; fullName: string };
  entrySource: string;
  lastStatusUpdate?: string;
  createdAt: string;
}

export default function ShipmentsPage() {
  const t = useTranslations("shipments");
  const tCommon = useTranslations("common");
  const tVal = useTranslations("validation");
  const fmtStatus = (key: string) => t("status_" + key);
  const locale = useLocale();
  const router = useRouter();

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [entrySourceFilter, setEntrySourceFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [bulkNewStatus, setBulkNewStatus] = useState("");
  const [drivers, setDrivers] = useState<{ _id: string; fullName: string }[]>([]);
  const [bulkDriverId, setBulkDriverId] = useState("");
  const pageSize = 20;

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (entrySourceFilter) params.set("entrySource", entrySourceFilter);
      params.set("page", String(page));
      params.set("limit", String(pageSize));
      const res = await fetch(`/api/shipments?${params}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setShipments(json.data ?? []);
      setTotalPages(json.pagination?.totalPages ?? 1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, entrySourceFilter, page]);

  useEffect(() => { fetchShipments(); }, [fetchShipments]);

  const fetchDrivers = useCallback(async () => {
    try {
      const res = await fetch("/api/drivers?limit=200&status=active");
      if (res.ok) {
        const json = await res.json();
        setDrivers(json.data ?? []);
      }
    } catch {}
  }, []);

  const handleBulkStatusChange = async () => {
    if (!bulkNewStatus || selected.size === 0) return;
    try {
      const res = await fetch("/api/shipments/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), status: bulkNewStatus }),
      });
      if (res.ok) {
        setStatusDialogOpen(false);
        setBulkNewStatus("");
        setSelected(new Set());
        fetchShipments();
      }
    } catch {}
  };

  const handleBulkAssign = async () => {
    if (!bulkDriverId || selected.size === 0) return;
    try {
      const res = await fetch("/api/shipments/bulk-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), driverId: bulkDriverId }),
      });
      if (res.ok) {
        setAssignDialogOpen(false);
        setBulkDriverId("");
        setSelected(new Set());
        fetchShipments();
      }
    } catch {}
  };

  const handleBulkAction = async (action: string) => {
    if (selected.size === 0) return;
    if (action === "status") { fetchDrivers(); setStatusDialogOpen(true); return; }
    if (action === "assign") { fetchDrivers(); setAssignDialogOpen(true); return; }
    try {
      const res = await fetch(`/api/shipments/bulk-${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (res.ok) {
        setSelected(new Set());
        fetchShipments();
      }
    } catch {}
  };

  const handleExportCsv = async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (entrySourceFilter) params.set("entrySource", entrySourceFilter);
    params.set("export", "csv");
    window.open(`/api/shipments?${params}`, "_blank");
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === shipments.length) setSelected(new Set());
    else setSelected(new Set(shipments.map(s => s._id)));
  };

  const statusOptions = [
    { value: "", label: tCommon("all") },
    { value: "DRAFT", label: t("status_draft") },
    { value: "NEW", label: t("status_new") },
    { value: "RECEIVED_FROM_PARTNER", label: t("status_received_from_partner") },
    { value: "READY_FOR_DISPATCH", label: t("status_ready_for_dispatch") },
    { value: "ASSIGNED_TO_DRIVER", label: t("status_assigned_to_driver") },
    { value: "OUT_FOR_DELIVERY", label: t("status_out_for_delivery") },
    { value: "DELIVERED", label: t("status_delivered") },
    { value: "FAILED_ATTEMPT", label: t("status_failed_attempt") },
    { value: "RETURN_PENDING", label: t("status_return_pending") },
    { value: "RETURNED_TO_PARTNER", label: t("status_returned_to_partner") },
    { value: "CANCELLED", label: t("status_cancelled") },
    { value: "NEEDS_REVIEW", label: t("status_needs_review") },
  ];

  const entrySourceOptions = [
    { value: "", label: tCommon("all") },
    { value: "MANUAL", label: t("entry_manual") },
    { value: "EXCEL_IMPORT", label: t("entry_excel_import") },
    { value: "CSV_IMPORT", label: t("entry_csv_import") },
    { value: "API", label: t("entry_api") },
    { value: "PARTNER_PORTAL", label: t("entry_partner_portal") },
  ];

  return (
    <DashboardLayout locale={locale} title={t("title")}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExportCsv}>
              <Download className="size-4" />
              {t("exportCsv")}
            </Button>
            <Button variant="outline" onClick={() => router.push("/shipments/import")}>
              <Upload className="size-4" />
              {t("importShipments")}
            </Button>
            <Button onClick={() => router.push("/shipments/new")}>
              <Plus className="size-4" />
              {t("new")}
            </Button>
          </div>
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
                  value={entrySourceFilter}
                  onChange={(e) => { setEntrySourceFilter(e.target.value); setPage(1); }}
                  options={entrySourceOptions}
                  className="w-36"
                />
              </div>
            </div>
            {selected.size > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <span className="text-sm text-gray-600">{selected.size} selected</span>
                <Button variant="outline" size="sm" onClick={() => handleBulkAction("status")}>
                  <Flag className="size-3" />
                  {t("bulkStatusChange")}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkAction("assign")}>
                  <Truck className="size-3" />
                  {t("bulkAssign")}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkAction("ready-for-dispatch")}>
                  <CheckSquare className="size-3" />
                  {t("bulkReadyForDispatch")}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkAction("needs-review")}>
                  <AlertCircle className="size-3" />
                  {t("bulkNeedsReview")}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : error ? (
              <EmptyState
                icon={<AlertCircle className="size-8" />}
                title={tCommon("error")}
                action={{ label: tCommon("retry"), onClick: fetchShipments }}
              />
            ) : shipments.length === 0 ? (
              <EmptyState
                icon={<Package className="size-8" />}
                title={tCommon("noData")}
                action={{ label: t("new"), onClick: () => router.push("/shipments/new") }}
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <input
                            type="checkbox"
                            checked={selected.size === shipments.length && shipments.length > 0}
                            onChange={toggleSelectAll}
                            className="size-4 rounded border-gray-300"
                          />
                        </TableHead>
                        <TableHead>{t("trackingNumber")}</TableHead>
                        <TableHead>{t("partner")}</TableHead>
                        <TableHead>{t("recipientName")}</TableHead>
                        <TableHead>{t("city")}</TableHead>
                        <TableHead>{tCommon("status")}</TableHead>
                        <TableHead>{t("priority")}</TableHead>
                        <TableHead>{t("driver")}</TableHead>
                        <TableHead>{t("entrySource")}</TableHead>
                        <TableHead>{t("lastStatusUpdate")}</TableHead>
                        <TableHead className="text-end">{tCommon("actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shipments.map((s) => (
                        <TableRow
                          key={s._id}
                          className="cursor-pointer"
                          onClick={() => router.push(`/shipments/${s._id}`)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selected.has(s._id)}
                              onChange={() => toggleSelect(s._id)}
                              className="size-4 rounded border-gray-300"
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs font-medium">{s.trackingNumber}</TableCell>
                          <TableCell>{s.partner?.tradingNameAr ?? "-"}</TableCell>
                          <TableCell>{s.recipientName}</TableCell>
                          <TableCell>{s.city}</TableCell>
                          <TableCell><StatusBadge status={s.status} formatLabel={fmtStatus} /></TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full border border-gray-300 px-2 py-0.5 text-xs font-medium text-gray-700">
                              {t(`priority_${s.priority?.toLowerCase()}`)}
                            </span>
                          </TableCell>
                          <TableCell>{s.driver?.fullName ?? "-"}</TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-500">{t(`entry_${s.entrySource?.toLowerCase()}`)}</span>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {s.lastStatusUpdate ? new Date(s.lastStatusUpdate).toLocaleDateString() : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" onClick={() => router.push(`/shipments/${s._id}`)}>
                                <Eye className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => router.push(`/shipments/${s._id}/edit`)}>
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

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("bulkStatusChange")}</DialogTitle>
            <DialogDescription>{tCommon("confirm")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{tCommon("status")}</Label>
              <Select
                value={bulkNewStatus}
                onChange={(e) => setBulkNewStatus(e.target.value)}
                options={statusOptions.filter(o => o.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>{tCommon("cancel")}</Button>
            <Button onClick={handleBulkStatusChange} disabled={!bulkNewStatus}>{tCommon("confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("bulkAssign")}</DialogTitle>
            <DialogDescription>{tCommon("confirm")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("driver")}</Label>
              <Select
                value={bulkDriverId}
                onChange={(e) => setBulkDriverId(e.target.value)}
                options={drivers.map(d => ({ value: d._id, label: d.fullName }))}
                placeholder={tCommon("select")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>{tCommon("cancel")}</Button>
            <Button onClick={handleBulkAssign} disabled={!bulkDriverId}>{tCommon("confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
