"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft, Pencil, Package, AlertCircle, Truck, Clock, MapPin,
  Phone, Mail, User, FileText, Activity, Link, Shield, Map, Camera, Signature, CheckCircle
} from "lucide-react";

interface Shipment {
  _id: string;
  trackingNumber: string;
  partnerReference?: string;
  orderNumber?: string;
  partner?: { _id: string; tradingNameAr: string };
  contract?: { _id: string; name: string };
  pickupPoint?: { _id: string; name: string };
  coverageArea?: { _id: string; name: string };
  driver?: { _id: string; fullName: string };
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string;
  city: string;
  district?: string;
  address?: string;
  nationalAddress?: string;
  shortAddress?: string;
  buildingNumber?: string;
  street?: string;
  postalCode?: string;
  subNumber?: string;
  locationUrl?: string;
  latitude?: string;
  longitude?: string;
  packageDescription?: string;
  pieces: number;
  weight?: number;
  shipmentType: string;
  priority: string;
  deliveryDate?: string;
  deliveryWindow?: string;
  customerNotes?: string;
  partnerInstructions?: string;
  internalNotes?: string;
  status: string;
  entrySource: string;
  validationStatus: string;
  lastStatusUpdate?: string;
  createdAt: string;
}

interface StatusHistoryEntry {
  _id: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  changedAt: string;
  reason?: string;
}

interface AssignmentEntry {
  _id: string;
  driver?: { _id: string; fullName: string };
  assignedAt: string;
  assignedBy: string;
  status: string;
}

interface DeliveryAttempt {
  _id: string;
  attemptNumber: number;
  status: string;
  reason?: string;
  notes?: string;
  attemptedAt: string;
}

interface POD {
  _id: string;
  deliveredAt: string;
  deliveredBy: string;
  receiverName: string;
  receiverPhone?: string;
  otpCode?: string;
  notes?: string;
}

interface ReturnEntry {
  _id: string;
  reason: string;
  status: string;
  returnRequestedAt: string;
  returnDueAt?: string;
  returnedAt?: string;
  notes?: string;
}

interface AuditEntry {
  _id: string;
  action: string;
  performedBy: string;
  performedAt: string;
  details?: string;
}

export default function ShipmentDetailPage() {
  const t = useTranslations("shipments");
  const tPod = useTranslations("pod");
  const tAttempts = useTranslations("deliveryAttempts");
  const tReturns = useTranslations("returns");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split("/").slice(-2, -1)[0] ?? pathname.split("/").pop() ?? "";

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([]);
  const [assignments, setAssignments] = useState<AssignmentEntry[]>([]);
  const [attempts, setAttempts] = useState<DeliveryAttempt[]>([]);
  const [pod, setPod] = useState<POD | null>(null);
  const [returnEntry, setReturnEntry] = useState<ReturnEntry | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState("overview");
  const [drivers, setDrivers] = useState<{ _id: string; fullName: string }[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [podDialogOpen, setPodDialogOpen] = useState(false);
  const [podForm, setPodForm] = useState({ receiverName: "", receiverPhone: "", notes: "" });
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnForm, setReturnForm] = useState({ returnedBy: "", receivedByName: "", notes: "" });

  const tabs = [
    { key: "overview", label: t("overview") },
    { key: "statusTimeline", label: t("statusTimeline") },
    { key: "assignment", label: t("assignment") },
    { key: "attempts", label: t("attempts") },
    { key: "proofOfDelivery", label: t("proofOfDelivery") },
    { key: "return", label: t("return") },
    { key: "partnerData", label: t("partnerData") },
    { key: "audit", label: t("audit") },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [shipmentRes, historyRes, assignmentsRes, attemptsRes, podRes, returnRes, auditRes] = await Promise.all([
        fetch(`/api/shipments/${id}`),
        fetch(`/api/shipments/${id}/status-history`).catch(() => null),
        fetch(`/api/shipments/${id}/assignments`).catch(() => null),
        fetch(`/api/shipments/${id}/attempts`).catch(() => null),
        fetch(`/api/shipments/${id}/pod`).catch(() => null),
        fetch(`/api/shipments/${id}/return`).catch(() => null),
        fetch(`/api/shipments/${id}/audit`).catch(() => null),
      ]);
      if (!shipmentRes.ok) throw new Error("Failed");
      const sData = await shipmentRes.json();
      setShipment(sData.shipment ?? sData.data ?? sData);
      if (historyRes?.ok) { const d = await historyRes.json(); setStatusHistory(d.data ?? []); }
      if (assignmentsRes?.ok) { const d = await assignmentsRes.json(); setAssignments(d.data ?? []); }
      if (attemptsRes?.ok) { const d = await attemptsRes.json(); setAttempts(d.data ?? []); }
      if (podRes?.ok) { const d = await podRes.json(); setPod(d.data ?? d); }
      if (returnRes?.ok) { const d = await returnRes.json(); setReturnEntry(d.data ?? d); }
      if (auditRes?.ok) { const d = await auditRes.json(); setAuditLog(d.data ?? []); }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchDrivers = useCallback(async () => {
    try {
      const res = await fetch("/api/drivers?limit=200&status=active");
      if (res.ok) {
        const json = await res.json();
        setDrivers(json.data ?? []);
      }
    } catch {}
  }, []);

  const handleStatusChange = async () => {
    if (!newStatus) return;
    try {
      const res = await fetch(`/api/shipments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStatusDialogOpen(false);
        setNewStatus("");
        fetchData();
      }
    } catch {}
  };

  const handleAssign = async () => {
    if (!selectedDriverId) return;
    try {
      const res = await fetch(`/api/shipments/${id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: selectedDriverId }),
      });
      if (res.ok) {
        setAssignDialogOpen(false);
        setSelectedDriverId("");
        fetchData();
      }
    } catch {}
  };

  const handleCreatePod = async () => {
    try {
      const res = await fetch(`/api/shipments/${id}/pod`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(podForm),
      });
      if (res.ok) {
        setPodDialogOpen(false);
        setPodForm({ receiverName: "", receiverPhone: "", notes: "" });
        fetchData();
      }
    } catch {}
  };

  const handleCreateReturn = async () => {
    try {
      const res = await fetch(`/api/shipments/${id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(returnForm),
      });
      if (res.ok) {
        setReturnDialogOpen(false);
        setReturnForm({ returnedBy: "", receivedByName: "", notes: "" });
        fetchData();
      }
    } catch {}
  };

  const statusOptions = [
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

  if (loading) {
    return (
      <DashboardLayout locale={locale} title={t("details")}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !shipment) {
    return (
      <DashboardLayout locale={locale} title={t("details")}>
        <EmptyState
          icon={<AlertCircle className="size-8" />}
          title={tCommon("error")}
          action={{ label: tCommon("retry"), onClick: fetchData }}
        />
      </DashboardLayout>
    );
  }

  const overviewFields = [
    { label: t("trackingNumber"), value: shipment.trackingNumber },
    { label: t("partnerReference"), value: shipment.partnerReference },
    { label: t("orderNumber"), value: shipment.orderNumber },
    { label: t("recipientName"), value: shipment.recipientName },
    { label: t("recipientPhone"), value: shipment.recipientPhone },
    { label: t("recipientEmail"), value: shipment.recipientEmail },
    { label: t("city"), value: shipment.city },
    { label: t("district"), value: shipment.district },
    { label: t("address"), value: shipment.address },
    { label: t("nationalAddress"), value: shipment.nationalAddress },
    { label: t("shortAddress"), value: shipment.shortAddress },
    { label: t("buildingNumber"), value: shipment.buildingNumber },
    { label: t("street"), value: shipment.street },
    { label: t("postalCode"), value: shipment.postalCode },
    { label: t("subNumber"), value: shipment.subNumber },
    { label: t("locationUrl"), value: shipment.locationUrl },
    { label: t("latitude"), value: shipment.latitude },
    { label: t("longitude"), value: shipment.longitude },
    { label: t("packageDescription"), value: shipment.packageDescription },
    { label: t("pieces"), value: shipment.pieces },
    { label: t("weight"), value: shipment.weight ? `${shipment.weight} kg` : undefined },
    { label: t("shipmentType"), value: t(`type_${shipment.shipmentType?.toLowerCase()}`) },
    { label: t("priority"), value: t(`priority_${shipment.priority?.toLowerCase()}`) },
    { label: t("deliveryDate"), value: shipment.deliveryDate ? new Date(shipment.deliveryDate).toLocaleDateString() : undefined },
    { label: t("deliveryWindow"), value: shipment.deliveryWindow },
    { label: t("entrySource"), value: t(`entry_${shipment.entrySource?.toLowerCase()}`) },
    { label: t("validationStatus"), value: t(`validation_${shipment.validationStatus?.toLowerCase()}`) },
    { label: t("lastStatusUpdate"), value: shipment.lastStatusUpdate ? new Date(shipment.lastStatusUpdate).toLocaleString() : "-" },
    { label: tCommon("status"), value: <StatusBadge status={shipment.status} /> },
  ];

  return (
    <DashboardLayout locale={locale} title={t("details")}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/shipments")}>
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("details")}</h1>
              <p className="text-sm text-gray-500">{t("trackingNumber")}: {shipment.trackingNumber}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { fetchDrivers(); setAssignDialogOpen(true); }}>
              <Truck className="size-4" />
              {t("assignment")}
            </Button>
            <Button variant="outline" onClick={() => { setNewStatus(""); setStatusDialogOpen(true); }}>
              <Activity className="size-4" />
              {tCommon("status")}
            </Button>
            <Button onClick={() => router.push(`/shipments/${id}/edit`)}>
              <Pencil className="size-4" />
              {tCommon("edit")}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{shipment.trackingNumber}</CardTitle>
                <CardDescription>{shipment.recipientName} - {shipment.city}</CardDescription>
              </div>
              <StatusBadge status={shipment.status} />
            </div>
          </CardHeader>
        </Card>

        <div className="border-b border-gray-200">
          <nav className="flex flex-wrap gap-1">
            {tabs.map((tb) => (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  tab === tb.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tb.label}
              </button>
            ))}
          </nav>
        </div>

        {tab === "overview" && (
          <Card>
            <CardHeader>
              <CardTitle>{t("overview")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {overviewFields.map((f) =>
                f.value ? (
                  <div key={f.label}>
                    <dt className="text-xs font-medium text-gray-500">{f.label}</dt>
                    <dd className="mt-0.5 text-sm font-medium text-gray-900">{f.value}</dd>
                  </div>
                ) : null
              )}
            </CardContent>
          </Card>
        )}

        {tab === "statusTimeline" && (
          <Card>
            <CardHeader>
              <CardTitle>{t("statusTimeline")}</CardTitle>
            </CardHeader>
            <CardContent>
              {statusHistory.length === 0 ? (
                <EmptyState icon={<Clock className="size-8" />} title={tCommon("noData")} />
              ) : (
                <div className="space-y-4">
                  {statusHistory.map((entry) => (
                    <div key={entry._id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="size-3 rounded-full bg-blue-500" />
                        <div className="flex-1 w-px bg-gray-200" />
                      </div>
                      <div className="pb-4">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={entry.oldStatus} />
                          <span className="text-sm text-gray-500">&rarr;</span>
                          <StatusBadge status={entry.newStatus} />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {entry.changedBy} - {new Date(entry.changedAt).toLocaleString()}
                        </p>
                        {entry.reason && (
                          <p className="mt-1 text-xs text-gray-600">{entry.reason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {tab === "assignment" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("assignment")}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => { fetchDrivers(); setAssignDialogOpen(true); }}>
                  <Truck className="size-4" />
                  {t("assignment")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {shipment.driver && (
                <div className="mb-4 flex items-center gap-3 rounded-lg border border-gray-200 p-4">
                  <User className="size-10 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{shipment.driver.fullName}</p>
                    <p className="text-sm text-gray-500">{t("driver")}</p>
                  </div>
                </div>
              )}
              {assignments.length === 0 ? (
                <EmptyState icon={<Truck className="size-8" />} title={tCommon("noData")} />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("driver")}</TableHead>
                        <TableHead>Assigned At</TableHead>
                        <TableHead>Assigned By</TableHead>
                        <TableHead>{tCommon("status")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((a) => (
                        <TableRow key={a._id}>
                          <TableCell>{a.driver?.fullName ?? "-"}</TableCell>
                          <TableCell>{new Date(a.assignedAt).toLocaleString()}</TableCell>
                          <TableCell>{a.assignedBy}</TableCell>
                          <TableCell><StatusBadge status={a.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {tab === "attempts" && (
          <Card>
            <CardHeader>
              <CardTitle>{t("attempts")}</CardTitle>
            </CardHeader>
            <CardContent>
              {attempts.length === 0 ? (
                <EmptyState icon={<Activity className="size-8" />} title={tCommon("noData")} />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{tAttempts("attemptNumber")}</TableHead>
                        <TableHead>{tAttempts("status")}</TableHead>
                        <TableHead>{tAttempts("reason")}</TableHead>
                        <TableHead>{tAttempts("notes")}</TableHead>
                        <TableHead>{tAttempts("attemptedAt")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attempts.map((a) => (
                        <TableRow key={a._id}>
                          <TableCell>{a.attemptNumber}</TableCell>
                          <TableCell><StatusBadge status={a.status} /></TableCell>
                          <TableCell>{a.reason ?? "-"}</TableCell>
                          <TableCell>{a.notes ?? "-"}</TableCell>
                          <TableCell>{new Date(a.attemptedAt).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {tab === "proofOfDelivery" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{tPod("title")}</CardTitle>
                {!pod && (
                  <Button variant="outline" size="sm" onClick={() => setPodDialogOpen(true)}>
                    <Camera className="size-4" />
                    {tPod("createPod")}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!pod ? (
                <EmptyState icon={<Signature className="size-8" />} title={tPod("noPod")} action={{ label: tPod("createPod"), onClick: () => setPodDialogOpen(true) }} />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><dt className="text-xs font-medium text-gray-500">{tPod("deliveredAt")}</dt><dd className="mt-0.5 text-sm text-gray-900">{new Date(pod.deliveredAt).toLocaleString()}</dd></div>
                  <div><dt className="text-xs font-medium text-gray-500">{tPod("deliveredBy")}</dt><dd className="mt-0.5 text-sm text-gray-900">{pod.deliveredBy}</dd></div>
                  <div><dt className="text-xs font-medium text-gray-500">{tPod("receiverName")}</dt><dd className="mt-0.5 text-sm text-gray-900">{pod.receiverName}</dd></div>
                  <div><dt className="text-xs font-medium text-gray-500">{tPod("receiverPhone")}</dt><dd className="mt-0.5 text-sm text-gray-900">{pod.receiverPhone ?? "-"}</dd></div>
                  <div><dt className="text-xs font-medium text-gray-500">{tPod("otpCode")}</dt><dd className="mt-0.5 text-sm text-gray-900">{pod.otpCode ?? "-"}</dd></div>
                  <div><dt className="text-xs font-medium text-gray-500">{tPod("notes")}</dt><dd className="mt-0.5 text-sm text-gray-900">{pod.notes ?? "-"}</dd></div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {tab === "return" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{tReturns("title")}</CardTitle>
                {!returnEntry && (
                  <Button variant="outline" size="sm" onClick={() => setReturnDialogOpen(true)}>
                    <Package className="size-4" />
                    {tReturns("details")}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!returnEntry ? (
                <EmptyState icon={<Package className="size-8" />} title={tCommon("noData")} action={{ label: tReturns("details"), onClick: () => setReturnDialogOpen(true) }} />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><dt className="text-xs font-medium text-gray-500">{tReturns("reason")}</dt><dd className="mt-0.5 text-sm text-gray-900">{tReturns(`reason_${returnEntry.reason}`)}</dd></div>
                  <div><dt className="text-xs font-medium text-gray-500">{tReturns("status")}</dt><dd className="mt-0.5 text-sm text-gray-900"><StatusBadge status={returnEntry.status} /></dd></div>
                  <div><dt className="text-xs font-medium text-gray-500">{tReturns("returnRequestedAt")}</dt><dd className="mt-0.5 text-sm text-gray-900">{new Date(returnEntry.returnRequestedAt).toLocaleString()}</dd></div>
                  {returnEntry.returnDueAt && <div><dt className="text-xs font-medium text-gray-500">{tReturns("returnDueAt")}</dt><dd className="mt-0.5 text-sm text-gray-900">{new Date(returnEntry.returnDueAt).toLocaleString()}</dd></div>}
                  {returnEntry.returnedAt && <div><dt className="text-xs font-medium text-gray-500">{tReturns("returnedAt")}</dt><dd className="mt-0.5 text-sm text-gray-900">{new Date(returnEntry.returnedAt).toLocaleString()}</dd></div>}
                  <div className="sm:col-span-2"><dt className="text-xs font-medium text-gray-500">{tReturns("notes")}</dt><dd className="mt-0.5 text-sm text-gray-900">{returnEntry.notes ?? "-"}</dd></div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {tab === "partnerData" && (
          <Card>
            <CardHeader>
              <CardTitle>{t("partnerData")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div><dt className="text-xs font-medium text-gray-500">{t("partner")}</dt><dd className="mt-0.5 text-sm text-gray-900">{shipment.partner?.tradingNameAr ?? "-"}</dd></div>
              <div><dt className="text-xs font-medium text-gray-500">{t("contract")}</dt><dd className="mt-0.5 text-sm text-gray-900">{shipment.contract?.name ?? "-"}</dd></div>
              <div><dt className="text-xs font-medium text-gray-500">{t("pickupPoint")}</dt><dd className="mt-0.5 text-sm text-gray-900">{shipment.pickupPoint?.name ?? "-"}</dd></div>
              <div><dt className="text-xs font-medium text-gray-500">{t("coverageArea")}</dt><dd className="mt-0.5 text-sm text-gray-900">{shipment.coverageArea?.name ?? "-"}</dd></div>
            </CardContent>
          </Card>
        )}

        {tab === "audit" && (
          <Card>
            <CardHeader>
              <CardTitle>{t("audit")}</CardTitle>
            </CardHeader>
            <CardContent>
              {auditLog.length === 0 ? (
                <EmptyState icon={<Activity className="size-8" />} title={tCommon("noData")} />
              ) : (
                <div className="space-y-3">
                  {auditLog.map((entry) => (
                    <div key={entry._id} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{entry.action}</span>
                        <span className="text-xs text-gray-500">{new Date(entry.performedAt).toLocaleString()}</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{entry.performedBy}</p>
                      {entry.details && <p className="mt-1 text-xs text-gray-600">{entry.details}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tCommon("status")}</DialogTitle>
            <DialogDescription>{tCommon("confirm")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{tCommon("status")}</Label>
              <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} options={statusOptions.filter(o => o.value)} placeholder={tCommon("select")} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>{tCommon("cancel")}</Button>
            <Button onClick={handleStatusChange} disabled={!newStatus}>{tCommon("confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("assignment")}</DialogTitle>
            <DialogDescription>{t("bulkAssign")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("driver")}</Label>
              <Select value={selectedDriverId} onChange={(e) => setSelectedDriverId(e.target.value)} options={drivers.map(d => ({ value: d._id, label: d.fullName }))} placeholder={tCommon("select")} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>{tCommon("cancel")}</Button>
            <Button onClick={handleAssign} disabled={!selectedDriverId}>{tCommon("confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={podDialogOpen} onOpenChange={setPodDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tPod("createPod")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{tPod("receiverName")} *</Label>
              <Input value={podForm.receiverName} onChange={(e) => setPodForm(p => ({ ...p, receiverName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{tPod("receiverPhone")}</Label>
              <Input value={podForm.receiverPhone} onChange={(e) => setPodForm(p => ({ ...p, receiverPhone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{tPod("notes")}</Label>
              <textarea value={podForm.notes} onChange={(e) => setPodForm(p => ({ ...p, notes: e.target.value }))} rows={3} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPodDialogOpen(false)}>{tCommon("cancel")}</Button>
            <Button onClick={handleCreatePod} disabled={!podForm.receiverName.trim()}>{tCommon("create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tReturns("details")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{tReturns("returnedToPartnerBy")} *</Label>
              <Input value={returnForm.returnedBy} onChange={(e) => setReturnForm(p => ({ ...p, returnedBy: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{tReturns("receivedByPartnerName")}</Label>
              <Input value={returnForm.receivedByName} onChange={(e) => setReturnForm(p => ({ ...p, receivedByName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{tReturns("notes")}</Label>
              <textarea value={returnForm.notes} onChange={(e) => setReturnForm(p => ({ ...p, notes: e.target.value }))} rows={3} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>{tCommon("cancel")}</Button>
            <Button onClick={handleCreateReturn} disabled={!returnForm.returnedBy.trim()}>{tCommon("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
