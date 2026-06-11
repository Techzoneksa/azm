"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";

interface FormData {
  partnerReference: string;
  orderNumber: string;
  partnerId: string;
  contractId: string;
  pickupPointId: string;
  coverageAreaId: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  city: string;
  district: string;
  address: string;
  nationalAddress: string;
  shortAddress: string;
  buildingNumber: string;
  street: string;
  postalCode: string;
  subNumber: string;
  locationUrl: string;
  latitude: string;
  longitude: string;
  packageDescription: string;
  pieces: string;
  weight: string;
  shipmentType: string;
  priority: string;
  deliveryDate: string;
  deliveryWindow: string;
  customerNotes: string;
  partnerInstructions: string;
  internalNotes: string;
}

export default function EditShipmentPage() {
  const t = useTranslations("shipments");
  const tCommon = useTranslations("common");
  const tVal = useTranslations("validation");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split("/").slice(-3, -2)[0] ?? pathname.split("/").slice(-2, -1)[0] ?? "";

  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [partners, setPartners] = useState<{ _id: string; tradingNameAr: string }[]>([]);
  const [contracts, setContracts] = useState<{ _id: string; name: string }[]>([]);
  const [pickupPoints, setPickupPoints] = useState<{ _id: string; name: string }[]>([]);
  const [coverageAreas, setCoverageAreas] = useState<{ _id: string; name: string }[]>([]);

  const fetchShipment = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [res, partnersRes, coverageRes] = await Promise.all([
        fetch(`/api/shipments/${id}`),
        fetch("/api/partners?limit=500&status=active"),
        fetch("/api/coverage-areas?limit=500"),
      ]);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      const s = json.shipment ?? json.data ?? json;
      setForm({
        partnerReference: s.partnerReference ?? "",
        orderNumber: s.orderNumber ?? "",
        partnerId: s.partner?._id ?? s.partnerId ?? "",
        contractId: s.contract?._id ?? s.contractId ?? "",
        pickupPointId: s.pickupPoint?._id ?? s.pickupPointId ?? "",
        coverageAreaId: s.coverageArea?._id ?? s.coverageAreaId ?? "",
        recipientName: s.recipientName ?? "",
        recipientPhone: s.recipientPhone ?? "",
        recipientEmail: s.recipientEmail ?? "",
        city: s.city ?? "",
        district: s.district ?? "",
        address: s.address ?? "",
        nationalAddress: s.nationalAddress ?? "",
        shortAddress: s.shortAddress ?? "",
        buildingNumber: s.buildingNumber ?? "",
        street: s.street ?? "",
        postalCode: s.postalCode ?? "",
        subNumber: s.subNumber ?? "",
        locationUrl: s.locationUrl ?? "",
        latitude: s.latitude ?? "",
        longitude: s.longitude ?? "",
        packageDescription: s.packageDescription ?? "",
        pieces: String(s.pieces ?? 1),
        weight: s.weight ? String(s.weight) : "",
        shipmentType: s.shipmentType ?? "STANDARD",
        priority: s.priority ?? "NORMAL",
        deliveryDate: s.deliveryDate ? s.deliveryDate.split("T")[0] : "",
        deliveryWindow: s.deliveryWindow ?? "",
        customerNotes: s.customerNotes ?? "",
        partnerInstructions: s.partnerInstructions ?? "",
        internalNotes: s.internalNotes ?? "",
      });
      if (partnersRes.ok) { const pj = await partnersRes.json(); setPartners(pj.data ?? []); }
      if (coverageRes.ok) { const cj = await coverageRes.json(); setCoverageAreas(cj.data ?? []); }
      if (s.partner?._id || s.partnerId) {
        const pid = s.partner?._id ?? s.partnerId;
        const [cRes, pRes] = await Promise.all([
          fetch(`/api/contracts?partnerId=${pid}&limit=200`).catch(() => null),
          fetch(`/api/pickup-points?partnerId=${pid}&limit=200`).catch(() => null),
        ]);
        if (cRes?.ok) { const cj = await cRes.json(); setContracts(cj.data ?? []); }
        if (pRes?.ok) { const pj = await pRes.json(); setPickupPoints(pj.data ?? []); }
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchShipment(); }, [fetchShipment]);

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    if (!form) return;
    setForm(prev => prev ? { ...prev, [field]: value } : prev);
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    if (field === "partnerId") {
      setForm(prev => prev ? { ...prev, partnerId: value, contractId: "", pickupPointId: "" } : prev);
      fetch(`/api/contracts?partnerId=${value}&limit=200`).then(r => r.ok && r.json()).then(j => { if (j) setContracts(j.data ?? []); }).catch(() => {});
      fetch(`/api/pickup-points?partnerId=${value}&limit=200`).then(r => r.ok && r.json()).then(j => { if (j) setPickupPoints(j.data ?? []); }).catch(() => {});
    }
  };

  const validate = () => {
    if (!form) return false;
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.recipientName.trim()) newErrors.recipientName = tVal("required");
    if (!form.recipientPhone.trim()) newErrors.recipientPhone = tVal("required");
    if (!form.city.trim()) newErrors.city = tVal("required");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !validate()) return;
    setSubmitting(true);
    try {
      const body = { ...form, pieces: parseInt(form.pieces) || 1, weight: form.weight ? parseFloat(form.weight) : undefined };
      const res = await fetch(`/api/shipments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      router.push(`/shipments/${id}`);
    } catch {
      setSubmitting(false);
    }
  };

  const shipmentTypeOptions = [
    { value: "STANDARD", label: t("type_standard") },
    { value: "EXPRESS", label: t("type_express") },
    { value: "SAME_DAY", label: t("type_same_day") },
    { value: "NEXT_DAY", label: t("type_next_day") },
    { value: "SCHEDULED", label: t("type_scheduled") },
    { value: "RETURN_PICKUP", label: t("type_return_pickup") },
    { value: "DOCUMENT", label: t("type_document") },
    { value: "OTHER", label: t("type_other") },
  ];

  const priorityOptions = [
    { value: "LOW", label: t("priority_low") },
    { value: "NORMAL", label: t("priority_normal") },
    { value: "HIGH", label: t("priority_high") },
    { value: "URGENT", label: t("priority_urgent") },
  ];

  if (loading) {
    return (
      <DashboardLayout locale={locale} title={t("edit")}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !form) {
    return (
      <DashboardLayout locale={locale} title={t("edit")}>
        <EmptyState icon={<AlertCircle className="size-8" />} title={tCommon("error")} action={{ label: tCommon("retry"), onClick: fetchShipment }} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout locale={locale} title={t("edit")}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/shipments/${id}`)}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("edit")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{t("overview")}</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>{t("partnerReference")}</Label><Input value={form.partnerReference} onChange={handleChange("partnerReference")} /></div>
              <div className="space-y-2"><Label>{t("orderNumber")}</Label><Input value={form.orderNumber} onChange={handleChange("orderNumber")} /></div>
              <div className="space-y-2"><Label>{t("partner")}</Label><Select value={form.partnerId} onChange={handleChange("partnerId")} options={partners.map(p => ({ value: p._id, label: p.tradingNameAr }))} placeholder={tCommon("select")} /></div>
              <div className="space-y-2"><Label>{t("contract")}</Label><Select value={form.contractId} onChange={handleChange("contractId")} options={contracts.map(c => ({ value: c._id, label: c.name }))} placeholder={tCommon("select")} /></div>
              <div className="space-y-2"><Label>{t("pickupPoint")}</Label><Select value={form.pickupPointId} onChange={handleChange("pickupPointId")} options={pickupPoints.map(p => ({ value: p._id, label: p.name }))} placeholder={tCommon("select")} /></div>
              <div className="space-y-2"><Label>{t("coverageArea")}</Label><Select value={form.coverageAreaId} onChange={handleChange("coverageAreaId")} options={coverageAreas.map(c => ({ value: c._id, label: c.name }))} placeholder={tCommon("select")} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("recipientName")}</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>{t("recipientName")} *</Label><Input value={form.recipientName} onChange={handleChange("recipientName")} error={errors.recipientName} /></div>
              <div className="space-y-2"><Label>{t("recipientPhone")} *</Label><Input value={form.recipientPhone} onChange={handleChange("recipientPhone")} error={errors.recipientPhone} /></div>
              <div className="space-y-2"><Label>{t("recipientEmail")}</Label><Input type="email" value={form.recipientEmail} onChange={handleChange("recipientEmail")} /></div>
              <div className="space-y-2"><Label>{t("city")} *</Label><Input value={form.city} onChange={handleChange("city")} error={errors.city} /></div>
              <div className="space-y-2"><Label>{t("district")}</Label><Input value={form.district} onChange={handleChange("district")} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("address")}</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2"><Label>{t("address")}</Label><Input value={form.address} onChange={handleChange("address")} /></div>
              <div className="space-y-2"><Label>{t("nationalAddress")}</Label><Input value={form.nationalAddress} onChange={handleChange("nationalAddress")} /></div>
              <div className="space-y-2"><Label>{t("shortAddress")}</Label><Input value={form.shortAddress} onChange={handleChange("shortAddress")} /></div>
              <div className="space-y-2"><Label>{t("buildingNumber")}</Label><Input value={form.buildingNumber} onChange={handleChange("buildingNumber")} /></div>
              <div className="space-y-2"><Label>{t("street")}</Label><Input value={form.street} onChange={handleChange("street")} /></div>
              <div className="space-y-2"><Label>{t("postalCode")}</Label><Input value={form.postalCode} onChange={handleChange("postalCode")} /></div>
              <div className="space-y-2"><Label>{t("subNumber")}</Label><Input value={form.subNumber} onChange={handleChange("subNumber")} /></div>
              <div className="space-y-2"><Label>{t("locationUrl")}</Label><Input value={form.locationUrl} onChange={handleChange("locationUrl")} /></div>
              <div className="space-y-2"><Label>{t("latitude")}</Label><Input value={form.latitude} onChange={handleChange("latitude")} /></div>
              <div className="space-y-2"><Label>{t("longitude")}</Label><Input value={form.longitude} onChange={handleChange("longitude")} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("packageDescription")}</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2"><Label>{t("packageDescription")}</Label><Input value={form.packageDescription} onChange={handleChange("packageDescription")} /></div>
              <div className="space-y-2"><Label>{t("pieces")}</Label><Input type="number" min="1" value={form.pieces} onChange={handleChange("pieces")} /></div>
              <div className="space-y-2"><Label>{t("weight")}</Label><Input type="number" step="0.01" value={form.weight} onChange={handleChange("weight")} /></div>
              <div className="space-y-2"><Label>{t("shipmentType")}</Label><Select value={form.shipmentType} onChange={handleChange("shipmentType")} options={shipmentTypeOptions} /></div>
              <div className="space-y-2"><Label>{t("priority")}</Label><Select value={form.priority} onChange={handleChange("priority")} options={priorityOptions} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("deliveryDate")}</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>{t("deliveryDate")}</Label><Input type="date" value={form.deliveryDate} onChange={handleChange("deliveryDate")} /></div>
              <div className="space-y-2"><Label>{t("deliveryWindow")}</Label><Input value={form.deliveryWindow} onChange={handleChange("deliveryWindow")} placeholder="e.g. 09:00-17:00" /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("customerNotes")}</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>{t("customerNotes")}</Label><textarea value={form.customerNotes} onChange={handleChange("customerNotes")} rows={3} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2" /></div>
              <div className="space-y-2"><Label>{t("partnerInstructions")}</Label><textarea value={form.partnerInstructions} onChange={handleChange("partnerInstructions")} rows={3} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2" /></div>
              <div className="space-y-2 sm:col-span-2"><Label>{t("internalNotes")}</Label><textarea value={form.internalNotes} onChange={handleChange("internalNotes")} rows={3} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2" /></div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.push(`/shipments/${id}`)}>{tCommon("cancel")}</Button>
            <Button type="submit" loading={submitting}><Save className="size-4" />{tCommon("save")}</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
