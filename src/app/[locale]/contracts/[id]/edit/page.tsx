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
import { ArrowLeft, AlertCircle } from "lucide-react";

interface PartnerOption {
  _id: string;
  tradingNameAr: string;
}

interface FormData {
  partnerId: string;
  name: string;
  contractType: string;
  status: string;
  startDate: string;
  endDate: string;
  trialStartDate: string;
  goLiveDate: string;
  cities: string;
  workingDays: string[];
  deliveryAttempts: string;
  proofType: string;
  shipmentEntryChannel: string;
  updateChannel: string;
  returnPolicy: string;
  azmResponsible: string;
  partnerResponsible: string;
  operationalNotes: string;
}

const weekDays = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];

export default function EditContractPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split("/").slice(-2, -1)[0] ?? "";

  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [partners, setPartners] = useState<PartnerOption[]>([]);

  useEffect(() => {
    fetch("/api/partners")
      .then((r) => r.json())
      .then((data) => setPartners(data.partners ?? data.data ?? []))
      .catch(() => {});
  }, []);

  const fetchContract = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/contracts/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const contract = data.contract ?? data;
      setForm({
        partnerId: contract.partner?._id ?? "",
        name: contract.name ?? "",
        contractType: contract.contractType ?? "",
        status: contract.status ?? "draft",
        startDate: contract.startDate ?? "",
        endDate: contract.endDate ?? "",
        trialStartDate: contract.trialStartDate ?? "",
        goLiveDate: contract.goLiveDate ?? "",
        cities: contract.cities ?? "",
        workingDays: contract.workingDays ?? [],
        deliveryAttempts: String(contract.deliveryAttempts ?? ""),
        proofType: contract.proofType ?? "",
        shipmentEntryChannel: contract.shipmentEntryChannel ?? "",
        updateChannel: contract.updateChannel ?? "",
        returnPolicy: contract.returnPolicy ?? "",
        azmResponsible: contract.azmResponsible ?? "",
        partnerResponsible: contract.partnerResponsible ?? "",
        operationalNotes: contract.operationalNotes ?? "",
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  const typeOptions = [
    { value: "main", label: t("contracts.type_main") },
    { value: "sub", label: t("contracts.type_sub") },
    { value: "temporary", label: t("contracts.type_temporary") },
  ];

  const statusOptions = [
    { value: "draft", label: t("status.draft") },
    { value: "active", label: t("status.active") },
    { value: "ended", label: t("status.ended") },
    { value: "suspended", label: t("status.suspended") },
  ];

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => prev ? { ...prev, [field]: e.target.value } : prev);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const toggleDay = (day: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        workingDays: prev.workingDays.includes(day)
          ? prev.workingDays.filter((d) => d !== day)
          : [...prev.workingDays, day],
      };
    });
  };

  const validate = () => {
    if (!form) return false;
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.partnerId) newErrors.partnerId = t("validation.required");
    if (!form.name.trim()) newErrors.name = t("validation.required");
    if (!form.contractType) newErrors.contractType = t("validation.required");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/contracts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to update contract");
      router.push(`/contracts/${id}`);
    } catch {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout locale={locale} title={t("contracts.edit")}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton variant="rectangular" className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !form) {
    return (
      <DashboardLayout locale={locale} title={t("contracts.edit")}>
        <EmptyState
          icon={<AlertCircle className="size-8" />}
          title={t("common.error")}
          action={{ label: t("errors.retry"), onClick: fetchContract }}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout locale={locale} title={t("contracts.edit")}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/contracts/${id}`)}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("contracts.edit")}</h1>
            <p className="mt-1 text-sm text-gray-500">{form.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("contracts.basicInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("contracts.partner")} *</Label>
                <Select
                  value={form.partnerId}
                  onChange={handleChange("partnerId")}
                  options={partners.map((p) => ({ value: p._id, label: p.tradingNameAr }))}
                  placeholder={t("common.select")}
                  error={errors.partnerId}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("contracts.name")} *</Label>
                <Input
                  value={form.name}
                  onChange={handleChange("name")}
                  error={errors.name}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("contracts.contractType")} *</Label>
                <Select
                  value={form.contractType}
                  onChange={handleChange("contractType")}
                  options={typeOptions}
                  placeholder={t("common.select")}
                  error={errors.contractType}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("common.status")}</Label>
                <Select
                  value={form.status}
                  onChange={handleChange("status")}
                  options={statusOptions}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("contracts.schedule")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("contracts.startDate")}</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={handleChange("startDate")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("contracts.endDate")}</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={handleChange("endDate")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("contracts.trialStartDate")}</Label>
                <Input
                  type="date"
                  value={form.trialStartDate}
                  onChange={handleChange("trialStartDate")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("contracts.goLiveDate")}</Label>
                <Input
                  type="date"
                  value={form.goLiveDate}
                  onChange={handleChange("goLiveDate")}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("contracts.cities")}</Label>
                <Input
                  value={form.cities}
                  onChange={handleChange("cities")}
                  placeholder={t("contracts.citiesPlaceholder")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("contracts.workingDays")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {weekDays.map((day) => (
                  <label key={day} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.workingDays.includes(day)}
                      onChange={() => toggleDay(day)}
                      className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{t(`days.${day}`)}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("contracts.operations")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("contracts.deliveryAttempts")}</Label>
                <Input
                  type="number"
                  value={form.deliveryAttempts}
                  onChange={handleChange("deliveryAttempts")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("contracts.proofType")}</Label>
                <Input
                  value={form.proofType}
                  onChange={handleChange("proofType")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("contracts.shipmentEntryChannel")}</Label>
                <Input
                  value={form.shipmentEntryChannel}
                  onChange={handleChange("shipmentEntryChannel")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("contracts.updateChannel")}</Label>
                <Input
                  value={form.updateChannel}
                  onChange={handleChange("updateChannel")}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("contracts.returnPolicy")}</Label>
                <textarea
                  value={form.returnPolicy}
                  onChange={handleChange("returnPolicy")}
                  rows={2}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("contracts.responsibleParties")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("contracts.azmResponsible")}</Label>
                <Input
                  value={form.azmResponsible}
                  onChange={handleChange("azmResponsible")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("contracts.partnerResponsible")}</Label>
                <Input
                  value={form.partnerResponsible}
                  onChange={handleChange("partnerResponsible")}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("contracts.operationalNotes")}</Label>
                <textarea
                  value={form.operationalNotes}
                  onChange={handleChange("operationalNotes")}
                  rows={3}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.push(`/contracts/${id}`)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" loading={submitting}>
              {t("common.save")}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
