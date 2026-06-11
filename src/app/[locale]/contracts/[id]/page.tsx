"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ArrowLeft, Pencil, FileText, AlertCircle, Building2, Calendar, Clock,
  CheckCircle2, Activity, Layers, Shield
} from "lucide-react";

interface Contract {
  _id: string;
  contractNumber: string;
  name: string;
  contractType: string;
  status: string;
  startDate: string;
  endDate: string;
  trialStartDate?: string;
  goLiveDate?: string;
  cities?: string;
  workingDays?: string[];
  deliveryAttempts?: number;
  proofType?: string;
  shipmentEntryChannel?: string;
  updateChannel?: string;
  returnPolicy?: string;
  azmResponsible?: string;
  partnerResponsible?: string;
  operationalNotes?: string;
  readinessStatus: string;
  partner?: { _id: string; tradingNameAr: string };
}

export default function ContractDetailPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split("/").slice(-2, -1)[0] ?? pathname.split("/").pop() ?? "";

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState("overview");

  const tabs = [
    { key: "overview", label: t("contracts.overview") },
    { key: "readiness", label: t("contracts.readiness") },
    { key: "coverageAreas", label: t("contracts.coverageAreas") },
    { key: "requirements", label: t("contracts.requirements") },
    { key: "activityLog", label: t("contracts.activityLog") },
  ];

  const fetchContract = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/contracts/${id}`);
      if (!res.ok) throw new Error("Failed to fetch contract");
      const data = await res.json();
      setContract(data.contract ?? data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  if (loading) {
    return (
      <DashboardLayout locale={locale} title={t("contracts.details")}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !contract) {
    return (
      <DashboardLayout locale={locale} title={t("contracts.details")}>
        <EmptyState
          icon={<AlertCircle className="size-8" />}
          title={t("common.error")}
          action={{ label: t("errors.retry"), onClick: fetchContract }}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout locale={locale} title={t("contracts.details")}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/contracts")}>
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("contracts.details")}</h1>
            </div>
          </div>
          <Button onClick={() => router.push(`/contracts/${id}/edit`)}>
            <Pencil className="size-4" />
            {t("common.edit")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{contract.contractNumber} - {contract.name}</CardTitle>
                <CardDescription>
                  <Building2 className="inline size-3 me-1" />
                  {contract.partner?.tradingNameAr ?? "-"}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <StatusBadge status={contract.status} />
                <Badge variant="outline">{t(`contracts.${contract.contractType}`)}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <dt className="text-xs font-medium text-gray-500">{t("contracts.readinessStatus")}</dt>
              <div className="mt-1 flex items-center gap-2">
                <Progress value={contract.readinessStatus === "ready" ? 100 : 50} className="flex-1" />
                <StatusBadge status={contract.readinessStatus} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="border-b border-gray-200">
          <nav className="flex flex-wrap gap-1">
            {tabs.map((tb) => (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  tab === tb.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tb.label}
              </button>
            ))}
          </nav>
        </div>

        {tab === "overview" && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("contracts.basicInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-gray-500">{t("contracts.contractNumber")}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">{contract.contractNumber}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">{t("contracts.name")}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">{contract.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">{t("contracts.contractType")}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">{t(`contracts.${contract.contractType}`)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">{t("contracts.partner")}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">
                    {contract.partner?.tradingNameAr ?? "-"}
                  </dd>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("contracts.schedule")}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-gray-500">{t("contracts.startDate")}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">{contract.startDate || "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">{t("contracts.endDate")}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">{contract.endDate || "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">{t("contracts.trialStartDate")}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">{contract.trialStartDate || "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">{t("contracts.goLiveDate")}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">{contract.goLiveDate || "-"}</dd>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("contracts.operations")}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-gray-500">{t("contracts.deliveryAttempts")}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">{contract.deliveryAttempts ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">{t("contracts.proofType")}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">{contract.proofType || "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">{t("contracts.shipmentEntryChannel")}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">{contract.shipmentEntryChannel || "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">{t("contracts.updateChannel")}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">{contract.updateChannel || "-"}</dd>
                </div>
                {contract.cities && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium text-gray-500">{t("contracts.cities")}</dt>
                    <dd className="mt-0.5 text-sm font-medium text-gray-900">{contract.cities}</dd>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("contracts.responsibleParties")}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-gray-500">{t("contracts.azmResponsible")}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">{contract.azmResponsible || "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">{t("contracts.partnerResponsible")}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">{contract.partnerResponsible || "-"}</dd>
                </div>
              </CardContent>
            </Card>

            {contract.returnPolicy && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>{t("contracts.returnPolicy")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{contract.returnPolicy}</p>
                </CardContent>
              </Card>
            )}

            {contract.operationalNotes && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>{t("contracts.operationalNotes")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{contract.operationalNotes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {tab === "readiness" && (
          <Card>
            <CardHeader>
              <CardTitle>{t("contracts.readiness")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">{t("contracts.readinessDescription")}</p>
              <Button onClick={() => router.push(`/contracts/${id}/readiness`)}>
                {t("contracts.viewReadinessChecklist")}
              </Button>
            </CardContent>
          </Card>
        )}

        {tab === "coverageAreas" && (
          <EmptyState icon={<Layers className="size-8" />} title={t("common.noData")} />
        )}

        {tab === "requirements" && (
          <EmptyState icon={<CheckCircle2 className="size-8" />} title={t("common.noData")} />
        )}

        {tab === "activityLog" && (
          <EmptyState icon={<Activity className="size-8" />} title={t("common.noData")} />
        )}
      </div>
    </DashboardLayout>
  );
}
