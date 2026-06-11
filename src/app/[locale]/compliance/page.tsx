"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Truck,
  Globe,
  MapPin,
  FileText,
  Upload,
  History,
  ExternalLink,
  Save,
} from "lucide-react";

interface Entity {
  id: string;
  key: string;
  name: string;
  description: string;
  type: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
}

interface Transaction {
  id: string;
  action: string;
  date: string;
  notes: string;
}

interface ComplianceRecord {
  id: string;
  entityId: string;
  entityKey: string;
  status: string;
  licenseNumber: string;
  activityType: string;
  transactionNumber: string;
  submittedDate: string;
  issuedDate: string;
  expiryDate: string;
  nextStep: string;
  responsiblePerson: string;
  notes: string;
  portalUrl: string;
  documents: Document[];
  transactions: Transaction[];
  accountStatus?: string;
  nationalAddress?: string;
  shortAddress?: string;
  apiStatus?: string;
  testEnv?: string;
  prodEnv?: string;
  apiKey?: string;
  lastVerified?: string;
  trackingService?: string;
  privacyPolicy?: string;
  trackingConsents?: string;
}

const statusOptions = [
  { value: "not_started", label: "status.not_started" },
  { value: "in_progress", label: "status.in_progress" },
  { value: "submitted", label: "status.submitted" },
  { value: "approved", label: "status.approved" },
  { value: "rejected", label: "status.rejected" },
  { value: "expired", label: "status.expired" },
  { value: "suspended", label: "status.suspended" },
];

const entityFields: Record<string, string[]> = {
  tpt: ["licenseNumber", "activityType", "transactionNumber", "submittedDate", "issuedDate", "expiryDate", "nextStep", "responsiblePerson", "notes", "portalUrl"],
  cst: ["accountStatus", "apiStatus", "testEnv", "prodEnv", "apiKey", "lastVerified", "transactionNumber", "nextStep", "responsiblePerson", "notes", "portalUrl"],
  spl: ["nationalAddress", "shortAddress", "lastVerified", "readiness", "trackingService", "privacyPolicy", "trackingConsents", "transactionNumber", "nextStep", "responsiblePerson", "notes", "portalUrl"],
};

export default function CompliancePage() {
  const t = useTranslations();
  const locale = useLocale();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ComplianceRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [documentRecordId, setDocumentRecordId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [entitiesRes, complianceRes] = await Promise.all([
        fetch("/api/entities"),
        fetch("/api/compliance"),
      ]);
      if (entitiesRes.ok) {
        const entitiesData = await entitiesRes.json();
        setEntities(Array.isArray(entitiesData) ? entitiesData : []);
      }
      if (complianceRes.ok) {
        const complianceData = await complianceRes.json();
        setRecords(Array.isArray(complianceData) ? complianceData : []);
      }
    } catch {
      addToast({ type: "error", message: t("common.error") });
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getEntityByKey = (key: string) =>
    entities.find((e) => e.key === key);

  const getRecordForEntity = (entityKey: string) =>
    records.find((r) => r.entityKey === entityKey);

  const handleEdit = (record: ComplianceRecord) => {
    setSelectedRecord({ ...record });
    setDialogOpen(true);
  };

  const handleSaveRecord = async () => {
    if (!selectedRecord) return;
    setSaving(true);
    try {
      const res = await fetch(
        selectedRecord.id ? `/api/compliance/${selectedRecord.id}` : "/api/compliance",
        {
          method: selectedRecord.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selectedRecord),
        }
      );
      if (!res.ok) throw new Error("Save failed");
      const saved = await res.json();
      setRecords((prev) => {
        const idx = prev.findIndex((r) => r.id === saved.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [...prev, saved];
      });
      addToast({ type: "success", message: t("common.success") });
      setDialogOpen(false);
    } catch {
      addToast({ type: "error", message: t("common.error") });
    } finally {
      setSaving(false);
    }
  };

  const handleAddRecord = async (entity: Entity) => {
    setSelectedRecord({
      id: "",
      entityId: entity.id,
      entityKey: entity.key,
      status: "not_started",
      licenseNumber: "",
      activityType: "",
      transactionNumber: "",
      submittedDate: "",
      issuedDate: "",
      expiryDate: "",
      nextStep: "",
      responsiblePerson: "",
      notes: "",
      portalUrl: "",
      documents: [],
      transactions: [],
    });
    setDialogOpen(true);
  };

  const handleFieldChange = (field: string, value: string) => {
    if (!selectedRecord) return;
    setSelectedRecord((prev) => prev ? { ...prev, [field]: value } : null);
  };

  const handleAddDocument = (recordId: string) => {
    setDocumentRecordId(recordId);
    setDocumentDialogOpen(true);
  };

  const entityKeys = ["tpt", "cst", "spl"];

  const entityIcons: Record<string, React.ReactNode> = {
    tpt: <Truck className="size-5" />,
    cst: <Globe className="size-5" />,
    spl: <MapPin className="size-5" />,
  };

  return (
    <DashboardLayout locale={locale} title={t("compliance.title")}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("compliance.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t("compliance.subtitle")}
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : (
          <div className="space-y-6">
            {entityKeys.map((key) => {
              const entity = getEntityByKey(key);
              const record = getRecordForEntity(key);
              const fields = entityFields[key] ?? [];

              return (
                <Card key={key}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {entityIcons[key] ?? <FileText className="size-5 text-gray-500" />}
                        <div>
                          <CardTitle>
                            {t(`compliance.${key}`)}
                          </CardTitle>
                          {entity && (
                            <CardDescription>{entity.description}</CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {record && <StatusBadge status={record.status} />}
                        {!record && entity && (
                          <Button size="sm" onClick={() => handleAddRecord(entity)}>
                            <Plus className="size-4" />
                            {t("common.add")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {record ? (
                      <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {fields.includes("licenseNumber") && (
                            <div>
                              <Label>{t("compliance.licenseNumber")}</Label>
                              <p className="mt-1 text-sm text-gray-900">
                                {record.licenseNumber || "—"}
                              </p>
                            </div>
                          )}
                          {fields.includes("activityType") && (
                            <div>
                              <Label>{t("compliance.activityType")}</Label>
                              <p className="mt-1 text-sm text-gray-900">
                                {record.activityType || "—"}
                              </p>
                            </div>
                          )}
                          {fields.includes("transactionNumber") && (
                            <div>
                              <Label>{t("compliance.transactionNumber")}</Label>
                              <p className="mt-1 text-sm text-gray-900">
                                {record.transactionNumber || "—"}
                              </p>
                            </div>
                          )}
                          {fields.includes("submittedDate") && (
                            <div>
                              <Label>{t("compliance.submittedDate")}</Label>
                              <p className="mt-1 text-sm text-gray-900">
                                {record.submittedDate || "—"}
                              </p>
                            </div>
                          )}
                          {fields.includes("issuedDate") && (
                            <div>
                              <Label>{t("compliance.issuedDate")}</Label>
                              <p className="mt-1 text-sm text-gray-900">
                                {record.issuedDate || "—"}
                              </p>
                            </div>
                          )}
                          {fields.includes("expiryDate") && (
                            <div>
                              <Label>{t("compliance.expiryDate")}</Label>
                              <p className="mt-1 text-sm text-gray-900">
                                {record.expiryDate || "—"}
                              </p>
                            </div>
                          )}
                          {fields.includes("accountStatus") && (
                            <div>
                              <Label>{t("compliance.accountStatus")}</Label>
                              <p className="mt-1 text-sm text-gray-900">
                                {record.accountStatus || "—"}
                              </p>
                            </div>
                          )}
                          {fields.includes("apiStatus") && (
                            <div>
                              <Label>{t("compliance.apiStatus")}</Label>
                              <p className="mt-1 text-sm text-gray-900">
                                {record.apiStatus || "—"}
                              </p>
                            </div>
                          )}
                          {fields.includes("testEnv") && (
                            <div>
                              <Label>{t("compliance.testEnv")}</Label>
                              <p className="mt-1 text-sm text-gray-900">
                                {record.testEnv || "—"}
                              </p>
                            </div>
                          )}
                          {fields.includes("prodEnv") && (
                            <div>
                              <Label>{t("compliance.prodEnv")}</Label>
                              <p className="mt-1 text-sm text-gray-900">
                                {record.prodEnv || "—"}
                              </p>
                            </div>
                          )}
                          {fields.includes("apiKey") && (
                            <div>
                              <Label>{t("compliance.apiKey")}</Label>
                              <p className="mt-1 text-sm text-gray-900">
                                {record.apiKey || "—"}
                              </p>
                            </div>
                          )}
                          {fields.includes("lastVerified") && (
                            <div>
                              <Label>{t("compliance.lastVerified")}</Label>
                              <p className="mt-1 text-sm text-gray-900">
                                {record.lastVerified || "—"}
                              </p>
                            </div>
                          )}
                          {fields.includes("nationalAddress") && (
                            <div>
                              <Label>{t("compliance.nationalAddress")}</Label>
                              <p className="mt-1 text-sm text-gray-900">
                                {record.nationalAddress || "—"}
                              </p>
                            </div>
                          )}
                          {fields.includes("shortAddress") && (
                            <div>
                              <Label>{t("compliance.shortAddress")}</Label>
                              <p className="mt-1 text-sm text-gray-900">
                                {record.shortAddress || "—"}
                              </p>
                            </div>
                          )}
                          {fields.includes("readiness") && (
                            <div>
                              <Label>{t("compliance.readiness")}</Label>
                              <div className="mt-1">
                                <StatusBadge status={record.nextStep || "not_started"} />
                              </div>
                            </div>
                          )}
                          {fields.includes("nextStep") && (
                            <div>
                              <Label>{t("compliance.nextStep")}</Label>
                              <p className="mt-1 text-sm text-gray-900">
                                {record.nextStep || "—"}
                              </p>
                            </div>
                          )}
                          {fields.includes("responsiblePerson") && (
                            <div>
                              <Label>{t("compliance.responsiblePerson")}</Label>
                              <p className="mt-1 text-sm text-gray-900">
                                {record.responsiblePerson || "—"}
                              </p>
                            </div>
                          )}
                        </div>

                        {record.portalUrl && (
                          <a
                            href={record.portalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                          >
                            <ExternalLink className="size-3.5" />
                            {t("compliance.portalUrl")}
                          </a>
                        )}

                        <div className="flex items-center gap-2 pt-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(record)}>
                            {t("common.edit")}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleAddDocument(record.id)}>
                            <Upload className="size-3.5" />
                            {t("compliance.documents")}
                          </Button>
                        </div>

                        {record.documents && record.documents.length > 0 && (
                          <div>
                            <h4 className="mb-2 text-sm font-medium text-gray-700">
                              {t("compliance.documents")}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {record.documents.map((doc) => (
                                <Badge key={doc.id} variant="secondary">
                                  {doc.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {record.transactions && record.transactions.length > 0 && (
                          <div>
                            <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                              <History className="size-3.5" />
                              {t("common.actions")}
                            </h4>
                            <div className="space-y-2">
                              {record.transactions.map((tx) => (
                                <div
                                  key={tx.id}
                                  className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3"
                                >
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      {tx.action}
                                    </p>
                                    {tx.notes && (
                                      <p className="mt-0.5 text-xs text-gray-500">
                                        {tx.notes}
                                      </p>
                                    )}
                                  </div>
                                  <span className="shrink-0 text-xs text-gray-400">
                                    {tx.date}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <EmptyState
                        icon={
                          <FileText className="size-8 text-gray-400" />
                        }
                        title={t("common.noData")}
                        description={
                          entity
                            ? t("compliance.subtitle")
                            : undefined
                        }
                      />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRecord?.id ? t("common.edit") : t("common.add")}
            </DialogTitle>
            <DialogDescription>
              {selectedRecord?.entityKey && t(`compliance.${selectedRecord.entityKey}`)}
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t("compliance.status")}</Label>
                <Select
                  value={selectedRecord.status}
                  onChange={(e) => handleFieldChange("status", e.target.value)}
                  options={statusOptions.map((o) => ({
                    value: o.value,
                    label: t(o.label),
                  }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("compliance.transactionNumber")}</Label>
                <Input
                  value={selectedRecord.transactionNumber}
                  onChange={(e) => handleFieldChange("transactionNumber", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("compliance.nextStep")}</Label>
                <Input
                  value={selectedRecord.nextStep}
                  onChange={(e) => handleFieldChange("nextStep", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("compliance.responsiblePerson")}</Label>
                <Input
                  value={selectedRecord.responsiblePerson}
                  onChange={(e) => handleFieldChange("responsiblePerson", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("compliance.licenseNumber")}</Label>
                <Input
                  value={selectedRecord.licenseNumber}
                  onChange={(e) => handleFieldChange("licenseNumber", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("compliance.activityType")}</Label>
                <Input
                  value={selectedRecord.activityType}
                  onChange={(e) => handleFieldChange("activityType", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("compliance.submittedDate")}</Label>
                <Input
                  type="date"
                  value={selectedRecord.submittedDate}
                  onChange={(e) => handleFieldChange("submittedDate", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("compliance.issuedDate")}</Label>
                <Input
                  type="date"
                  value={selectedRecord.issuedDate}
                  onChange={(e) => handleFieldChange("issuedDate", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("compliance.expiryDate")}</Label>
                <Input
                  type="date"
                  value={selectedRecord.expiryDate}
                  onChange={(e) => handleFieldChange("expiryDate", e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{t("compliance.notes")}</Label>
                <textarea
                  rows={3}
                  value={selectedRecord.notes}
                  onChange={(e) => handleFieldChange("notes", e.target.value)}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSaveRecord} loading={saving}>
              <Save className="size-4" />
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("compliance.documents")}</DialogTitle>
            <DialogDescription>
              Upload documents
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex size-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Upload className="size-8" />
            </div>
            <p className="text-sm text-gray-500">Upload documents</p>
            <Button variant="outline">
              <Upload className="size-4" />
              Upload
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocumentDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
