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

interface DriverOption {
  _id: string;
  fullName: string;
}

interface FormData {
  vehicleType: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  plateNumber: string;
  serialNumber: string;
  ownerName: string;
  ownerNationalId: string;
  ownershipType: string;
  registrationNumber: string;
  insuranceNumber: string;
  registrationExpiry: string;
  insuranceExpiry: string;
  assignedDriver: string;
  status: string;
  notes: string;
}

export default function NewVehiclePage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    vehicleType: "", brand: "", model: "", year: "", color: "", plateNumber: "",
    serialNumber: "", ownerName: "", ownerNationalId: "", ownershipType: "",
    registrationNumber: "", insuranceNumber: "", registrationExpiry: "", insuranceExpiry: "",
    assignedDriver: "", status: "draft", notes: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);

  useEffect(() => {
    fetch("/api/drivers")
      .then((r) => r.json())
      .then((data) => setDrivers(data.drivers ?? data.data ?? []))
      .catch(() => {});
  }, []);

  const ownershipOptions = [
    { value: "owned", label: t("common.owned") ?? "Owned" },
    { value: "leased", label: t("common.leased") ?? "Leased" },
    { value: "rented", label: t("common.rented") ?? "Rented" },
  ];

  const statusOptions = [
    { value: "draft", label: t("status.draft") },
    { value: "active", label: t("status.active") },
    { value: "inactive", label: t("status.inactive") },
    { value: "suspended", label: t("status.suspended") },
  ];

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.plateNumber.trim()) newErrors.plateNumber = t("validation.required");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create vehicle");
      router.push("/vehicles");
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout locale={locale} title={t("vehicles.new")}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/vehicles")}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("vehicles.new")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("vehicles.subtitle")}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("vehicles.title")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("vehicles.vehicleType")}</Label>
                <Input
                  value={form.vehicleType}
                  onChange={handleChange("vehicleType")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("vehicles.brand")}</Label>
                <Input
                  value={form.brand}
                  onChange={handleChange("brand")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("vehicles.model")}</Label>
                <Input
                  value={form.model}
                  onChange={handleChange("model")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("vehicles.year")}</Label>
                <Input
                  type="number"
                  value={form.year}
                  onChange={handleChange("year")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("vehicles.color")}</Label>
                <Input
                  value={form.color}
                  onChange={handleChange("color")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("vehicles.plateNumber")} *</Label>
                <Input
                  value={form.plateNumber}
                  onChange={handleChange("plateNumber")}
                  error={errors.plateNumber}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("vehicles.serialNumber")}</Label>
                <Input
                  value={form.serialNumber}
                  onChange={handleChange("serialNumber")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("common.owner") ?? "Owner Information"}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("vehicles.ownerName")}</Label>
                <Input
                  value={form.ownerName}
                  onChange={handleChange("ownerName")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("vehicles.ownerNationalId")}</Label>
                <Input
                  value={form.ownerNationalId}
                  onChange={handleChange("ownerNationalId")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("vehicles.ownershipType")}</Label>
                <Select
                  value={form.ownershipType}
                  onChange={handleChange("ownershipType")}
                  options={ownershipOptions}
                  placeholder={t("common.select") ?? "Select..."}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("vehicles.documents")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("vehicles.registrationNumber")}</Label>
                <Input
                  value={form.registrationNumber}
                  onChange={handleChange("registrationNumber")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("vehicles.insuranceNumber")}</Label>
                <Input
                  value={form.insuranceNumber}
                  onChange={handleChange("insuranceNumber")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("vehicles.registrationExpiry")}</Label>
                <Input
                  type="date"
                  value={form.registrationExpiry}
                  onChange={handleChange("registrationExpiry")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("vehicles.insuranceExpiry")}</Label>
                <Input
                  type="date"
                  value={form.insuranceExpiry}
                  onChange={handleChange("insuranceExpiry")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("vehicles.driver")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("vehicles.driver")}</Label>
                <Select
                  value={form.assignedDriver}
                  onChange={handleChange("assignedDriver")}
                  options={drivers.map((d) => ({ value: d._id, label: d.fullName }))}
                  placeholder={t("common.select") ?? "Select..."}
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
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("vehicles.notes")}</Label>
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
            <Button type="button" variant="outline" onClick={() => router.push("/vehicles")}>
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
