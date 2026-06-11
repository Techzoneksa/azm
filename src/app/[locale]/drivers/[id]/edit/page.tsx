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
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

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

export default function EditDriverPage() {
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

  const fetchDriver = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/drivers/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const driver = data.driver ?? data;
      setForm({
        fullName: driver.fullName ?? "",
        phone: driver.phone ?? "",
        email: driver.email ?? "",
        nationalId: driver.nationalId ?? "",
        nationality: driver.nationality ?? "",
        dateOfBirth: driver.dateOfBirth ?? "",
        city: driver.city ?? "",
        district: driver.district ?? "",
        relationType: driver.relationType ?? "",
        joinDate: driver.joinDate ?? "",
        experience: driver.experience ?? "",
        previousCompanies: driver.previousCompanies ?? "",
        vehicleType: driver.vehicleType ?? "",
        plateNumber: driver.plateNumber ?? "",
        status: driver.status ?? "draft",
        notes: driver.notes ?? "",
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDriver();
  }, [fetchDriver]);

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
    setForm((prev) => prev ? { ...prev, [field]: e.target.value } : prev);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    if (!form) return false;
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
      const res = await fetch(`/api/drivers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to update driver");
      router.push(`/drivers/${id}`);
    } catch {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout locale={locale} title={t("drivers.edit")}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton variant="rectangular" className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !form) {
    return (
      <DashboardLayout locale={locale} title={t("drivers.edit")}>
        <EmptyState
          icon={<AlertCircle className="size-8" />}
          title={t("common.error")}
          action={{ label: t("errors.retry"), onClick: fetchDriver }}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout locale={locale} title={t("drivers.edit")}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/drivers/${id}`)}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("drivers.edit")}</h1>
            <p className="mt-1 text-sm text-gray-500">{form.fullName}</p>
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
            <Button type="button" variant="outline" onClick={() => router.push(`/drivers/${id}`)}>
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
