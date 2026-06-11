"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Save, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface SettingsData {
  systemName: string;
  defaultLanguage: string;
  timezone: string;
  alertDays90: number;
  alertDays60: number;
  alertDays30: number;
  alertDays7: number;
  readinessWeights: Record<string, number>;
  allowedTypes: string;
  maxFileSize: number;
}

const defaultWeights = {
  company: 10,
  licenses: 20,
  drivers: 25,
  vehicles: 25,
  address: 5,
  privacy: 5,
  contracts: 5,
  integrations: 5,
};

const defaultSettings: SettingsData = {
  systemName: "",
  defaultLanguage: "ar",
  timezone: "Asia/Riyadh",
  alertDays90: 90,
  alertDays60: 60,
  alertDays30: 30,
  alertDays7: 7,
  readinessWeights: { ...defaultWeights },
  allowedTypes: ".pdf,.jpg,.png,.doc,.docx",
  maxFileSize: 10,
};

export default function SettingsPage() {
  const t = useTranslations();
  const locale = useLocale();

  const [form, setForm] = useState<SettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const settings = data.settings ?? data;
      setForm({
        systemName: settings.systemName ?? "",
        defaultLanguage: settings.defaultLanguage ?? "ar",
        timezone: settings.timezone ?? "Asia/Riyadh",
        alertDays90: settings.alertDays90 ?? 90,
        alertDays60: settings.alertDays60 ?? 60,
        alertDays30: settings.alertDays30 ?? 30,
        alertDays7: settings.alertDays7 ?? 7,
        readinessWeights: settings.readinessWeights ?? { ...defaultWeights },
        allowedTypes: settings.allowedTypes ?? ".pdf,.jpg,.png,.doc,.docx",
        maxFileSize: settings.maxFileSize ?? 10,
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateWeight = (key: string, value: string) => {
    const num = Math.max(0, Math.min(100, Number(value) || 0));
    setForm((prev) => ({
      ...prev,
      readinessWeights: { ...prev.readinessWeights, [key]: num },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
    } catch {
      //
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout locale={locale} title={t("settings.title")}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" className="h-48" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout locale={locale} title={t("settings.title")}>
        <EmptyState
          icon={<AlertCircle className="size-8" />}
          title={t("common.error")}
          action={{ label: t("errors.retry"), onClick: fetchSettings }}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout locale={locale} title={t("settings.title")}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("settings.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("settings.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.general")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("settings.systemName")}</Label>
                <Input
                  value={form.systemName}
                  onChange={(e) => setForm((p) => ({ ...p, systemName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("settings.defaultLanguage")}</Label>
                <Input
                  value={form.defaultLanguage}
                  onChange={(e) => setForm((p) => ({ ...p, defaultLanguage: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("settings.timezone")}</Label>
                <Input
                  value={form.timezone}
                  onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("settings.documentAlerts")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label>{t("settings.alertDays90")}</Label>
                <Input
                  type="number"
                  value={form.alertDays90}
                  onChange={(e) => setForm((p) => ({ ...p, alertDays90: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("settings.alertDays60")}</Label>
                <Input
                  type="number"
                  value={form.alertDays60}
                  onChange={(e) => setForm((p) => ({ ...p, alertDays60: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("settings.alertDays30")}</Label>
                <Input
                  type="number"
                  value={form.alertDays30}
                  onChange={(e) => setForm((p) => ({ ...p, alertDays30: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("settings.alertDays7")}</Label>
                <Input
                  type="number"
                  value={form.alertDays7}
                  onChange={(e) => setForm((p) => ({ ...p, alertDays7: Number(e.target.value) }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("settings.readinessWeights")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-4">
              {Object.entries(form.readinessWeights).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <Label className="capitalize">{t(`readiness.${key}`) || key}</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={value}
                      onChange={(e) => updateWeight(key, e.target.value)}
                    />
                    <span className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-sm text-gray-400">%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("settings.files")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("settings.allowedTypes")}</Label>
                <Input
                  value={form.allowedTypes}
                  onChange={(e) => setForm((p) => ({ ...p, allowedTypes: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("settings.maxFileSize")} (MB)</Label>
                <Input
                  type="number"
                  value={form.maxFileSize}
                  onChange={(e) => setForm((p) => ({ ...p, maxFileSize: Number(e.target.value) }))}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end">
            <Button type="submit" loading={submitting}>
              <Save className="size-4" />
              {t("common.save")}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
