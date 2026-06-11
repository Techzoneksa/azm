"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowLeft, Package, AlertCircle, CheckCircle, XCircle, AlertTriangle, Eye } from "lucide-react";

interface BatchRow {
  rowNumber: number;
  recipientName?: string;
  recipientPhone?: string;
  city?: string;
  validationStatus: string;
  validationErrors: string[];
  shipmentId?: string;
  trackingNumber?: string;
}

interface Batch {
  _id: string;
  fileName?: string;
  fileType?: string;
  status: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  duplicateRows: number;
  uploadedBy?: string;
  uploadedAt: string;
  confirmedAt?: string;
}

export default function ImportBatchDetailPage() {
  const t = useTranslations("shipmentImport");
  const tShip = useTranslations("shipments");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const batchId = pathname.split("/").pop() ?? "";

  const [batch, setBatch] = useState<Batch | null>(null);
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [validationFilter, setValidationFilter] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [batchRes, rowsRes] = await Promise.all([
        fetch(`/api/shipments/import/${batchId}`),
        fetch(`/api/shipments/import/${batchId}/rows`).catch(() => null),
      ]);
      if (!batchRes.ok) throw new Error("Failed");
      const bData = await batchRes.json();
      setBatch(bData.data ?? bData);
      if (rowsRes?.ok) {
        const rData = await rowsRes.json();
        setRows(rData.data ?? []);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredRows = validationFilter
    ? rows.filter(r => r.validationStatus === validationFilter)
    : rows;

  if (loading) {
    return (
      <DashboardLayout locale={locale} title={t("title")}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !batch) {
    return (
      <DashboardLayout locale={locale} title={t("title")}>
        <EmptyState icon={<AlertCircle className="size-8" />} title={tCommon("error")} action={{ label: tCommon("retry"), onClick: fetchData }} />
      </DashboardLayout>
    );
  }

  const validationOptions = [
    { value: "", label: tCommon("all") },
    { value: "valid", label: t("validation_valid") },
    { value: "duplicate", label: t("validation_duplicate") },
    { value: "missing_required_fields", label: t("validation_missing_required_fields") },
    { value: "invalid_phone", label: t("validation_invalid_phone") },
    { value: "out_of_coverage", label: t("validation_out_of_coverage") },
  ];

  return (
    <DashboardLayout locale={locale} title={t("title")}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/shipments/import")}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("batchStatus")}: {batch.fileName ?? batchId}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("batchStatus")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><dt className="text-xs font-medium text-gray-500">{t("fileName")}</dt><dd className="mt-0.5 text-sm font-medium text-gray-900">{batch.fileName ?? "-"}</dd></div>
            <div><dt className="text-xs font-medium text-gray-500">{t("fileType")}</dt><dd className="mt-0.5 text-sm font-medium text-gray-900">{batch.fileType ?? "-"}</dd></div>
            <div><dt className="text-xs font-medium text-gray-500">{t("batchStatus")}</dt><dd className="mt-0.5"><StatusBadge status={batch.status} /></dd></div>
            <div><dt className="text-xs font-medium text-gray-500">{t("uploadedBy")}</dt><dd className="mt-0.5 text-sm font-medium text-gray-900">{batch.uploadedBy ?? "-"}</dd></div>
            <div><dt className="text-xs font-medium text-gray-500">{t("uploadedAt")}</dt><dd className="mt-0.5 text-sm font-medium text-gray-900">{new Date(batch.uploadedAt).toLocaleString()}</dd></div>
            {batch.confirmedAt && <div><dt className="text-xs font-medium text-gray-500">{t("confirmedAt")}</dt><dd className="mt-0.5 text-sm font-medium text-gray-900">{new Date(batch.confirmedAt).toLocaleString()}</dd></div>}
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-4">
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-gray-900">{batch.totalRows}</p><p className="text-xs text-gray-500">{t("totalRows")}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{batch.validRows}</p><p className="text-xs text-gray-500">{t("validRows")}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-yellow-600">{batch.duplicateRows}</p><p className="text-xs text-gray-500">{t("duplicateRows")}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{batch.errorRows}</p><p className="text-xs text-gray-500">{t("errorRows")}</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("preview")}</CardTitle>
              <Select
                value={validationFilter}
                onChange={(e) => setValidationFilter(e.target.value)}
                options={validationOptions}
                className="w-44"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredRows.length === 0 ? (
              <EmptyState icon={<Package className="size-8" />} title={tCommon("noData")} />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("rowNumber")}</TableHead>
                      <TableHead>{tShip("recipientName")}</TableHead>
                      <TableHead>{tShip("recipientPhone")}</TableHead>
                      <TableHead>{tShip("city")}</TableHead>
                      <TableHead>{t("validationStatus")}</TableHead>
                      <TableHead>{t("validationErrors")}</TableHead>
                      <TableHead>{tShip("trackingNumber")}</TableHead>
                      <TableHead className="text-end">{tCommon("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map((row) => (
                      <TableRow key={row.rowNumber}>
                        <TableCell>{row.rowNumber}</TableCell>
                        <TableCell>{row.recipientName ?? "-"}</TableCell>
                        <TableCell>{row.recipientPhone ?? "-"}</TableCell>
                        <TableCell>{row.city ?? "-"}</TableCell>
                        <TableCell><StatusBadge status={row.validationStatus} /></TableCell>
                        <TableCell className="text-xs text-red-600">{row.validationErrors?.length > 0 ? row.validationErrors.join(", ") : "-"}</TableCell>
                        <TableCell className="font-mono text-xs">{row.trackingNumber ?? "-"}</TableCell>
                        <TableCell className="text-end">
                          {row.shipmentId && (
                            <Button variant="ghost" size="icon" onClick={() => router.push(`/shipments/${row.shipmentId}`)}>
                              <Eye className="size-4" />
                            </Button>
                          )}
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
    </DashboardLayout>
  );
}
