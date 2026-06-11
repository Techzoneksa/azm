"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Building2,
  MapPin,
  Phone,
  Save,
  FileText,
} from "lucide-react";

interface Company {
  arabicName: string;
  englishName: string;
  tradingName: string;
  commercialReg: string;
  unifiedNumber: string;
  taxNumber: string;
  activityType: string;
  foundedDate: string;
  nationalAddress: string;
  shortAddress: string;
  buildingNumber: string;
  street: string;
  district: string;
  addressCity: string;
  postalCode: string;
  subNumber: string;
  contactPhone: string;
  contactEmail: string;
  website: string;
  managerName: string;
  notes: string;
  dataStatus?: string;
}

const initialForm: Company = {
  arabicName: "",
  englishName: "",
  tradingName: "",
  commercialReg: "",
  unifiedNumber: "",
  taxNumber: "",
  activityType: "",
  foundedDate: "",
  nationalAddress: "",
  shortAddress: "",
  buildingNumber: "",
  street: "",
  district: "",
  addressCity: "",
  postalCode: "",
  subNumber: "",
  contactPhone: "",
  contactEmail: "",
  website: "",
  managerName: "",
  notes: "",
};

export default function CompanyPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Company>(initialForm);
  const [dataStatus, setDataStatus] = useState<string | undefined>();
  const [hasData, setHasData] = useState(false);

  const fetchCompany = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/companies");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (data && data.arabicName) {
        setForm({
          arabicName: data.arabicName ?? "",
          englishName: data.englishName ?? "",
          tradingName: data.tradingName ?? "",
          commercialReg: data.commercialReg ?? "",
          unifiedNumber: data.unifiedNumber ?? "",
          taxNumber: data.taxNumber ?? "",
          activityType: data.activityType ?? "",
          foundedDate: data.foundedDate ?? "",
          nationalAddress: data.nationalAddress ?? "",
          shortAddress: data.shortAddress ?? "",
          buildingNumber: data.buildingNumber ?? "",
          street: data.street ?? "",
          district: data.district ?? "",
          addressCity: data.addressCity ?? "",
          postalCode: data.postalCode ?? "",
          subNumber: data.subNumber ?? "",
          contactPhone: data.contactPhone ?? "",
          contactEmail: data.contactEmail ?? "",
          website: data.website ?? "",
          managerName: data.managerName ?? "",
          notes: data.notes ?? "",
        });
        setDataStatus(data.dataStatus);
        setHasData(true);
      }
    } catch {
      addToast({ type: "error", message: t("common.error") });
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  const handleChange = (field: keyof Company, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
      const saved = await res.json();
      if (saved.dataStatus) setDataStatus(saved.dataStatus);
      setHasData(true);
      addToast({ type: "success", message: t("common.success") });
    } catch {
      addToast({ type: "error", message: t("common.error") });
    } finally {
      setSaving(false);
    }
  };

  const renderField = (
    field: keyof Company,
    labelKey: string,
    type = "text"
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={field}>{t(labelKey)}</Label>
      <Input
        id={field}
        type={type}
        value={form[field] ?? ""}
        onChange={(e) => handleChange(field, e.target.value)}
      />
    </div>
  );

  return (
    <DashboardLayout locale={locale} title={t("company.title")}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t("company.title")}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {t("company.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasData && dataStatus && (
              <StatusBadge status={dataStatus} />
            )}
            <Button onClick={handleSave} loading={saving}>
              <Save className="size-4" />
              {t("common.save")}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="size-5 text-gray-500" />
                  <CardTitle>{t("company.companyInfo")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {renderField("arabicName", "company.arabicName")}
                  {renderField("englishName", "company.englishName")}
                  {renderField("tradingName", "company.tradingName")}
                  {renderField("commercialReg", "company.commercialReg")}
                  {renderField("unifiedNumber", "company.unifiedNumber")}
                  {renderField("taxNumber", "company.taxNumber")}
                  {renderField("activityType", "company.activityType")}
                  {renderField("foundedDate", "company.foundedDate", "date")}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MapPin className="size-5 text-gray-500" />
                  <CardTitle>{t("company.addressInfo")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {renderField("nationalAddress", "company.nationalAddress")}
                  {renderField("shortAddress", "company.shortAddress")}
                  {renderField("buildingNumber", "company.buildingNumber")}
                  {renderField("street", "company.street")}
                  {renderField("district", "company.district")}
                  {renderField("addressCity", "company.addressCity")}
                  {renderField("postalCode", "company.postalCode")}
                  {renderField("subNumber", "company.subNumber")}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Phone className="size-5 text-gray-500" />
                  <CardTitle>{t("company.contactInfo")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {renderField("contactPhone", "company.contactPhone")}
                  {renderField("contactEmail", "company.contactEmail", "email")}
                  {renderField("website", "company.website")}
                  {renderField("managerName", "company.managerName")}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="size-5 text-gray-500" />
                  <CardTitle>{t("company.notes")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  <Label htmlFor="notes">{t("company.notes")}</Label>
                  <textarea
                    id="notes"
                    rows={4}
                    value={form.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
