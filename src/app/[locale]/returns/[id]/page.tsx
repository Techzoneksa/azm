"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Package, AlertCircle, Save } from "lucide-react";

interface ReturnDetail {
  _id: string;
  reason: string;
  status: string;
  returnRequestedAt: string;
  returnDueAt?: string;
  returnedAt?: string;
  returnedToPartnerBy?: string;
  receivedByPartnerName?: string;
  proofFile?: string;
  notes?: string;
  shipment?: {
    _id: string;
    trackingNumber: string;
    recipientName: string;
    city: string;
    status: string;
  };
}

export default function ReturnDetailPage() {
  const t = useTranslations("returns");
  const tShip = useTranslations("shipments");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split("/").pop() ?? "";

  const [returnEntry, setReturnEntry] = useState<ReturnDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    returnedToPartnerBy: "",
    receivedByPartnerName: "",
    notes: "",
  });

  const fetchReturn = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/returns/${id}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      const data = json.data ?? json;
      setReturnEntry(data);
      setUpdateForm({
        returnedToPartnerBy: data.returnedToPartnerBy ?? "",
        receivedByPartnerName: data.receivedByPartnerName ?? "",
        notes: data.notes ?? "",
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchReturn(); }, [fetchReturn]);

  const handleUpdate = async () => {
    if (!updateForm.returnedToPartnerBy.trim()) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/returns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateForm),
      });
      if (res.ok) {
        setUpdateDialogOpen(false);
        fetchReturn();
      }
    } catch {}
    finally { setUpdating(false); }
  };

  if (loading) {
    return (
      <DashboardLayout locale={locale} title={t("details")}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !returnEntry) {
    return (
      <DashboardLayout locale={locale} title={t("details")}>
        <EmptyState icon={<AlertCircle className="size-8" />} title={tCommon("error")} action={{ label: tCommon("retry"), onClick: fetchReturn }} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout locale={locale} title={t("details")}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/returns")}>
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("details")}</h1>
              <p className="text-sm text-gray-500">
                {returnEntry.shipment?.trackingNumber ?? "-"}
              </p>
            </div>
          </div>
          {returnEntry.status !== "RETURNED_TO_PARTNER" && returnEntry.status !== "CANCELLED" && (
            <Button onClick={() => setUpdateDialogOpen(true)}>
              <Save className="size-4" />
              {tCommon("edit")}
            </Button>
          )}
        </div>

        {returnEntry.shipment && (
          <Card className="cursor-pointer hover:border-blue-300" onClick={() => router.push(`/shipments/${returnEntry.shipment!._id}`)}>
            <CardHeader>
              <CardTitle>{tShip("trackingNumber")}: {returnEntry.shipment.trackingNumber}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div><dt className="text-xs font-medium text-gray-500">{tShip("recipientName")}</dt><dd className="mt-0.5 text-sm text-gray-900">{returnEntry.shipment.recipientName}</dd></div>
              <div><dt className="text-xs font-medium text-gray-500">{tShip("city")}</dt><dd className="mt-0.5 text-sm text-gray-900">{returnEntry.shipment.city}</dd></div>
              <div><dt className="text-xs font-medium text-gray-500">{tCommon("status")}</dt><dd className="mt-0.5"><StatusBadge status={returnEntry.shipment.status} /></dd></div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("details")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div><dt className="text-xs font-medium text-gray-500">{t("reason")}</dt><dd className="mt-0.5 text-sm text-gray-900">{t(`reason_${returnEntry.reason}`)}</dd></div>
              <div><dt className="text-xs font-medium text-gray-500">{t("status")}</dt><dd className="mt-0.5"><StatusBadge status={returnEntry.status} /></dd></div>
              <div><dt className="text-xs font-medium text-gray-500">{t("returnRequestedAt")}</dt><dd className="mt-0.5 text-sm text-gray-900">{new Date(returnEntry.returnRequestedAt).toLocaleString()}</dd></div>
              {returnEntry.returnDueAt && <div><dt className="text-xs font-medium text-gray-500">{t("returnDueAt")}</dt><dd className="mt-0.5 text-sm text-gray-900">{new Date(returnEntry.returnDueAt).toLocaleString()}</dd></div>}
              {returnEntry.returnedAt && <div><dt className="text-xs font-medium text-gray-500">{t("returnedAt")}</dt><dd className="mt-0.5 text-sm text-gray-900">{new Date(returnEntry.returnedAt).toLocaleString()}</dd></div>}
              {returnEntry.returnedToPartnerBy && <div><dt className="text-xs font-medium text-gray-500">{t("returnedToPartnerBy")}</dt><dd className="mt-0.5 text-sm text-gray-900">{returnEntry.returnedToPartnerBy}</dd></div>}
              {returnEntry.receivedByPartnerName && <div><dt className="text-xs font-medium text-gray-500">{t("receivedByPartnerName")}</dt><dd className="mt-0.5 text-sm text-gray-900">{returnEntry.receivedByPartnerName}</dd></div>}
              {returnEntry.proofFile && <div className="sm:col-span-2"><dt className="text-xs font-medium text-gray-500">{t("proofFile")}</dt><dd className="mt-0.5 text-sm text-gray-900"><a href={returnEntry.proofFile} target="_blank" rel="noreferrer" className="text-blue-600 underline">{returnEntry.proofFile}</a></dd></div>}
              {returnEntry.notes && <div className="sm:col-span-2"><dt className="text-xs font-medium text-gray-500">{tShip("internalNotes")}</dt><dd className="mt-0.5 text-sm text-gray-900">{returnEntry.notes}</dd></div>}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("details")}</DialogTitle>
            <DialogDescription>{tCommon("edit")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("returnedToPartnerBy")} *</Label>
              <Input value={updateForm.returnedToPartnerBy} onChange={(e) => setUpdateForm(p => ({ ...p, returnedToPartnerBy: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{t("receivedByPartnerName")}</Label>
              <Input value={updateForm.receivedByPartnerName} onChange={(e) => setUpdateForm(p => ({ ...p, receivedByPartnerName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{tShip("internalNotes")}</Label>
              <textarea value={updateForm.notes} onChange={(e) => setUpdateForm(p => ({ ...p, notes: e.target.value }))} rows={3} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>{tCommon("cancel")}</Button>
            <Button onClick={handleUpdate} loading={updating} disabled={!updateForm.returnedToPartnerBy.trim()}>{tCommon("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
