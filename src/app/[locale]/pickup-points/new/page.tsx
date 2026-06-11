"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

interface PartnerOption {
  _id: string;
  tradingNameAr: string;
}

interface FormData {
  partnerId: string;
  name: string;
  pointType: string;
  city: string;
  district: string;
  address: string;
  nationalAddress: string;
  mapLink: string;
  contactPerson: string;
  contactPhone: string;
  workingDays: string;
  workingHours: string;
  pickupInstructions: string;
  requiresAppointment: boolean;
  status: string;
}

export default function NewPickupPointPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    partnerId: "", name: "", pointType: "", city: "", district: "", address: "",
    nationalAddress: "", mapLink: "", contactPerson: "", contactPhone: "",
    workingDays: "", workingHours: "", pickupInstructions: "",
    requiresAppointment: false, status: "draft",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [partners, setPartners] = useState<PartnerOption[]>([]);

  useEffect(() => {
    fetch("/api/partners")
      .then((r) => r.json())
      .then((data) => setPartners(data.partners ?? data.data ?? []))
      .catch(() => {});
  }, []);

  const pointTypeOptions = [
    { value: "warehouse", label: t("pickupPoints.type_warehouse") },
    { value: "store", label: t("pickupPoints.type_store") },
    { value: "hub", label: t("pickupPoints.type_hub") },
    { value: "drop_off", label: t("pickupPoints.type_drop_off") },
  ];

  const statusOptions = [
    { value: "draft", label: t("status.draft") },
    { value: "active", label: t("status.active") },
    { value: "inactive", label: t("status.inactive") },
  ];

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const value = field === "requiresAppointment"
      ? (e.target as HTMLInputElement).checked
      : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.partnerId) newErrors.partnerId = t("validation.required");
    if (!form.name.trim()) newErrors.name = t("validation.required");
    if (!form.pointType) newErrors.pointType = t("validation.required");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/pickup-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create pickup point");
      const data = await res.json();
      const id = data.pickupPoint?._id ?? data._id;
      router.push(`/pickup-points/${id}`);
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout locale={locale} title={t("pickupPoints.new")}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/pickup-points")}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("pickupPoints.new")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("pickupPoints.subtitle")}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("pickupPoints.basicInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("pickupPoints.partner")} *</Label>
                <Select
                  value={form.partnerId}
                  onChange={handleChange("partnerId")}
                  options={partners.map((p) => ({ value: p._id, label: p.tradingNameAr }))}
                  placeholder={t("common.select")}
                  error={errors.partnerId}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("pickupPoints.name")} *</Label>
                <Input
                  value={form.name}
                  onChange={handleChange("name")}
                  error={errors.name}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("pickupPoints.pointType")} *</Label>
                <Select
                  value={form.pointType}
                  onChange={handleChange("pointType")}
                  options={pointTypeOptions}
                  placeholder={t("common.select")}
                  error={errors.pointType}
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
              <CardTitle>{t("pickupPoints.location")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("pickupPoints.city")}</Label>
                <Input
                  value={form.city}
                  onChange={handleChange("city")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("pickupPoints.district")}</Label>
                <Input
                  value={form.district}
                  onChange={handleChange("district")}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("pickupPoints.address")}</Label>
                <Input
                  value={form.address}
                  onChange={handleChange("address")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("pickupPoints.nationalAddress")}</Label>
                <Input
                  value={form.nationalAddress}
                  onChange={handleChange("nationalAddress")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("pickupPoints.mapLink")}</Label>
                <Input
                  type="url"
                  value={form.mapLink}
                  onChange={handleChange("mapLink")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("pickupPoints.contactInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("pickupPoints.contactPerson")}</Label>
                <Input
                  value={form.contactPerson}
                  onChange={handleChange("contactPerson")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("pickupPoints.contactPhone")}</Label>
                <Input
                  value={form.contactPhone}
                  onChange={handleChange("contactPhone")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("pickupPoints.operations")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("pickupPoints.workingDays")}</Label>
                <Input
                  value={form.workingDays}
                  onChange={handleChange("workingDays")}
                  placeholder={t("pickupPoints.workingDaysPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("pickupPoints.workingHours")}</Label>
                <Input
                  value={form.workingHours}
                  onChange={handleChange("workingHours")}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("pickupPoints.pickupInstructions")}</Label>
                <textarea
                  value={form.pickupInstructions}
                  onChange={handleChange("pickupInstructions")}
                  rows={3}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requiresAppointment}
                    onChange={handleChange("requiresAppointment")}
                    className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{t("pickupPoints.requiresAppointment")}</span>
                </label>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.push("/pickup-points")}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" loading={submitting}>
              {t("common.create")}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
