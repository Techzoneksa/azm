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
  contractId: string;
  city: string;
  operationalZone: string;
  districts: string;
  coverageType: string;
  coverageDays: string;
  coverageStartTime: string;
  coverageEndTime: string;
  minExpectedShipments: string;
  maxExpectedShipments: string;
  needsDedicatedDrivers: boolean;
  status: string;
}

export default function EditCoverageAreaPage() {
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

  const fetchArea = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/coverage-areas/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const area = data.coverageArea ?? data;
      setForm({
        partnerId: area.partner?._id ?? "",
        contractId: area.contract?._id ?? "",
        city: area.city ?? "",
        operationalZone: area.operationalZone ?? "",
        districts: area.districts ?? "",
        coverageType: area.coverageType ?? "",
        coverageDays: area.coverageDays ?? "",
        coverageStartTime: area.coverageStartTime ?? "",
        coverageEndTime: area.coverageEndTime ?? "",
        minExpectedShipments: String(area.minExpectedShipments ?? ""),
        maxExpectedShipments: String(area.maxExpectedShipments ?? ""),
        needsDedicatedDrivers: area.needsDedicatedDrivers ?? false,
        status: area.status ?? "draft",
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchArea();
  }, [fetchArea]);

  const coverageTypeOptions = [
    { value: "primary", label: t("coverageAreas.type_primary") },
    { value: "secondary", label: t("coverageAreas.type_secondary") },
    { value: "backup", label: t("coverageAreas.type_backup") },
  ];

  const statusOptions = [
    { value: "draft", label: t("status.draft") },
    { value: "active", label: t("status.active") },
    { value: "inactive", label: t("status.inactive") },
  ];

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const value = field === "needsDedicatedDrivers"
      ? (e.target as HTMLInputElement).checked
      : e.target.value;
    setForm((prev) => prev ? { ...prev, [field]: value } : prev);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    if (!form) return false;
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.partnerId) newErrors.partnerId = t("validation.required");
    if (!form.city.trim()) newErrors.city = t("validation.required");
    if (!form.operationalZone.trim()) newErrors.operationalZone = t("validation.required");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/coverage-areas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to update coverage area");
      router.push(`/coverage-areas/${id}`);
    } catch {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout locale={locale} title={t("coverageAreas.edit")}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton variant="rectangular" className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !form) {
    return (
      <DashboardLayout locale={locale} title={t("coverageAreas.edit")}>
        <EmptyState
          icon={<AlertCircle className="size-8" />}
          title={t("common.error")}
          action={{ label: t("errors.retry"), onClick: fetchArea }}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout locale={locale} title={t("coverageAreas.edit")}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/coverage-areas/${id}`)}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("coverageAreas.edit")}</h1>
            <p className="mt-1 text-sm text-gray-500">{form.city} - {form.operationalZone}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("coverageAreas.basicInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("coverageAreas.partner")} *</Label>
                <Select
                  value={form.partnerId}
                  onChange={handleChange("partnerId")}
                  options={partners.map((p) => ({ value: p._id, label: p.tradingNameAr }))}
                  placeholder={t("common.select")}
                  error={errors.partnerId}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("coverageAreas.contract")}</Label>
                <Input
                  value={form.contractId}
                  onChange={handleChange("contractId")}
                  placeholder={t("common.optional")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("coverageAreas.city")} *</Label>
                <Input
                  value={form.city}
                  onChange={handleChange("city")}
                  error={errors.city}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("coverageAreas.operationalZone")} *</Label>
                <Input
                  value={form.operationalZone}
                  onChange={handleChange("operationalZone")}
                  error={errors.operationalZone}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("coverageAreas.districts")}</Label>
                <textarea
                  value={form.districts}
                  onChange={handleChange("districts")}
                  rows={3}
                  placeholder={t("coverageAreas.districtsPlaceholder")}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("coverageAreas.coverageInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("coverageAreas.coverageType")}</Label>
                <Select
                  value={form.coverageType}
                  onChange={handleChange("coverageType")}
                  options={coverageTypeOptions}
                  placeholder={t("common.select")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("coverageAreas.coverageDays")}</Label>
                <Input
                  value={form.coverageDays}
                  onChange={handleChange("coverageDays")}
                  placeholder={t("coverageAreas.coverageDaysPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("coverageAreas.coverageStartTime")}</Label>
                <Input
                  type="time"
                  value={form.coverageStartTime}
                  onChange={handleChange("coverageStartTime")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("coverageAreas.coverageEndTime")}</Label>
                <Input
                  type="time"
                  value={form.coverageEndTime}
                  onChange={handleChange("coverageEndTime")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("coverageAreas.shipmentInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("coverageAreas.minExpectedShipments")}</Label>
                <Input
                  type="number"
                  value={form.minExpectedShipments}
                  onChange={handleChange("minExpectedShipments")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("coverageAreas.maxExpectedShipments")}</Label>
                <Input
                  type="number"
                  value={form.maxExpectedShipments}
                  onChange={handleChange("maxExpectedShipments")}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.needsDedicatedDrivers}
                    onChange={handleChange("needsDedicatedDrivers")}
                    className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{t("coverageAreas.needsDedicatedDrivers")}</span>
                </label>
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

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.push(`/coverage-areas/${id}`)}>
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
