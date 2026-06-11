"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  LayoutDashboard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Truck,
  FileWarning,
  ListChecks,
  RefreshCw,
  Activity,
  ChevronRight,
  ShieldAlert,
  CircleAlert,
} from "lucide-react";

interface UserData {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
}
interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  user?: { id: string; fullName: string; email: string };
}
interface ReadinessCategory {
  id: string;
  name: string;
  nameAr: string;
  weight: number;
  sortOrder: number;
  items: { id: string; isCompleted: boolean; name: string; nameAr: string }[];
  scores: { score: number; totalItems: number; completedItems: number }[];
}
interface ReadinessData {
  data: ReadinessCategory[];
}
interface DriverData {
  data: { readinessStatus: string }[];
  pagination?: { total: number };
}
interface VehicleData {
  data: { readinessStatus: string }[];
  pagination?: { total: number };
}
interface ComplianceData {
  data: { id: string; type: string; expiryDate: string; status: string; entity?: { name: string; nameAr: string } }[];
}
interface AuditData {
  data: AuditEntry[];
}

interface DashboardStats {
  completedActions: number;
  inProgress: number;
  missingActions: number;
  totalActions: number;
}

function CircularProgress({ value, size = 160 }: { value: number; size?: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-blue-600 transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-blue-600">{Math.round(value)}%</span>
        <span className="text-xs text-gray-500">Readiness</span>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  variant = "default",
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant?: "default" | "success" | "warning" | "destructive";
}) {
  const colorMap = {
    default: "bg-blue-50 text-blue-600",
    success: "bg-green-50 text-green-600",
    warning: "bg-amber-50 text-amber-600",
    destructive: "bg-red-50 text-red-600",
  };
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`flex size-12 items-center justify-center rounded-full ${colorMap[variant]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton variant="text" className="mb-2 h-4 w-24" />
              <Skeleton variant="text" className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton variant="text" className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} variant="text" className="h-10" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <Skeleton variant="text" className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} variant="text" className="h-12" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [user, setUser] = useState<UserData | null>(null);
  const [readinessScore, setReadinessScore] = useState(0);
  const [readinessData, setReadinessData] = useState<ReadinessCategory[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ completedActions: 0, inProgress: 0, missingActions: 0, totalActions: 0 });
  const [driverReady, setDriverReady] = useState(0);
  const [driverTotal, setDriverTotal] = useState(0);
  const [vehicleReady, setVehicleReady] = useState(0);
  const [vehicleTotal, setVehicleTotal] = useState(0);
  const [expiringDocs, setExpiringDocs] = useState<ComplianceData["data"]>([]);
  const [recentUpdates, setRecentUpdates] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [meRes, readinessRes, driversRes, vehiclesRes, complianceRes, auditRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/readiness"),
        fetch("/api/drivers?limit=1000"),
        fetch("/api/vehicles?limit=1000"),
        fetch("/api/compliance?limit=100"),
        fetch("/api/audit-logs?limit=10"),
      ]);

      if (!meRes.ok) throw new Error("Authentication failed");
      if (!readinessRes.ok) throw new Error("Failed to load readiness data");

      const meData = await meRes.json();
      setUser(meData.user);

      const readinessJson: ReadinessData = await readinessRes.json();
      const categories = readinessJson.data || [];
      setReadinessData(categories);

      let totalScore = 0;
      let completed = 0;
      const inProgress = 0;
      let missing = 0;
      let totalItems = 0;

      for (const cat of categories) {
        const items = cat.items || [];
        const catCompleted = items.filter((i) => i.isCompleted).length;
        completed += catCompleted;
        missing += items.filter((i) => !i.isCompleted).length;
        totalItems += items.length;

        const weight = cat.weight || 0;
        const catScore = items.length > 0 ? (catCompleted / items.length) * 100 : 0;
        totalScore += catScore * weight;
      }
      const overallScore = Math.round(totalScore);
      setReadinessScore(overallScore);
      setStats({ completedActions: completed, inProgress: inProgress, missingActions: missing, totalActions: totalItems });

      if (driversRes.ok) {
        const driversJson: DriverData = await driversRes.json();
        const drivers = driversJson.data || [];
        setDriverTotal(drivers.length);
        setDriverReady(drivers.filter((d) => d.readinessStatus === "READY" || d.readinessStatus === "COMPLETE").length);
      }

      if (vehiclesRes.ok) {
        const vehiclesJson: VehicleData = await vehiclesRes.json();
        const vehicles = vehiclesJson.data || [];
        setVehicleTotal(vehicles.length);
        setVehicleReady(vehicles.filter((v) => v.readinessStatus === "READY" || v.readinessStatus === "COMPLETE").length);
      }

      if (complianceRes.ok) {
        const complianceJson: ComplianceData = await complianceRes.json();
        const records = complianceJson.data || [];
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        setExpiringDocs(
          records.filter((r) => r.expiryDate && new Date(r.expiryDate) <= thirtyDaysFromNow && new Date(r.expiryDate) >= now)
        );
      }

      if (auditRes.ok) {
        const auditJson: AuditData = await auditRes.json();
        setRecentUpdates(auditJson.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (error) {
    return (
      <DashboardLayout locale={locale} title={t("dashboard.title") || "Dashboard"}>
        <EmptyState
          icon={<ShieldAlert className="size-8" />}
          title={t("common.error") || "Error loading dashboard"}
          description={error}
          action={{ label: t("common.retry") || "Retry", onClick: fetchData }}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      locale={locale}
      title={t("dashboard.title") || "Dashboard"}
      userName={user?.fullName}
    >
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t("dashboard.welcome") || "Welcome back"}{user ? `, ${user.fullName}` : ""}
              </h1>
              <p className="text-sm text-gray-500">
                {t("dashboard.overview") || "Here is your operations overview"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchData}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="size-4" />
                {t("common.refresh") || "Refresh"}
              </button>
            </div>
          </div>

          {/* Readiness Score */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-6 md:flex-row md:gap-10">
                <CircularProgress value={readinessScore} />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {t("readiness.overallScore") || "Overall Readiness Score"}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {t("readiness.basedOnCategories") || "Based on all readiness categories"}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg bg-gray-50 p-3 text-center">
                      <p className="text-xs text-gray-500">{t("readiness.completed") || "Completed"}</p>
                      <p className="mt-1 text-xl font-bold text-green-600">{stats.completedActions}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 text-center">
                      <p className="text-xs text-gray-500">{t("readiness.missing") || "Missing"}</p>
                      <p className="mt-1 text-xl font-bold text-red-600">{stats.missingActions}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 text-center">
                      <p className="text-xs text-gray-500">{t("readiness.total") || "Total Items"}</p>
                      <p className="mt-1 text-xl font-bold text-gray-900">{stats.totalActions}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 text-center">
                      <p className="text-xs text-gray-500">{t("readiness.categories") || "Categories"}</p>
                      <p className="mt-1 text-xl font-bold text-blue-600">{readinessData.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title={t("dashboard.completedActions") || "Completed Actions"}
              value={stats.completedActions}
              icon={<CheckCircle2 className="size-6" />}
              variant="success"
            />
            <StatCard
              title={t("dashboard.inProgress") || "In Progress"}
              value={stats.inProgress}
              icon={<Clock className="size-6" />}
              variant="warning"
            />
            <StatCard
              title={t("dashboard.missingActions") || "Missing Actions"}
              value={stats.missingActions}
              icon={<AlertTriangle className="size-6" />}
              variant="destructive"
            />
            <StatCard
              title={t("dashboard.totalItems") || "Total Items"}
              value={stats.totalActions}
              icon={<LayoutDashboard className="size-6" />}
              variant="default"
            />
          </div>

          {/* Driver & Vehicle Stats + Expiring Docs */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="size-5 text-blue-600" />
                  <CardTitle>{t("dashboard.driverStats") || "Driver Readiness"}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {driverTotal > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{t("dashboard.ready") || "Ready"}</span>
                      <span className="text-sm font-medium text-green-600">{driverReady} / {driverTotal}</span>
                    </div>
                    <Progress value={(driverReady / driverTotal) * 100} variant="success" size="lg" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{t("dashboard.incomplete") || "Incomplete"}</span>
                      <span className="font-medium text-amber-600">{driverTotal - driverReady}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">{t("dashboard.noDrivers") || "No drivers registered"}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Truck className="size-5 text-blue-600" />
                  <CardTitle>{t("dashboard.vehicleStats") || "Vehicle Readiness"}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {vehicleTotal > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{t("dashboard.ready") || "Ready"}</span>
                      <span className="text-sm font-medium text-green-600">{vehicleReady} / {vehicleTotal}</span>
                    </div>
                    <Progress value={(vehicleReady / vehicleTotal) * 100} variant="success" size="lg" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{t("dashboard.incomplete") || "Incomplete"}</span>
                      <span className="font-medium text-amber-600">{vehicleTotal - vehicleReady}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">{t("dashboard.noVehicles") || "No vehicles registered"}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileWarning className="size-5 text-amber-600" />
                  <CardTitle>{t("dashboard.expiringDocuments") || "Expiring Documents"}</CardTitle>
                  <CardDescription>
                    {t("dashboard.next30Days") || "Next 30 days"}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {expiringDocs.length > 0 ? (
                  <div className="space-y-3">
                    {expiringDocs.slice(0, 5).map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {doc.entity ? (isRtl ? doc.entity.nameAr : doc.entity.name) : doc.type}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(doc.expiryDate).toLocaleDateString(isRtl ? "ar-SA" : "en-US")}
                          </p>
                        </div>
                        <Badge variant="warning" className="ms-2 shrink-0">
                          {Math.ceil((new Date(doc.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">{t("dashboard.noExpiringDocs") || "No documents expiring soon"}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Priorities & Recent Updates */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ListChecks className="size-5 text-blue-600" />
                  <CardTitle>{t("dashboard.currentPriorities") || "Current Priorities"}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {readinessData.length > 0 ? (
                  <div className="space-y-3">
                    {readinessData
                      .filter((cat) => {
                        const items = cat.items || [];
                        const completed = items.filter((i) => i.isCompleted).length;
                        return items.length > 0 && completed < items.length;
                      })
                      .slice(0, 5)
                      .map((cat) => {
                        const items = cat.items || [];
                        const completed = items.filter((i) => i.isCompleted).length;
                        const pct = Math.round((completed / items.length) * 100);
                        return (
                          <div key={cat.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                            <CircleAlert className="size-5 shrink-0 text-amber-500" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-gray-900">
                                {isRtl ? cat.nameAr : cat.name}
                              </p>
                              <div className="mt-1 flex items-center gap-2">
                                <Progress value={pct} size="sm" className="flex-1" />
                                <span className="text-xs text-gray-500">{completed}/{items.length}</span>
                              </div>
                            </div>
                            <ChevronRight className="size-4 shrink-0 text-gray-400" />
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">{t("dashboard.noPriorities") || "All categories are complete"}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="size-5 text-blue-600" />
                  <CardTitle>{t("dashboard.recentUpdates") || "Recent Updates"}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {recentUpdates.length > 0 ? (
                  <div className="space-y-2">
                    {recentUpdates.slice(0, 8).map((log) => (
                      <div key={log.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-gray-900">
                            <span className="font-medium">{log.user?.fullName || "System"}</span>
                            <span className="text-gray-500"> {log.action.toLowerCase()} </span>
                            <span className="text-gray-700">{log.entityType}</span>
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(log.createdAt).toLocaleDateString(isRtl ? "ar-SA" : "en-US", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <StatusBadge status={log.action} className="ms-2 shrink-0" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">{t("dashboard.noUpdates") || "No recent updates"}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
