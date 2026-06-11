"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ArrowLeft, Pencil, Plus, Building2, MapPin, Globe, Phone, Mail, User,
  FileText, AlertCircle, Calendar, Clock, CheckCircle2, XCircle, Shield, Link, Activity, Layers
} from "lucide-react";

interface Partner {
  _id: string;
  tradingNameAr: string;
  tradingNameEn?: string;
  legalName?: string;
  partnerType: string;
  sector?: string;
  commercialReg?: string;
  taxNumber?: string;
  city?: string;
  country?: string;
  website?: string;
  officialEmail?: string;
  primaryPhone?: string;
  contactPersonName?: string;
  contactPersonPhone?: string;
  contactPersonEmail?: string;
  status: string;
  priority: string;
  source?: string;
  notes?: string;
}

interface Contact {
  _id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
}

interface ContractSummary {
  _id: string;
  contractNumber: string;
  name: string;
  status: string;
}

export default function PartnerDetailPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split("/").slice(-2, -1)[0] ?? pathname.split("/").pop() ?? "";

  const [partner, setPartner] = useState<Partner | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState("overview");

  const tabs = [
    { key: "overview", label: t("partners.overview") },
    { key: "contacts", label: t("partners.contacts") },
    { key: "contracts", label: t("partners.contracts") },
    { key: "pickupPoints", label: t("partners.pickupPoints") },
    { key: "coverageAreas", label: t("partners.coverageAreas") },
    { key: "requirements", label: t("partners.requirements") },
    { key: "integration", label: t("partners.integration") },
    { key: "activityLog", label: t("partners.activityLog") },
  ];

  const fetchPartner = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [partnerRes, contactsRes, contractsRes] = await Promise.all([
        fetch(`/api/partners/${id}`),
        fetch(`/api/partners/${id}/contacts`).catch(() => null),
        fetch(`/api/partners/${id}/contracts`).catch(() => null),
      ]);
      if (!partnerRes.ok) throw new Error("Failed to fetch partner");
      const partnerData = await partnerRes.json();
      setPartner(partnerData.partner ?? partnerData);
      if (contactsRes?.ok) {
        const cData = await contactsRes.json();
        setContacts(cData.contacts ?? cData.data ?? []);
      }
      if (contractsRes?.ok) {
        const ctData = await contractsRes.json();
        setContracts(ctData.contracts ?? ctData.data ?? []);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPartner();
  }, [fetchPartner]);

  if (loading) {
    return (
      <DashboardLayout locale={locale} title={t("partners.details")}>
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

  if (error || !partner) {
    return (
      <DashboardLayout locale={locale} title={t("partners.details")}>
        <EmptyState
          icon={<AlertCircle className="size-8" />}
          title={t("common.error")}
          action={{ label: t("errors.retry"), onClick: fetchPartner }}
        />
      </DashboardLayout>
    );
  }

  const infoRows = [
    { label: t("partners.tradingNameAr"), value: partner.tradingNameAr },
    { label: t("partners.tradingNameEn"), value: partner.tradingNameEn },
    { label: t("partners.legalName"), value: partner.legalName },
    { label: t("partners.partnerType"), value: t(`partners.${partner.partnerType}`) },
    { label: t("partners.sector"), value: partner.sector },
    { label: t("partners.commercialReg"), value: partner.commercialReg },
    { label: t("partners.taxNumber"), value: partner.taxNumber },
    { label: t("partners.city"), value: partner.city },
    { label: t("partners.country"), value: partner.country },
    { label: t("partners.website"), value: partner.website },
    { label: t("partners.source"), value: partner.source },
  ];

  const contactInfoRows = [
    { label: t("partners.officialEmail"), value: partner.officialEmail, icon: Mail },
    { label: t("partners.primaryPhone"), value: partner.primaryPhone, icon: Phone },
    { label: t("partners.contactPersonName"), value: partner.contactPersonName, icon: User },
    { label: t("partners.contactPersonPhone"), value: partner.contactPersonPhone, icon: Phone },
    { label: t("partners.contactPersonEmail"), value: partner.contactPersonEmail, icon: Mail },
  ];

  return (
    <DashboardLayout locale={locale} title={t("partners.details")}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/partners")}>
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("partners.details")}</h1>
            </div>
          </div>
          <Button onClick={() => router.push(`/partners/${id}/edit`)}>
            <Pencil className="size-4" />
            {t("common.edit")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{partner.tradingNameAr}</CardTitle>
                <CardDescription>{partner.legalName}</CardDescription>
              </div>
              <div className="flex gap-2">
                <StatusBadge status={partner.status} />
                <Badge variant="outline">{t(`partners.${partner.priority}`)}</Badge>
              </div>
            </div>
          </CardHeader>
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
                <CardTitle>{t("partners.basicInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {infoRows.map((row) =>
                  row.value ? (
                    <div key={row.label}>
                      <dt className="text-xs font-medium text-gray-500">{row.label}</dt>
                      <dd className="mt-0.5 text-sm font-medium text-gray-900">{row.value}</dd>
                    </div>
                  ) : null
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("partners.contactInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contactInfoRows.map((row) =>
                  row.value ? (
                    <div key={row.label} className="flex items-center gap-3">
                      <row.icon className="size-4 text-gray-400" />
                      <div>
                        <dt className="text-xs font-medium text-gray-500">{row.label}</dt>
                        <dd className="text-sm text-gray-900">{row.value}</dd>
                      </div>
                    </div>
                  ) : null
                )}
              </CardContent>
            </Card>

            {partner.notes && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>{t("partners.notes")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{partner.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {tab === "contacts" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("partners.contacts")}</CardTitle>
                <Button>
                  <Plus className="size-4" />
                  {t("common.add")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <EmptyState icon={<User className="size-8" />} title={t("common.noData")} />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("partners.contactPersonName")}</TableHead>
                        <TableHead>{t("partners.contactPersonPhone")}</TableHead>
                        <TableHead>{t("partners.contactPersonEmail")}</TableHead>
                        <TableHead>{t("partners.contactRole")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map((c) => (
                        <TableRow key={c._id}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell>{c.phone}</TableCell>
                          <TableCell>{c.email}</TableCell>
                          <TableCell>{c.role}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {tab === "contracts" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("partners.contracts")}</CardTitle>
                <Button onClick={() => router.push(`/contracts/new?partnerId=${id}`)}>
                  <Plus className="size-4" />
                  {t("contracts.new")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {contracts.length === 0 ? (
                <EmptyState icon={<FileText className="size-8" />} title={t("common.noData")} />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("contracts.contractNumber")}</TableHead>
                        <TableHead>{t("contracts.name")}</TableHead>
                        <TableHead>{t("common.status")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contracts.map((c) => (
                        <TableRow
                          key={c._id}
                          className="cursor-pointer"
                          onClick={() => router.push(`/contracts/${c._id}`)}
                        >
                          <TableCell className="font-medium">{c.contractNumber}</TableCell>
                          <TableCell>{c.name}</TableCell>
                          <TableCell>
                            <StatusBadge status={c.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {tab === "pickupPoints" && (
          <EmptyState icon={<MapPin className="size-8" />} title={t("common.noData")} />
        )}

        {tab === "coverageAreas" && (
          <EmptyState icon={<Layers className="size-8" />} title={t("common.noData")} />
        )}

        {tab === "requirements" && (
          <EmptyState icon={<CheckCircle2 className="size-8" />} title={t("common.noData")} />
        )}

        {tab === "integration" && (
          <EmptyState icon={<Shield className="size-8" />} title={t("common.noData")} />
        )}

        {tab === "activityLog" && (
          <EmptyState icon={<Activity className="size-8" />} title={t("common.noData")} />
        )}
      </div>
    </DashboardLayout>
  );
}
