"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search, Truck, AlertCircle, Clock, User, MapPin, XCircle, CheckSquare,
  ChevronLeft, ChevronRight, AlertTriangle, Info
} from "lucide-react";

interface ShipmentCard {
  _id: string;
  trackingNumber: string;
  recipientName: string;
  city: string;
  status: string;
  priority: string;
  deliveryDate?: string;
  lastStatusUpdate?: string;
  driver?: { _id: string; fullName: string };
}

interface ColumnData {
  status: string;
  label: string;
  shipments: ShipmentCard[];
  count: number;
}

export default function DispatchPage() {
  const t = useTranslations("dispatch");
  const tShip = useTranslations("shipments");
  const tCommon = useTranslations("common");
  const fmtStatus = (key: string) => tShip("status_" + key);
  const locale = useLocale();
  const router = useRouter();

  const [columns, setColumns] = useState<ColumnData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [partnerFilter, setPartnerFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [driverFilter, setDriverFilter] = useState("");
  const [partners, setPartners] = useState<{ _id: string; tradingNameAr: string }[]>([]);
  const [drivers, setDrivers] = useState<{ _id: string; fullName: string }[]>([]);
  const [alertInfo, setAlertInfo] = useState({ delayed: 0, unassigned: 0, stale: 0 });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [bulkDriverId, setBulkDriverId] = useState("");
  const [bulkNewStatus, setBulkNewStatus] = useState("");

  const columnConfigs = [
    { status: "NEW", label: t("new") },
    { status: "RECEIVED_FROM_PARTNER", label: t("received") },
    { status: "READY_FOR_DISPATCH", label: t("ready") },
    { status: "ASSIGNED_TO_DRIVER", label: t("assigned") },
    { status: "OUT_FOR_DELIVERY", label: t("outForDelivery") },
    { status: "FAILED_ATTEMPT", label: t("failed") },
    { status: "DELIVERED", label: t("delivered") },
    { status: "RETURN_PENDING", label: t("returnPending") },
    { status: "RETURNED_TO_PARTNER", label: t("returned") },
    { status: "NEEDS_REVIEW", label: t("needsReview") },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (partnerFilter) params.set("partnerId", partnerFilter);
      if (cityFilter) params.set("city", cityFilter);
      if (driverFilter) params.set("driverId", driverFilter);

      const [dispatchRes, alertsRes, partnersRes, driversRes] = await Promise.all([
        fetch(`/api/dispatch?${params}`),
        fetch(`/api/dispatch/alerts?${params}`).catch(() => null),
        fetch("/api/partners?limit=500&status=active").catch(() => null),
        fetch("/api/drivers?limit=500&status=active").catch(() => null),
      ]);
      if (!dispatchRes.ok) throw new Error("Failed");
      const dData = await dispatchRes.json();

      const grouped: Record<string, ShipmentCard[]> = {};
      const all = dData.data ?? dData.shipments ?? [];
      all.forEach((s: ShipmentCard) => {
        if (!grouped[s.status]) grouped[s.status] = [];
        grouped[s.status].push(s);
      });

      setColumns(columnConfigs.map(c => ({
        status: c.status,
        label: c.label,
        shipments: grouped[c.status] ?? [],
        count: grouped[c.status]?.length ?? 0,
      })));

      if (alertsRes?.ok) {
        const aData = await alertsRes.json();
        setAlertInfo(aData.data ?? aData);
      }
      if (partnersRes?.ok) { const pj = await partnersRes.json(); setPartners(pj.data ?? []); }
      if (driversRes?.ok) { const dj = await driversRes.json(); setDrivers(dj.data ?? []); }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [search, partnerFilter, cityFilter, driverFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleQuickAssign = async (shipmentId: string, driverId: string) => {
    try {
      await fetch(`/api/shipments/${shipmentId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId }),
      });
      fetchData();
    } catch {}
  };

  const handleBulkAssign = async () => {
    if (!bulkDriverId || selected.size === 0) return;
    try {
      await fetch("/api/shipments/bulk-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), driverId: bulkDriverId }),
      });
      setAssignDialogOpen(false);
      setBulkDriverId("");
      setSelected(new Set());
      fetchData();
    } catch {}
  };

  const handleBulkStatusChange = async () => {
    if (!bulkNewStatus || selected.size === 0) return;
    try {
      await fetch("/api/shipments/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), status: bulkNewStatus }),
      });
      setStatusDialogOpen(false);
      setBulkNewStatus("");
      setSelected(new Set());
      fetchData();
    } catch {}
  };

  const statusOptions = [
    { value: "RECEIVED_FROM_PARTNER", label: tShip("status_received_from_partner") },
    { value: "READY_FOR_DISPATCH", label: tShip("status_ready_for_dispatch") },
    { value: "ASSIGNED_TO_DRIVER", label: tShip("status_assigned_to_driver") },
    { value: "OUT_FOR_DELIVERY", label: tShip("status_out_for_delivery") },
    { value: "DELIVERED", label: tShip("status_delivered") },
    { value: "FAILED_ATTEMPT", label: tShip("status_failed_attempt") },
    { value: "RETURN_PENDING", label: tShip("status_return_pending") },
    { value: "NEEDS_REVIEW", label: tShip("status_needs_review") },
  ];

  const getTimeSince = (dateStr?: string) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return `${Math.floor(diff / 60000)}m`;
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <DashboardLayout locale={locale} title={t("title")}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
        </div>

        {(alertInfo.delayed > 0 || alertInfo.unassigned > 0 || alertInfo.stale > 0) && (
          <div className="space-y-2">
            {alertInfo.delayed > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                <AlertCircle className="size-4 shrink-0" />
                {alertInfo.delayed} {t("delayedShipments")}
              </div>
            )}
            {alertInfo.unassigned > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm text-yellow-700">
                <AlertTriangle className="size-4 shrink-0" />
                {alertInfo.unassigned} {t("unassignedShipments")}
              </div>
            )}
            {alertInfo.stale > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm text-orange-700">
                <Info className="size-4 shrink-0" />
                {alertInfo.stale} {t("staleShipments")}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder={tCommon("search")} value={search} onChange={(e) => { setSearch(e.target.value); }} className="ps-9 w-48" />
          </div>
          <Select value={partnerFilter} onChange={(e) => setPartnerFilter(e.target.value)} options={[{ value: "", label: tCommon("all") }, ...partners.map(p => ({ value: p._id, label: p.tradingNameAr }))]} className="w-40" />
          <Input placeholder={tShip("city")} value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="w-32" />
          <Select value={driverFilter} onChange={(e) => setDriverFilter(e.target.value)} options={[{ value: "", label: tCommon("all") }, ...drivers.map(d => ({ value: d._id, label: d.fullName }))]} className="w-40" />
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2">
            <span className="text-sm text-blue-700">{selected.size} selected</span>
            <Button variant="outline" size="sm" onClick={() => { setAssignDialogOpen(true); }}>
              <Truck className="size-3" />
              {t("bulkAssign")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setStatusDialogOpen(true); }}>
              <CheckSquare className="size-3" />
              {t("changeStatus")}
            </Button>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-8 w-24" />
                {Array.from({ length: 3 }).map((_, j) => <Skeleton key={j} className="h-24 w-full" />)}
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState icon={<AlertCircle className="size-8" />} title={tCommon("error")} action={{ label: tCommon("retry"), onClick: fetchData }} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {columns.map((col) => (
              <div key={col.status} className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
                  <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {col.count}
                  </span>
                </div>
                <div className="space-y-2">
                  {col.shipments.slice(0, 10).map((s) => (
                    <Card
                      key={s._id}
                      className="cursor-pointer hover:border-blue-300 transition-colors"
                      onClick={() => router.push(`/shipments/${s._id}`)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={selected.has(s._id)}
                                onChange={(e) => { e.stopPropagation(); toggleSelect(s._id); }}
                                className="size-3.5 rounded border-gray-300 shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <p className="truncate text-xs font-mono font-medium text-gray-900">{s.trackingNumber}</p>
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                              <User className="size-3 shrink-0" />
                              <span className="truncate">{s.recipientName}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <MapPin className="size-3 shrink-0" />
                              <span className="truncate">{s.city}</span>
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className="text-xs text-gray-400">{getTimeSince(s.lastStatusUpdate)}</span>
                            <StatusBadge status={s.status} formatLabel={fmtStatus} />
                          </div>
                        </div>
                        {col.status === "READY_FOR_DISPATCH" && !s.driver && (
                          <div className="mt-2 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Select
                              value=""
                              onChange={(e) => { if (e.target.value) handleQuickAssign(s._id, e.target.value); }}
                              options={drivers.map(d => ({ value: d._id, label: d.fullName }))}
                              placeholder={t("assignDriver")}
                              className="h-7 text-xs w-full"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {col.shipments.length > 10 && (
                    <p className="text-center text-xs text-gray-400">+{col.shipments.length - 10} more</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("bulkAssign")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{tShip("driver")}</Label>
              <Select value={bulkDriverId} onChange={(e) => setBulkDriverId(e.target.value)} options={drivers.map(d => ({ value: d._id, label: d.fullName }))} placeholder={tCommon("select")} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>{tCommon("cancel")}</Button>
            <Button onClick={handleBulkAssign} disabled={!bulkDriverId}>{tCommon("confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("changeStatus")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{tCommon("status")}</Label>
              <Select value={bulkNewStatus} onChange={(e) => setBulkNewStatus(e.target.value)} options={statusOptions} placeholder={tCommon("select")} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>{tCommon("cancel")}</Button>
            <Button onClick={handleBulkStatusChange} disabled={!bulkNewStatus}>{tCommon("confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
