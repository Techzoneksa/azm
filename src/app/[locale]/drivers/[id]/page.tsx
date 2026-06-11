"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Pencil, Plus, FileText, AlertCircle, Loader2 } from "lucide-react";

interface Driver {
  _id: string;
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
  readinessStatus: string;
  notes: string;
}

interface Document {
  _id: string;
  type: string;
  number: string;
  issuedDate: string;
  expiryDate: string;
  status: string;
  notes?: string;
}

export default function DriverDetailPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split("/").pop() ?? "";

  const [driver, setDriver] = useState<Driver | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [editDocDialogOpen, setEditDocDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [docForm, setDocForm] = useState({
    type: "", number: "", issuedDate: "", expiryDate: "", notes: "", status: "valid",
  });

  const fetchDriver = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [driverRes, docsRes] = await Promise.all([
        fetch(`/api/drivers/${id}`),
        fetch(`/api/drivers/${id}/documents`),
      ]);
      if (!driverRes.ok) throw new Error("Failed to fetch driver");
      const driverData = await driverRes.json();
      setDriver(driverData.driver ?? driverData);
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData.documents ?? docsData.data ?? []);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDriver();
  }, [fetchDriver]);

  const resetDocForm = () => {
    setDocForm({ type: "", number: "", issuedDate: "", expiryDate: "", notes: "", status: "valid" });
  };

  const handleAddDocument = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/drivers/${id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docForm),
      });
      if (!res.ok) throw new Error("Failed to add document");
      setDocDialogOpen(false);
      resetDocForm();
      fetchDriver();
    } catch {
      //
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateDocument = async () => {
    if (!selectedDoc) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/drivers/${id}/documents/${selectedDoc._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docForm),
      });
      if (!res.ok) throw new Error("Failed to update document");
      setEditDocDialogOpen(false);
      setSelectedDoc(null);
      resetDocForm();
      fetchDriver();
    } catch {
      //
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDoc = (doc: Document) => {
    setSelectedDoc(doc);
    setDocForm({
      type: doc.type, number: doc.number, issuedDate: doc.issuedDate,
      expiryDate: doc.expiryDate, notes: doc.notes ?? "", status: doc.status,
    });
    setEditDocDialogOpen(true);
  };

  const docTypeOptions = [
    { value: "national_id", label: t("document.national_id") },
    { value: "driving_license", label: t("document.driving_license") },
    { value: "vehicle_registration", label: t("document.vehicle_registration") },
    { value: "insurance", label: t("document.insurance") },
    { value: "personal_photo", label: t("document.personal_photo") },
    { value: "additional", label: t("document.additional") },
  ];

  const docStatusOptions = [
    { value: "valid", label: t("status.verified") ?? "Valid" },
    { value: "expired", label: t("status.expired") },
    { value: "expiring_soon", label: t("status.expiring_soon") },
    { value: "invalid", label: t("status.rejected") ?? "Invalid" },
  ];

  if (loading) {
    return (
      <DashboardLayout locale={locale} title={t("drivers.details")}>
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

  if (error || !driver) {
    return (
      <DashboardLayout locale={locale} title={t("drivers.details")}>
        <EmptyState
          icon={<AlertCircle className="size-8" />}
          title={t("common.error")}
          action={{ label: t("errors.retry"), onClick: fetchDriver }}
        />
      </DashboardLayout>
    );
  }

  const infoRows = [
    { label: t("drivers.fullName"), value: driver.fullName },
    { label: t("drivers.phone"), value: driver.phone },
    { label: t("drivers.email"), value: driver.email },
    { label: t("drivers.nationalId"), value: driver.nationalId },
    { label: t("drivers.nationality"), value: driver.nationality },
    { label: t("drivers.dateOfBirth"), value: driver.dateOfBirth },
    { label: t("drivers.city"), value: driver.city },
    { label: t("drivers.district"), value: driver.district },
    { label: t("drivers.relationType"), value: driver.relationType },
    { label: t("drivers.joinDate"), value: driver.joinDate },
    { label: t("drivers.experience"), value: driver.experience },
    { label: t("drivers.previousCompanies"), value: driver.previousCompanies },
    { label: t("drivers.vehicleType"), value: driver.vehicleType },
    { label: t("drivers.plateNumber"), value: driver.plateNumber },
  ];

  return (
    <DashboardLayout locale={locale} title={t("drivers.details")}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/drivers")}>
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("drivers.details")}</h1>
            </div>
          </div>
          <Button onClick={() => router.push(`/drivers/${id}/edit`)}>
            <Pencil className="size-4" />
            {t("common.edit")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{driver.fullName}</CardTitle>
                <CardDescription>{t("drivers.nationalId")}: {driver.nationalId}</CardDescription>
              </div>
              <div className="flex gap-2">
                <StatusBadge status={driver.status} />
                <StatusBadge status={driver.readinessStatus} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {infoRows.map((row) =>
                row.value ? (
                  <div key={row.label}>
                    <dt className="text-xs font-medium text-gray-500">{row.label}</dt>
                    <dd className="mt-0.5 text-sm font-medium text-gray-900">{row.value}</dd>
                  </div>
                ) : null
              )}
            </div>
            {driver.notes && (
              <div className="mt-4">
                <dt className="text-xs font-medium text-gray-500">{t("drivers.notes")}</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{driver.notes}</dd>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("drivers.documents")}</CardTitle>
              <Button onClick={() => { resetDocForm(); setDocDialogOpen(true); }}>
                <Plus className="size-4" />
                {t("common.add")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <EmptyState
                icon={<FileText className="size-8" />}
                title={t("common.noData")}
                action={{ label: t("common.add"), onClick: () => { resetDocForm(); setDocDialogOpen(true); } }}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("document.type")}</TableHead>
                      <TableHead>{t("document.number")}</TableHead>
                      <TableHead>{t("document.expiryDate")}</TableHead>
                      <TableHead>{t("document.verificationStatus")}</TableHead>
                      <TableHead className="text-end">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc._id}>
                        <TableCell>{t(`document.${doc.type}`)}</TableCell>
                        <TableCell>{doc.number}</TableCell>
                        <TableCell>{doc.expiryDate}</TableCell>
                        <TableCell>
                          <StatusBadge status={doc.status} />
                        </TableCell>
                        <TableCell className="text-end">
                          <Button variant="ghost" size="icon" onClick={() => openEditDoc(doc)}>
                            <Pencil className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={docDialogOpen} onOpenChange={setDocDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("common.add")} {t("drivers.documents")}</DialogTitle>
              <DialogDescription>{t("common.submit")}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>{t("document.type")}</Label>
                <Select
                  value={docForm.type}
                  onChange={(e) => setDocForm((p) => ({ ...p, type: e.target.value }))}
                  options={docTypeOptions}
                  placeholder={t("common.select") ?? "Select..."}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("document.number")}</Label>
                <Input
                  value={docForm.number}
                  onChange={(e) => setDocForm((p) => ({ ...p, number: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("document.issuedDate")}</Label>
                  <Input
                    type="date"
                    value={docForm.issuedDate}
                    onChange={(e) => setDocForm((p) => ({ ...p, issuedDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("document.expiryDate")}</Label>
                  <Input
                    type="date"
                    value={docForm.expiryDate}
                    onChange={(e) => setDocForm((p) => ({ ...p, expiryDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("document.notes")}</Label>
                <textarea
                  value={docForm.notes}
                  onChange={(e) => setDocForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDocDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleAddDocument} loading={submitting}>
                {t("common.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={editDocDialogOpen} onOpenChange={setEditDocDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("common.edit")} {t("drivers.documents")}</DialogTitle>
              <DialogDescription>{t("common.submit")}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>{t("document.type")}</Label>
                <Select
                  value={docForm.type}
                  onChange={(e) => setDocForm((p) => ({ ...p, type: e.target.value }))}
                  options={docTypeOptions}
                  placeholder={t("common.select") ?? "Select..."}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("document.number")}</Label>
                <Input
                  value={docForm.number}
                  onChange={(e) => setDocForm((p) => ({ ...p, number: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("document.issuedDate")}</Label>
                  <Input
                    type="date"
                    value={docForm.issuedDate}
                    onChange={(e) => setDocForm((p) => ({ ...p, issuedDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("document.expiryDate")}</Label>
                  <Input
                    type="date"
                    value={docForm.expiryDate}
                    onChange={(e) => setDocForm((p) => ({ ...p, expiryDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("document.verificationStatus")}</Label>
                <Select
                  value={docForm.status}
                  onChange={(e) => setDocForm((p) => ({ ...p, status: e.target.value }))}
                  options={docStatusOptions}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("document.notes")}</Label>
                <textarea
                  value={docForm.notes}
                  onChange={(e) => setDocForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDocDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleUpdateDocument} loading={submitting}>
                {t("common.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
