"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import {
  ExternalLink,
  Globe,
  FileText,
  ArrowRight,
  Link as LinkIcon,
} from "lucide-react";

interface EntityLink {
  id: string;
  entityId: string;
  entityKey: string;
  title: string;
  url: string;
  type: "website" | "eservices" | "licenses";
}

interface Entity {
  id: string;
  key: string;
  name: string;
  description: string;
}

interface ComplianceSummary {
  entityKey: string;
  status: string;
  transactionNumber: string;
  nextStep: string;
  updatedAt: string;
}

const entityKeys = ["tpt", "spl", "cst", "mci", "qiwa", "mudad", "insurance"];

const entityIconMap: Record<string, React.ReactNode> = {
  tpt: <TruckIcon className="size-5" />,
  spl: <MapPinIcon className="size-5" />,
  cst: <Globe className="size-5" />,
  mci: <BuildingIcon className="size-5" />,
  qiwa: <UsersIcon className="size-5" />,
  mudad: <ReceiptIcon className="size-5" />,
  insurance: <ShieldIcon className="size-5" />,
};

export default function OfficialLinksPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [links, setLinks] = useState<EntityLink[]>([]);
  const [complianceMap, setComplianceMap] = useState<Record<string, ComplianceSummary>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [entitiesRes, linksRes, complianceRes] = await Promise.all([
        fetch("/api/entities"),
        fetch("/api/links"),
        fetch("/api/compliance"),
      ]);
      if (entitiesRes.ok) {
        const data = await entitiesRes.json();
        setEntities(Array.isArray(data) ? data : []);
      }
      if (linksRes.ok) {
        const data = await linksRes.json();
        setLinks(Array.isArray(data) ? data : []);
      }
      if (complianceRes.ok) {
        const data = await complianceRes.json();
        const map: Record<string, ComplianceSummary> = {};
        if (Array.isArray(data)) {
          data.forEach((item: ComplianceSummary) => {
            map[item.entityKey] = item;
          });
        }
        setComplianceMap(map);
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

  const getLinksForEntity = (entityKey: string) =>
    links.filter((l) => l.entityKey === entityKey);

  const getLinkByType = (entityKey: string, type: EntityLink["type"]) =>
    links.find((l) => l.entityKey === entityKey && l.type === type);

  return (
    <DashboardLayout locale={locale} title={t("officialLinks.title")}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("officialLinks.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t("officialLinks.subtitle")}
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-52 w-full rounded-xl" />
            ))}
          </div>
        ) : entities.length === 0 && links.length === 0 ? (
          <EmptyState
            icon={<LinkIcon className="size-8" />}
            title={t("common.noData")}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entityKeys.map((key) => {
              const entity = getEntityByKey(key);
              const entityLinks = getLinksForEntity(key);
              const compliance = complianceMap[key];

              return (
                <Card
                  key={key}
                  className="transition-shadow hover:shadow-md"
                >
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        {entityIconMap[key] ?? <Globe className="size-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base">
                          {entity?.name ?? t(`officialLinks.${key}`)}
                        </CardTitle>
                        {entity?.description && (
                          <CardDescription className="mt-0.5 line-clamp-2">
                            {entity.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {getLinkByType(key, "website") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const link = getLinkByType(key, "website");
                              if (link?.url) window.open(link.url, "_blank", "noopener,noreferrer");
                            }}
                          >
                            <Globe className="size-3.5" />
                            {t("officialLinks.visitSite")}
                            <ExternalLink className="size-3" />
                          </Button>
                        )}
                        {getLinkByType(key, "eservices") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const link = getLinkByType(key, "eservices");
                              if (link?.url) window.open(link.url, "_blank", "noopener,noreferrer");
                            }}
                          >
                            <FileText className="size-3.5" />
                            {t("officialLinks.electronicServices")}
                            <ExternalLink className="size-3" />
                          </Button>
                        )}
                        {getLinkByType(key, "licenses") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const link = getLinkByType(key, "licenses");
                              if (link?.url) window.open(link.url, "_blank", "noopener,noreferrer");
                            }}
                          >
                            <FileText className="size-3.5" />
                            {t("officialLinks.licenses")}
                            <ExternalLink className="size-3" />
                          </Button>
                        )}
                      </div>

                      {compliance && (
                        <div className="space-y-1.5 rounded-lg bg-gray-50 p-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">
                              {t("officialLinks.internalStatus")}
                            </span>
                            <StatusBadgeInline status={compliance.status} />
                          </div>
                          {compliance.transactionNumber && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">
                                {t("officialLinks.transactionNo")}
                              </span>
                              <span className="font-medium text-gray-900">
                                {compliance.transactionNumber}
                              </span>
                            </div>
                          )}
                          {compliance.updatedAt && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">
                                {t("officialLinks.lastUpdated")}
                              </span>
                              <span className="text-gray-700">
                                {compliance.updatedAt}
                              </span>
                            </div>
                          )}
                          {compliance.nextStep && (
                            <div className="flex items-center gap-1 pt-1 text-blue-600">
                              <ArrowRight className="size-3" />
                              <span>{compliance.nextStep}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {entityLinks.length === 0 && !compliance && (
                        <p className="text-xs text-gray-400">
                          {t("common.noData")}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatusBadgeInline({ status }: { status: string }) {
  const variantMap: Record<string, "success" | "warning" | "destructive" | "default" | "secondary"> = {
    approved: "success",
    completed: "success",
    active: "success",
    compliant: "success",
    valid: "success",
    in_progress: "default",
    pending: "warning",
    submitted: "default",
    warning: "warning",
    rejected: "destructive",
    expired: "destructive",
    non_compliant: "destructive",
    inactive: "secondary",
    draft: "secondary",
    not_started: "secondary",
  };

  const variant = variantMap[status] ?? "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
      <path d="M15 17a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
      <path d="M5 17h-2v-4m0 -4h10v8h-6" />
      <path d="M14 17h2v-6h2l3 3v3h-2" />
      <path d="M3 9h4" />
      <path d="M3 5h12v4" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a8 8 0 0 0 -8 8c0 6 8 12 8 12s8 -6 8 -12a8 8 0 0 0 -8 -8" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <line x1="9" y1="6" x2="9" y2="6.01" />
      <line x1="15" y1="6" x2="15" y2="6.01" />
      <line x1="9" y1="10" x2="9" y2="10.01" />
      <line x1="15" y1="10" x2="15" y2="10.01" />
      <line x1="9" y1="14" x2="9" y2="14.01" />
      <line x1="15" y1="14" x2="15" y2="14.01" />
      <path d="M9 18h6v4h-6z" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0 -4 -4h-4a4 4 0 0 0 -4 4v2" />
      <circle cx="8" cy="7" r="4" />
      <path d="M20 8v6" />
      <path d="M23 11h-6" />
    </svg>
  );
}

function ReceiptIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1v-20l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" />
      <line x1="8" y1="7" x2="16" y2="7" />
      <line x1="8" y1="11" x2="16" y2="11" />
      <line x1="8" y1="15" x2="12" y2="15" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l7 4v5c0 5.5 -3.5 9 -7 10 -3.5 -1 -7 -4.5 -7 -10v-5l7 -4" />
      <line x1="9" y1="12" x2="11" y2="14" />
      <line x1="15" y1="10" x2="11" y2="14" />
    </svg>
  );
}
