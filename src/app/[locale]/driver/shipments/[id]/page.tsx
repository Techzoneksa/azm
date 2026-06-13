"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter, Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  MapPin, Phone, Package, AlertTriangle, CheckCircle, RotateCcw,
  ChevronLeft, Clock, FileText, Navigation, User, Home, Info
} from "lucide-react";

interface ShipmentDetail {
  id: string;
  trackingNumber: string;
  partnerReference: string | null;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  locationUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  packageDescription: string | null;
  pieces: number;
  shipmentType: string;
  priority: string;
  deliveryWindow: string | null;
  customerNotes: string | null;
  partnerInstructions: string | null;
  status: string;
  lastStatusUpdate: string;
  driver: { id: string; fullName: string; phone: string } | null;
  deliveryAttempts: Array<{
    id: string;
    attemptNumber: number;
    reason: string | null;
    notes: string | null;
    attemptedAt: string;
    status: string;
  }>;
  proofOfDelivery: {
    id: string;
    receiverName: string | null;
    receiverPhone: string | null;
    deliveredAt: string;
    notes: string | null;
  } | null;
  returns: Array<{
    id: string;
    reason: string;
    status: string;
    notes: string | null;
    createdAt: string;
  }>;
}

export default function DriverShipmentDetailPage() {
  const t = useTranslations("driver");
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState("");

  const fetchShipment = useCallback(async () => {
    try {
      const res = await fetch(`/api/driver/shipments/${id}`);
      if (!res.ok) throw new Error("Shipment not found");
      const json = await res.json();
      setShipment(json.data);
      setLoading(false);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchShipment();
  }, [fetchShipment]);

  const updateStatus = async (newStatus: string, reason?: string) => {
    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch(`/api/driver/shipments/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStatus, reason }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to update status");
      }
      await fetchShipment();
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setActionLoading(false);
      setShowStatusDialog(false);
      setShowReturnDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton variant="rectangular" className="h-12 w-full" />
        <Skeleton variant="rectangular" className="h-48 w-full" />
        <Skeleton variant="rectangular" className="h-32 w-full" />
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <EmptyState
        icon={<AlertTriangle className="size-8" />}
        title={t("shipments.notFound") || "Not found"}
        description={error || "Shipment not found"}
        action={{ label: t("shipments.back") || "Back", onClick: () => router.push("/driver/shipments") }}
      />
    );
  }

  const statusActions: Record<string, React.ReactNode> = {
    ASSIGNED_TO_DRIVER: (
      <Button
        size="lg"
        className="w-full"
        onClick={() => {
          setPendingStatus("OUT_FOR_DELIVERY");
          setShowStatusDialog(true);
        }}
        loading={actionLoading}
      >
        <Navigation className="size-5" />
        {t("shipments.startDelivery") || "Start Delivery"}
      </Button>
    ),
    OUT_FOR_DELIVERY: (
      <div className="space-y-2">
        <div className="flex gap-2">
          <a href={`tel:${shipment.recipientPhone}`} className="flex-1">
            <Button variant="outline" size="lg" className="w-full">
              <Phone className="size-5" />
              {t("shipments.callCustomer") || "Call"}
            </Button>
          </a>
          {shipment.locationUrl && (
            <a href={shipment.locationUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="outline" size="lg" className="w-full">
                <MapPin className="size-5" />
                {t("shipments.openLocation") || "Location"}
              </Button>
            </a>
          )}
        </div>
        <Link href={`/driver/shipments/${id}/attempt`}>
          <Button variant="outline" size="lg" className="w-full">
            <FileText className="size-5" />
            {t("shipments.recordAttempt") || "Record Attempt"}
          </Button>
        </Link>
        <Link href={`/driver/shipments/${id}/pod`}>
          <Button size="lg" className="w-full">
            <CheckCircle className="size-5" />
            {t("shipments.delivered") || "Delivered"}
          </Button>
        </Link>
        <Button
          variant="destructive"
          size="lg"
          className="w-full"
          onClick={() => setShowReturnDialog(true)}
        >
          <RotateCcw className="size-5" />
          {t("shipments.return") || "Return"}
        </Button>
      </div>
    ),
    FAILED_ATTEMPT: (
      <div className="space-y-2">
        <Link href={`/driver/shipments/${id}/attempt`}>
          <Button variant="outline" size="lg" className="w-full">
            <FileText className="size-5" />
            {t("shipments.recordAttempt") || "Record Attempt"}
          </Button>
        </Link>
        <Link href={`/driver/shipments/${id}/pod`}>
          <Button size="lg" className="w-full">
            <CheckCircle className="size-5" />
            {t("shipments.delivered") || "Delivered"}
          </Button>
        </Link>
      </div>
    ),
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => router.push("/driver/shipments")}
        className="flex items-center gap-1 text-sm text-brand-text-gray"
      >
        <ChevronLeft className="size-4" />
        {t("shipments.back") || "Back"}
      </button>

      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-brand-dark-blue">
                {shipment.trackingNumber}
              </h1>
              {shipment.partnerReference && (
                <p className="text-xs text-brand-text-gray">
                  {t("shipments.ref") || "Ref"}: {shipment.partnerReference}
                </p>
              )}
            </div>
            <StatusBadge status={shipment.status} />
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="size-3" />
            <span>{t("shipments.lastUpdate") || "Last update"}: {new Date(shipment.lastStatusUpdate).toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-brand-dark-blue">
            <User className="me-2 inline size-4" />
            {t("shipments.recipient") || "Recipient"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="font-medium text-gray-900">{shipment.recipientName}</p>
          <a href={`tel:${shipment.recipientPhone}`} className="flex items-center gap-1 text-brand-orange">
            <Phone className="size-4" />
            {shipment.recipientPhone}
          </a>
          {shipment.address && (
            <p className="text-brand-text-gray">{shipment.address}</p>
          )}
          <p className="text-brand-text-gray">
            {[shipment.district, shipment.city].filter(Boolean).join(", ")}
          </p>
          {shipment.locationUrl && (
            <a
              href={shipment.locationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm text-brand-orange"
            >
              <MapPin className="size-4" />
              {t("shipments.openInMap") || "Open in Map"}
            </a>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-brand-dark-blue">
            <Package className="me-2 inline size-4" />
            {t("shipments.packageInfo") || "Package"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {shipment.packageDescription && (
            <p className="text-gray-900">{shipment.packageDescription}</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-brand-text-gray">{t("shipments.pieces") || "Pieces"}:</span>
              <span className="ms-1 font-medium">{shipment.pieces}</span>
            </div>
            <div>
              <span className="text-brand-text-gray">{t("shipments.type") || "Type"}:</span>
              <span className="ms-1 font-medium">{shipment.shipmentType}</span>
            </div>
          </div>
          {shipment.priority !== "NORMAL" && (
            <div className="flex items-center gap-1">
              <span className="text-brand-text-gray">{t("shipments.priority") || "Priority"}:</span>
              <Badge variant="warning">{shipment.priority}</Badge>
            </div>
          )}
          {shipment.deliveryWindow && (
            <div className="flex items-center gap-1">
              <Clock className="size-4 text-brand-text-gray" />
              <span className="text-brand-text-gray">
                {t("shipments.deliveryWindow") || "Delivery window"}: {shipment.deliveryWindow}
              </span>
            </div>
          )}
          {shipment.customerNotes && (
            <div className="mt-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              <p className="font-medium">{t("shipments.customerNotes") || "Customer notes"}:</p>
              <p className="mt-1">{shipment.customerNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {actionError && (
        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600">
          {actionError}
        </div>
      )}

      {statusActions[shipment.status] && (
        <div className="space-y-2">
          {statusActions[shipment.status]}
        </div>
      )}

      {shipment.proofOfDelivery && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-sm text-green-800">
              <CheckCircle className="me-2 inline size-4" />
              {t("shipments.pod") || "Proof of Delivery"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>{t("shipments.receiver") || "Receiver"}: {shipment.proofOfDelivery.receiverName || "N/A"}</p>
            <p>{t("shipments.deliveredAt") || "Delivered at"}: {new Date(shipment.proofOfDelivery.deliveredAt).toLocaleString()}</p>
          </CardContent>
        </Card>
      )}

      {shipment.returns.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-sm text-red-800">
              <RotateCcw className="me-2 inline size-4" />
              {t("shipments.returnInfo") || "Return Info"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {shipment.returns.map((r) => (
              <div key={r.id}>
                <p>{t("shipments.reason") || "Reason"}: {r.reason}</p>
                <p>{t("shipments.status") || "Status"}: {r.status}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {shipment.deliveryAttempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-brand-dark-blue">
              <FileText className="me-2 inline size-4" />
              {t("shipments.attempts") || "Delivery Attempts"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {shipment.deliveryAttempts.map((a) => (
              <div key={a.id} className="rounded-lg bg-gray-50 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t("shipments.attempt") || "Attempt"} #{a.attemptNumber}</span>
                  <StatusBadge status={a.status} />
                </div>
                {a.reason && <p className="mt-1 text-brand-text-gray">{a.reason}</p>}
                <p className="mt-1 text-gray-400">{new Date(a.attemptedAt).toLocaleString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingStatus === "OUT_FOR_DELIVERY"
                ? (t("shipments.confirmStartDelivery") || "Start Delivery")
                : (t("shipments.confirmStatusChange") || "Change Status")}
            </DialogTitle>
            <DialogDescription>
              {t("shipments.statusConfirmDesc") || "Are you sure you want to update the status?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              {t("shipments.cancel") || "Cancel"}
            </Button>
            <Button onClick={() => updateStatus(pendingStatus)}>
              {t("shipments.confirm") || "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("shipments.confirmReturn") || "Mark as Return"}</DialogTitle>
            <DialogDescription>
              {t("shipments.returnDesc") || "Mark this shipment for return?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReturnDialog(false)}>
              {t("shipments.cancel") || "Cancel"}
            </Button>
            <Button variant="destructive" onClick={() => updateStatus("RETURN_PENDING", "Marked for return by driver")}>
              {t("shipments.confirmReturn") || "Confirm Return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
