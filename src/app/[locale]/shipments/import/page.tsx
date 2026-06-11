"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Upload, Download, Eye, ArrowLeft, AlertCircle, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface PreviewRow {
  rowNumber: number;
  [key: string]: unknown;
  _validationStatus: string;
  _validationErrors: string[];
}

interface BatchInfo {
  _id: string;
  status: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  duplicateRows: number;
  fileName?: string;
}

export default function ImportShipmentsPage() {
  const t = useTranslations("shipmentImport");
  const tShip = useTranslations("shipments");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<"upload" | "preview" | "confirming">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [partnerId, setPartnerId] = useState("");
  const [contractId, setContractId] = useState("");
  const [partners, setPartners] = useState<{ _id: string; tradingNameAr: string }[]>([]);
  const [contracts, setContracts] = useState<{ _id: string; name: string }[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
  const [batchInfo, setBatchInfo] = useState<BatchInfo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/partners?limit=500&status=active").then(r => r.ok && r.json()).then(j => {
      if (j) setPartners(j.data ?? []);
    }).catch(() => {});
  }, []);

  const fetchContracts = useCallback(async (pid: string) => {
    try {
      const res = await fetch(`/api/contracts?partnerId=${pid}&limit=200`);
      if (res.ok) {
        const j = await res.json();
        setContracts(j.data ?? []);
      }
    } catch {}
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file || !partnerId) { setError(t("selectPartner")); return; }
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("partnerId", partnerId);
      if (contractId) formData.append("contractId", contractId);

      const res = await fetch("/api/shipments/import", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const json = await res.json();
      const data = json.data ?? json;
      setBatchId(data._id ?? data.batchId);
      setPreviewData(data.preview ?? data.rows ?? []);
      setBatchInfo({
        _id: data._id ?? data.batchId,
        status: data.status ?? "validated",
        totalRows: data.totalRows ?? data.preview?.length ?? 0,
        validRows: data.validRows ?? data.preview?.filter((r: PreviewRow) => r._validationStatus === "valid").length ?? 0,
        errorRows: data.errorRows ?? data.preview?.filter((r: PreviewRow) => r._validationStatus === "error" || r._validationErrors?.length > 0).length ?? 0,
        duplicateRows: data.duplicateRows ?? 0,
        fileName: file.name,
      });
      setPhase("preview");
    } catch {
      setError(tCommon("error"));
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!batchId) return;
    setConfirming(true);
    try {
      const res = await fetch(`/api/shipments/import/${batchId}/confirm`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Confirm failed");
      setPhase("confirming");
      router.push(`/shipments/import/${batchId}`);
    } catch {
      setError(tCommon("error"));
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = async () => {
    if (!batchId) return;
    try {
      await fetch(`/api/shipments/import/${batchId}`, { method: "DELETE" });
      setPhase("upload");
      setFile(null);
      setPreviewData([]);
      setBatchInfo(null);
      setBatchId(null);
    } catch {}
  };

  const handlePartnerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPartnerId(e.target.value);
    setContractId("");
    if (e.target.value) fetchContracts(e.target.value);
  };

  const getRowStyle = (row: PreviewRow) => {
    if (row._validationStatus === "valid") return "bg-green-50";
    if (row._validationStatus === "duplicate" || row._validationErrors?.some(e => e.toLowerCase().includes("duplicate"))) return "bg-yellow-50";
    if (row._validationErrors?.length > 0) return "bg-red-50";
    return "";
  };

  return (
    <DashboardLayout locale={locale} title={t("title")}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/shipments")}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
          </div>
        </div>

        {phase === "upload" && (
          <Card>
            <CardHeader>
              <CardTitle>{t("upload")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{tShip("partner")} *</Label>
                  <Select value={partnerId} onChange={handlePartnerChange} options={partners.map(p => ({ value: p._id, label: p.tradingNameAr }))} placeholder={tCommon("select")} />
                </div>
                <div className="space-y-2">
                  <Label>{tShip("contract")}</Label>
                  <Select value={contractId} onChange={(e) => setContractId(e.target.value)} options={contracts.map(c => ({ value: c._id, label: c.name }))} placeholder={tCommon("select")} />
                </div>
              </div>

              <div
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 hover:border-blue-400"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mb-4 size-10 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">{file ? file.name : t("upload")}</p>
                <p className="mt-1 text-xs text-gray-500">CSV or Excel (.xlsx, .xls)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => window.open("/api/shipments/import-template", "_blank")}>
                  <Download className="size-4" />
                  {t("downloadTemplate")}
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => router.push("/shipments")}>{tCommon("cancel")}</Button>
                  <Button onClick={handleUpload} loading={uploading} disabled={!file || !partnerId}>
                    <Upload className="size-4" />
                    {t("upload")}
                  </Button>
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </CardContent>
          </Card>
        )}

        {phase === "preview" && batchInfo && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("preview")}</CardTitle>
                <div className="flex gap-3 text-sm">
                  <span className="flex items-center gap-1"><CheckCircle className="size-4 text-green-600" /> {t("validRows")}: {batchInfo.validRows}</span>
                  <span className="flex items-center gap-1"><AlertTriangle className="size-4 text-yellow-600" /> {t("duplicateRows")}: {batchInfo.duplicateRows}</span>
                  <span className="flex items-center gap-1"><XCircle className="size-4 text-red-600" /> {t("errorRows")}: {batchInfo.errorRows}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{t("fileName")}: {batchInfo.fileName ?? "-"}</span>
                <span>{t("totalRows")}: {batchInfo.totalRows}</span>
              </div>

              {previewData.length === 0 ? (
                <EmptyState icon={<Eye className="size-8" />} title={tCommon("noData")} />
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row) => (
                        <TableRow key={row.rowNumber} className={getRowStyle(row)}>
                          <TableCell>{row.rowNumber}</TableCell>
                          <TableCell>{row.recipientName as string}</TableCell>
                          <TableCell>{row.recipientPhone as string}</TableCell>
                          <TableCell>{row.city as string}</TableCell>
                          <TableCell><StatusBadge status={row._validationStatus} /></TableCell>
                          <TableCell className="text-xs text-red-600">
                            {row._validationErrors?.length > 0 ? row._validationErrors.join(", ") : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  <XCircle className="size-4" />
                  {t("cancelImport")}
                </Button>
                <Button onClick={handleConfirm} loading={confirming}>
                  <CheckCircle className="size-4" />
                  {t("confirmImport")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
