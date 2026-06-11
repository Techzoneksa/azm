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
import { ArrowLeft, Loader2 } from "lucide-react";

interface FormData {
  fullName: string;
  phone: string;
  email: string;
  nationalId: string;
  nationality: string;
  dateOfBirth: string;
  city: string;
  district: string;
  relationType: string;
  joinDate: string;
  experience: string;
  previousCompanies: string;
  vehicleType: string;
  plateNumber: string;
  status: string;
  notes: string;
}

export default function NewDriverPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    fullName: "", phone: "", email: "", nationalId: "", nationality: "",
    dateOfBirth: "", city: "", district: "", relationType: "", joinDate: "",
    experience: "", previousCompanies: "", vehicleType: "", plateNumber: "",
    status: "draft", notes: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const relationOptions = [
    { value: "employee", label: t("common.employee") ?? "Employee" },
    { value: "contractor", label: t("common.contractor") ?? "Contractor" },
    { value: "owner", label: t("common.owner") ?? "Owner" },
  ];

  const statusOptions = [
    { value: "draft", label: t("drivers.status_draft") },
    { value: "active", label: t("drivers.status_active") },
    { value: "inactive", label: t("drivers.status_inactive") },
    { value: "suspended", label: t("drivers.status_suspended") },
  ];

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.fullName.trim()) newErrors.fullName = t("validation.required");
    if (!form.nationalId.trim()) newErrors.nationalId = t("validation.required");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create driver");
      router.push("/drivers");
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout locale={locale} title={t("drivers.new")}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/drivers")}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("drivers.new")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("drivers.subtitle")}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("drivers.personalInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("drivers.fullName")} *</Label>
                <Input
                  value={form.fullName}
                  onChange={handleChange("fullName")}
                  error={errors.fullName}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("drivers.phone")}</Label>
                <Input
                  value={form.phone}
                  onChange={handleChange("phone")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("drivers.email")}</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("drivers.nationalId")} *</Label>
                <Input
                  value={form.nationalId}
                  onChange={handleChange("nationalId")}
                  error={errors.nationalId}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("drivers.nationality")}</Label>
                <Input
                  value={form.nationality}
                  onChange={handleChange("nationality")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("drivers.dateOfBirth")}</Label>
                <Input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={handleChange("dateOfBirth")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("drivers.city")}</Label>
                <Input
                  value={form.city}
                  onChange={handleChange("city")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("drivers.district")}</Label>
                <Input
                  value={form.district}
                  onChange={handleChange("district")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("drivers.workInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("drivers.relationType")}</Label>
                <Select
                  value={form.relationType}
                  onChange={handleChange("relationType")}
                  options={relationOptions}
                  placeholder={t("common.select") ?? "Select..."}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("drivers.joinDate")}</Label>
                <Input
                  type="date"
                  value={form.joinDate}
                  onChange={handleChange("joinDate")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("drivers.experience")}</Label>
                <Input
                  value={form.experience}
                  onChange={handleChange("experience")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("drivers.previousCompanies")}</Label>
                <Input
                  value={form.previousCompanies}
                  onChange={handleChange("previousCompanies")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("vehicles.title")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("drivers.vehicleType")}</Label>
                <Input
                  value={form.vehicleType}
                  onChange={handleChange("vehicleType")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("drivers.plateNumber")}</Label>
                <Input
                  value={form.plateNumber}
                  onChange={handleChange("plateNumber")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("common.status")}</CardTitle>
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
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("drivers.notes")}</Label>
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
            <Button type="button" variant="outline" onClick={() => router.push("/drivers")}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" loading={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("common.create")}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
