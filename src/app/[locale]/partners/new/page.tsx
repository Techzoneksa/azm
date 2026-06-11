"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

interface FormData {
  tradingNameAr: string;
  tradingNameEn: string;
  legalName: string;
  partnerType: string;
  sector: string;
  commercialReg: string;
  taxNumber: string;
  city: string;
  country: string;
  website: string;
  officialEmail: string;
  primaryPhone: string;
  contactPersonName: string;
  contactPersonPhone: string;
  contactPersonEmail: string;
  status: string;
  priority: string;
  source: string;
  notes: string;
}

export default function NewPartnerPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    tradingNameAr: "", tradingNameEn: "", legalName: "", partnerType: "", sector: "",
    commercialReg: "", taxNumber: "", city: "", country: "", website: "",
    officialEmail: "", primaryPhone: "", contactPersonName: "", contactPersonPhone: "",
    contactPersonEmail: "", status: "draft", priority: "medium", source: "", notes: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const partnerTypeOptions = [
    { value: "carrier", label: t("partners.type_carrier") },
    { value: "supplier", label: t("partners.type_supplier") },
    { value: "client", label: t("partners.type_client") },
    { value: "service_provider", label: t("partners.type_service_provider") },
  ];

  const statusOptions = [
    { value: "draft", label: t("status.draft") },
    { value: "active", label: t("status.active") },
    { value: "inactive", label: t("status.inactive") },
    { value: "suspended", label: t("status.suspended") },
  ];

  const priorityOptions = [
    { value: "low", label: t("partners.priority_low") },
    { value: "medium", label: t("partners.priority_medium") },
    { value: "high", label: t("partners.priority_high") },
    { value: "critical", label: t("partners.priority_critical") },
  ];

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.tradingNameAr.trim()) newErrors.tradingNameAr = t("validation.required");
    if (!form.partnerType) newErrors.partnerType = t("validation.required");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create partner");
      const data = await res.json();
      const id = data.partner?._id ?? data._id;
      router.push(`/partners/${id}`);
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout locale={locale} title={t("partners.new")}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/partners")}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("partners.new")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("partners.subtitle")}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("partners.basicInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("partners.tradingNameAr")} *</Label>
                <Input
                  value={form.tradingNameAr}
                  onChange={handleChange("tradingNameAr")}
                  error={errors.tradingNameAr}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("partners.tradingNameEn")}</Label>
                <Input
                  value={form.tradingNameEn}
                  onChange={handleChange("tradingNameEn")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("partners.legalName")}</Label>
                <Input
                  value={form.legalName}
                  onChange={handleChange("legalName")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("partners.partnerType")} *</Label>
                <Select
                  value={form.partnerType}
                  onChange={handleChange("partnerType")}
                  options={partnerTypeOptions}
                  placeholder={t("common.select")}
                  error={errors.partnerType}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("partners.sector")}</Label>
                <Input
                  value={form.sector}
                  onChange={handleChange("sector")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("partners.registrationInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("partners.commercialReg")}</Label>
                <Input
                  value={form.commercialReg}
                  onChange={handleChange("commercialReg")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("partners.taxNumber")}</Label>
                <Input
                  value={form.taxNumber}
                  onChange={handleChange("taxNumber")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("partners.addressInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("partners.city")}</Label>
                <Input
                  value={form.city}
                  onChange={handleChange("city")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("partners.country")}</Label>
                <Input
                  value={form.country}
                  onChange={handleChange("country")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("partners.website")}</Label>
                <Input
                  type="url"
                  value={form.website}
                  onChange={handleChange("website")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("partners.contactInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("partners.officialEmail")}</Label>
                <Input
                  type="email"
                  value={form.officialEmail}
                  onChange={handleChange("officialEmail")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("partners.primaryPhone")}</Label>
                <Input
                  value={form.primaryPhone}
                  onChange={handleChange("primaryPhone")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("partners.contactPersonName")}</Label>
                <Input
                  value={form.contactPersonName}
                  onChange={handleChange("contactPersonName")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("partners.contactPersonPhone")}</Label>
                <Input
                  value={form.contactPersonPhone}
                  onChange={handleChange("contactPersonPhone")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("partners.contactPersonEmail")}</Label>
                <Input
                  type="email"
                  value={form.contactPersonEmail}
                  onChange={handleChange("contactPersonEmail")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("common.settings")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("common.status")}</Label>
                <Select
                  value={form.status}
                  onChange={handleChange("status")}
                  options={statusOptions}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("partners.priority")}</Label>
                <Select
                  value={form.priority}
                  onChange={handleChange("priority")}
                  options={priorityOptions}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("partners.source")}</Label>
                <Input
                  value={form.source}
                  onChange={handleChange("source")}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("partners.notes")}</Label>
                <textarea
                  value={form.notes}
                  onChange={handleChange("notes")}
                  rows={3}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.push("/partners")}>
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
