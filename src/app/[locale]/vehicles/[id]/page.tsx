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
import { ArrowLeft, Pencil, Plus, FileText, AlertCircle } from "lucide-react";

interface Vehicle {
  _id: string;
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
  assignedDriver?: { _id: string; fullName: string };
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

export default function VehicleDetailPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split("/").pop() ?? "";

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
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

  const fetchVehicle = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [vehicleRes, docsRes] = await Promise.all([
        fetch(`/api/vehicles/${id}`),
        fetch(`/api/vehicles/${id}/documents`),
      ]);
      if (!vehicleRes.ok) throw new Error("Failed to fetch vehicle");
      const vehicleData = await vehicleRes.json();
      setVehicle(vehicleData.vehicle ?? vehicleData);
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
    fetchVehicle();
  }, [fetchVehicle]);

  const resetDocForm = () => {
    setDocForm({ type: "", number: "", issuedDate: "", expiryDate: "", notes: "", status: "valid" });
  };

  const handleAddDocument = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/vehicles/${id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docForm),
      });
      if (!res.ok) throw new Error("Failed to add document");
      setDocDialogOpen(false);
      resetDocForm();
      fetchVehicle();
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
      const res = await fetch(`/api/vehicles/${id}/documents/${selectedDoc._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docForm),
      });
      if (!res.ok) throw new Error("Failed to update document");
      setEditDocDialogOpen(false);
      setSelectedDoc(null);
      resetDocForm();
      fetchVehicle();
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
    { value: "vehicle_registration", label: t("document.vehicle_registration") },
    { value: "insurance", label: t("document.insurance") },
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
      <DashboardLayout locale={locale} title={t("vehicles.details")}>
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

  if (error || !vehicle) {
    return (
      <DashboardLayout locale={locale} title={t("vehicles.details")}>
        <EmptyState
          icon={<AlertCircle className="size-8" />}
          title={t("common.error")}
          action={{ label: t("errors.retry"), onClick: fetchVehicle }}
        />
      </DashboardLayout>
    );
  }

  const infoRows = [
    { label: t("vehicles.vehicleType"), value: vehicle.vehicleType },
    { label: t("vehicles.brand"), value: vehicle.brand },
    { label: t("vehicles.model"), value: vehicle.model },
    { label: t("vehicles.year"), value: vehicle.year },
    { label: t("vehicles.color"), value: vehicle.color },
    { label: t("vehicles.plateNumber"), value: vehicle.plateNumber },
    { label: t("vehicles.serialNumber"), value: vehicle.serialNumber },
    { label: t("vehicles.ownerName"), value: vehicle.ownerName },
    { label: t("vehicles.ownerNationalId"), value: vehicle.ownerNationalId },
    { label: t("vehicles.ownershipType"), value: vehicle.ownershipType },
    { label: t("vehicles.registrationNumber"), value: vehicle.registrationNumber },
    { label: t("vehicles.insuranceNumber"), value: vehicle.insuranceNumber },
    { label: t("vehicles.registrationExpiry"), value: vehicle.registrationExpiry },
    { label: t("vehicles.insuranceExpiry"), value: vehicle.insuranceExpiry },
    { label: t("vehicles.driver"), value: vehicle.assignedDriver?.fullName ?? "-" },
  ];

  return (
    <DashboardLayout locale={locale} title={t("vehicles.details")}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/vehicles")}>
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("vehicles.details")}</h1>
            </div>
          </div>
          <Button onClick={() => router.push(`/vehicles/${id}/edit`)}>
            <Pencil className="size-4" />
            {t("common.edit")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{vehicle.brand} {vehicle.model} - {vehicle.plateNumber}</CardTitle>
                <CardDescription>{t("vehicles.vehicleType")}: {vehicle.vehicleType}</CardDescription>
              </div>
              <div className="flex gap-2">
                <StatusBadge status={vehicle.status} />
                <StatusBadge status={vehicle.readinessStatus} />
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
            {vehicle.notes && (
              <div className="mt-4">
                <dt className="text-xs font-medium text-gray-500">{t("vehicles.notes")}</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{vehicle.notes}</dd>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("vehicles.documents")}</CardTitle>
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
              <DialogTitle>{t("common.add")} {t("vehicles.documents")}</DialogTitle>
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
              <DialogTitle>{t("common.edit")} {t("vehicles.documents")}</DialogTitle>
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
