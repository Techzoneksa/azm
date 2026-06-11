"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Download, AlertCircle, BarChart3 } from "lucide-react";

interface KPIData {
  totalShipments: number;
  receivedShipments: number;
  readyShipments: number;
  assignedShipments: number;
  outForDelivery: number;
  deliveredShipments: number;
  failedShipments: number;
  returnedShipments: number;
  openShipments: number;
  needsReviewShipments: number;
  deliverySuccessRate: number;
}

interface FailureReason {
  reason: string;
  count: number;
  percentage: number;
}

interface PartnerPerf {
  partnerId: string;
  partnerName: string;
  total: number;
  delivered: number;
  failed: number;
  rate: number;
}

interface DriverPerf {
  driverId: string;
  driverName: string;
  total: number;
  delivered: number;
  failed: number;
  rate: number;
}

interface PartnersMap {
  [key: string]: string;
}

interface DriversMap {
  [key: string]: string;
}

export default function OperationsReportPage() {
  const t = useTranslations("operationsReports");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [failureReasons, setFailureReasons] = useState<FailureReason[]>([]);
  const [partnerPerf, setPartnerPerf] = useState<PartnerPerf[]>([]);
  const [driverPerf, setDriverPerf] = useState<DriverPerf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dateRange, setDateRange] = useState("today");
  const [partnerFilter, setPartnerFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [driverFilter, setDriverFilter] = useState("");
  const [partners, setPartners] = useState<{ _id: string; tradingNameAr: string }[]>([]);
  const [drivers, setDrivers] = useState<{ _id: string; fullName: string }[]>([]);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      params.set("dateRange", dateRange);
      if (dateRange === "custom") {
        if (customStart) params.set("startDate", customStart);
        if (customEnd) params.set("endDate", customEnd);
      }
      if (partnerFilter) params.set("partnerId", partnerFilter);
      if (cityFilter) params.set("city", cityFilter);
      if (driverFilter) params.set("driverId", driverFilter);

      const [reportRes, partnersRes, driversRes] = await Promise.all([
        fetch(`/api/reports/operations?${params}`),
        fetch("/api/partners?limit=500&status=active").catch(() => null),
        fetch("/api/drivers?limit=500&status=active").catch(() => null),
      ]);
      if (!reportRes.ok) throw new Error("Failed");
      const json = await reportRes.json();
      const data = json.data ?? json;
      setKpi(data.kpi ?? data);
      setFailureReasons(data.failureReasons ?? []);
      setPartnerPerf(data.partnerPerformance ?? []);
      setDriverPerf(data.driverPerformance ?? []);

      if (partnersRes?.ok) { const pj = await partnersRes.json(); setPartners(pj.data ?? []); }
      if (driversRes?.ok) { const dj = await driversRes.json(); setDrivers(dj.data ?? []); }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [dateRange, customStart, customEnd, partnerFilter, cityFilter, driverFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = () => {
    const params = new URLSearchParams();
    params.set("dateRange", dateRange);
    if (dateRange === "custom") {
      if (customStart) params.set("startDate", customStart);
      if (customEnd) params.set("endDate", customEnd);
    }
    if (partnerFilter) params.set("partnerId", partnerFilter);
    if (cityFilter) params.set("city", cityFilter);
    if (driverFilter) params.set("driverId", driverFilter);
    params.set("export", "csv");
    window.open(`/api/reports/operations?${params}`, "_blank");
  };

  const dateRangeOptions = [
    { value: "today", label: t("today") },
    { value: "thisWeek", label: t("thisWeek") },
    { value: "thisMonth", label: t("thisMonth") },
    { value: "custom", label: t("customRange") },
  ];

  const kpiCards = kpi ? [
    { label: t("totalShipments"), value: kpi.totalShipments, color: "text-gray-900" },
    { label: t("receivedShipments"), value: kpi.receivedShipments, color: "text-blue-600" },
    { label: t("readyShipments"), value: kpi.readyShipments, color: "text-indigo-600" },
    { label: t("assignedShipments"), value: kpi.assignedShipments, color: "text-purple-600" },
    { label: t("outForDelivery"), value: kpi.outForDelivery, color: "text-orange-600" },
    { label: t("deliveredShipments"), value: kpi.deliveredShipments, color: "text-green-600" },
    { label: t("failedShipments"), value: kpi.failedShipments, color: "text-red-600" },
    { label: t("returnedShipments"), value: kpi.returnedShipments, color: "text-yellow-600" },
    { label: t("deliverySuccessRate"), value: `${kpi.deliverySuccessRate}%`, color: kpi.deliverySuccessRate >= 90 ? "text-green-600" : kpi.deliverySuccessRate >= 70 ? "text-yellow-600" : "text-red-600" },
    { label: t("openShipments"), value: kpi.openShipments, color: "text-gray-600" },
    { label: t("needsReviewShipments"), value: kpi.needsReviewShipments, color: "text-red-600" },
  ] : [];

  return (
    <DashboardLayout locale={locale} title={t("title")}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              {t("export")}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={dateRange} onChange={(e) => setDateRange(e.target.value)} options={dateRangeOptions} className="w-36" />
          {dateRange === "custom" && (
            <>
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="h-10 rounded-md border border-gray-300 px-3 text-sm" />
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="h-10 rounded-md border border-gray-300 px-3 text-sm" />
            </>
          )}
          <Select value={partnerFilter} onChange={(e) => setPartnerFilter(e.target.value)} options={[{ value: "", label: tCommon("all") }, ...partners.map(p => ({ value: p._id, label: p.tradingNameAr }))]} className="w-40" />
          <input placeholder={t("city")} value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="h-10 rounded-md border border-gray-300 px-3 text-sm w-28" />
          <Select value={driverFilter} onChange={(e) => setDriverFilter(e.target.value)} options={[{ value: "", label: tCommon("all") }, ...drivers.map(d => ({ value: d._id, label: d.fullName }))]} className="w-40" />
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : error ? (
          <EmptyState icon={<AlertCircle className="size-8" />} title={tCommon("error")} action={{ label: tCommon("retry"), onClick: fetchData }} />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {kpiCards.map((card) => (
                <Card key={card.label}>
                  <CardContent className="p-4">
                    <p className="text-xs font-medium text-gray-500">{card.label}</p>
                    <p className={`mt-1 text-2xl font-bold ${card.color}`}>{card.value}</p>
                    {card.label === t("deliverySuccessRate") && kpi && (
                      <Progress value={kpi.deliverySuccessRate} className="mt-2 h-2" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t("topFailureReasons")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {failureReasons.length === 0 ? (
                    <EmptyState icon={<BarChart3 className="size-8" />} title={tCommon("noData")} />
                  ) : (
                    <div className="space-y-4">
                      {failureReasons.map((fr) => (
                        <div key={fr.reason}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{fr.reason}</span>
                            <span className="font-medium text-gray-900">{fr.count} ({fr.percentage}%)</span>
                          </div>
                          <Progress value={fr.percentage} className="mt-1 h-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("partnerPerformance")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {partnerPerf.length === 0 ? (
                    <EmptyState icon={<BarChart3 className="size-8" />} title={tCommon("noData")} />
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("partner")}</TableHead>
                            <TableHead>{t("totalShipments")}</TableHead>
                            <TableHead>{t("deliveredShipments")}</TableHead>
                            <TableHead>{t("failedShipments")}</TableHead>
                            <TableHead>{t("deliverySuccessRate")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {partnerPerf.map((p) => (
                            <TableRow key={p.partnerId}>
                              <TableCell className="font-medium">{p.partnerName}</TableCell>
                              <TableCell>{p.total}</TableCell>
                              <TableCell>{p.delivered}</TableCell>
                              <TableCell>{p.failed}</TableCell>
                              <TableCell>
                                <span className={`font-medium ${p.rate >= 90 ? "text-green-600" : p.rate >= 70 ? "text-yellow-600" : "text-red-600"}`}>
                                  {p.rate}%
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t("driverPerformance")}</CardTitle>
              </CardHeader>
              <CardContent>
                {driverPerf.length === 0 ? (
                  <EmptyState icon={<BarChart3 className="size-8" />} title={tCommon("noData")} />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("driver")}</TableHead>
                          <TableHead>{t("totalShipments")}</TableHead>
                          <TableHead>{t("deliveredShipments")}</TableHead>
                          <TableHead>{t("failedShipments")}</TableHead>
                          <TableHead>{t("deliverySuccessRate")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {driverPerf.map((d) => (
                          <TableRow key={d.driverId}>
                            <TableCell className="font-medium">{d.driverName}</TableCell>
                            <TableCell>{d.total}</TableCell>
                            <TableCell>{d.delivered}</TableCell>
                            <TableCell>{d.failed}</TableCell>
                            <TableCell>
                              <span className={`font-medium ${d.rate >= 90 ? "text-green-600" : d.rate >= 70 ? "text-yellow-600" : "text-red-600"}`}>
                                {d.rate}%
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
