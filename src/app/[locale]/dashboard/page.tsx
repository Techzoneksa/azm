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
  Boxes,
  TrendingUp,
  UserCheck,
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
  const gradientId = "circularGradient";
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F39818" />
            <stop offset="100%" stopColor="#F8C070" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-brand-dark-blue">{Math.round(value)}%</span>
        <span className="text-xs text-gray-500 font-medium">Readiness</span>
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
  const gradientMap = {
    default: "from-brand-dark-blue to-brand-blue-gray",
    success: "from-brand-success to-emerald-400",
    warning: "from-brand-warning to-amber-300",
    destructive: "from-brand-danger to-red-400",
  };
  const bgMap = {
    default: "bg-brand-dark-blue/10 text-brand-dark-blue",
    success: "bg-brand-success/10 text-brand-success",
    warning: "bg-brand-warning/10 text-brand-warning",
    destructive: "bg-brand-danger/10 text-brand-danger",
  };
  return (
    <Card className="animate-fade-in">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`flex size-12 items-center justify-center rounded-xl ${bgMap[variant]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Skeleton variant="rectangular" className="h-32 w-full" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
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
                  <Skeleton key={i} variant="rectangular" className="h-12 w-full" />
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
                <Skeleton key={i} variant="rectangular" className="h-16 w-full" />
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
      setStats({ completedActions: completed, inProgress: 0, missingActions: missing, totalActions: totalItems });

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
          {/* Hero Welcome Section */}
          <Card className="overflow-hidden border-0 animate-fade-in">
            <div className="gradient-brand p-6 md:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white">
                    {t("dashboard.welcome") || "Welcome back"}{user ? `, ${user.fullName}` : ""}
                  </h1>
                  <p className="mt-1 text-white/70 text-sm">
                    {t("dashboard.overview") || "Here is your operations overview"}
                  </p>
                </div>
                <button
                  onClick={fetchData}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/25"
                >
                  <RefreshCw className="size-4" />
                  {t("common.refresh") || "Refresh"}
                </button>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-white/10 p-3 text-center backdrop-blur-sm">
                  <p className="text-xs text-white/70">{t("readiness.completed") || "Completed"}</p>
                  <p className="mt-1 text-xl font-bold text-white">{stats.completedActions}</p>
                </div>
                <div className="rounded-xl bg-white/10 p-3 text-center backdrop-blur-sm">
                  <p className="text-xs text-white/70">{t("readiness.missing") || "Missing"}</p>
                  <p className="mt-1 text-xl font-bold text-amber-300">{stats.missingActions}</p>
                </div>
                <div className="rounded-xl bg-white/10 p-3 text-center backdrop-blur-sm">
                  <p className="text-xs text-white/70">{t("readiness.total") || "Total Items"}</p>
                  <p className="mt-1 text-xl font-bold text-white">{stats.totalActions}</p>
                </div>
                <div className="rounded-xl bg-white/10 p-3 text-center backdrop-blur-sm">
                  <p className="text-xs text-white/70">{t("readiness.categories") || "Categories"}</p>
                  <p className="mt-1 text-xl font-bold text-white">{readinessData.length}</p>
                </div>
              </div>
            </div>
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
              title={t("dashboard.missingActions") || "Missing Actions"}
              value={stats.missingActions}
              icon={<AlertTriangle className="size-6" />}
              variant="destructive"
            />
            <StatCard
              title={t("dashboard.totalItems") || "Total Items"}
              value={stats.totalActions}
              icon={<Boxes className="size-6" />}
              variant="default"
            />
            <StatCard
              title={t("readiness.overallScore") || "Readiness"}
              value={readinessScore}
              icon={<TrendingUp className="size-6" />}
              variant={readinessScore >= 80 ? "success" : readinessScore >= 50 ? "warning" : "destructive"}
            />
          </div>

          {/* Readiness + Driver/Vehicle + Expiring Docs */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Readiness Score */}
            <Card className="animate-slide-in">
              <CardContent className="p-6">
                <div className="flex flex-col items-center gap-4">
                  <CircularProgress value={readinessScore} />
                  <div className="text-center">
                    <h3 className="text-base font-semibold text-gray-900">
                      {t("readiness.overallScore") || "Overall Readiness Score"}
                    </h3>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {t("readiness.basedOnCategories") || "Based on all readiness categories"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Driver & Vehicle Readiness */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-brand-success/10 text-brand-success">
                      <Users className="size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{t("dashboard.driverStats") || "Driver Readiness"}</CardTitle>
                    </div>
                  </div>
                  {driverTotal > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{t("dashboard.ready") || "Ready"}</span>
                        <span className="font-semibold text-gray-900">{driverReady} / {driverTotal}</span>
                      </div>
                      <Progress value={(driverReady / driverTotal) * 100} variant="gradient" size="md" />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">{t("dashboard.incomplete") || "Incomplete"}</span>
                        <span className="font-medium text-amber-600">{driverTotal - driverReady}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">{t("dashboard.noDrivers") || "No drivers registered"}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-brand-info/10 text-brand-info">
                      <Truck className="size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{t("dashboard.vehicleStats") || "Vehicle Readiness"}</CardTitle>
                    </div>
                  </div>
                  {vehicleTotal > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{t("dashboard.ready") || "Ready"}</span>
                        <span className="font-semibold text-gray-900">{vehicleReady} / {vehicleTotal}</span>
                      </div>
                      <Progress value={(vehicleReady / vehicleTotal) * 100} variant="gradient" size="md" />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">{t("dashboard.incomplete") || "Incomplete"}</span>
                        <span className="font-medium text-amber-600">{vehicleTotal - vehicleReady}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">{t("dashboard.noVehicles") || "No vehicles registered"}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Expiring Documents */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileWarning className="size-5 text-amber-500" />
                  <div>
                    <CardTitle className="text-sm">{t("dashboard.expiringDocuments") || "Expiring Documents"}</CardTitle>
                    <CardDescription>{t("dashboard.next30Days") || "Next 30 days"}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {expiringDocs.length > 0 ? (
                  <div className="space-y-2">
                    {expiringDocs.slice(0, 5).map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between rounded-lg bg-amber-50/50 p-3 border border-amber-100/50">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {doc.entity ? (isRtl ? doc.entity.nameAr : doc.entity.name) : doc.type}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(doc.expiryDate).toLocaleDateString(isRtl ? "ar-SA" : "en-US")}
                          </p>
                        </div>
                        <Badge variant="warning" className="ms-2 shrink-0 text-xs">
                          {Math.ceil((new Date(doc.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <CheckCircle2 className="size-8 text-green-400" />
                    <p className="text-sm text-gray-400">{t("dashboard.noExpiringDocs") || "No documents expiring soon"}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Priorities & Recent Updates */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-brand-warning/10 text-brand-warning">
                    <ListChecks className="size-4" />
                  </div>
                  <CardTitle className="text-sm">{t("dashboard.currentPriorities") || "Current Priorities"}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {readinessData.length > 0 ? (
                  <div className="space-y-2">
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
                          <div key={cat.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/30 p-3 transition-colors hover:bg-gray-50">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                              <AlertTriangle className="size-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-gray-900">
                                {isRtl ? cat.nameAr : cat.name}
                              </p>
                              <div className="mt-1.5 flex items-center gap-2">
                                <Progress value={pct} size="sm" className="flex-1" variant="warning" />
                                <span className="text-xs text-gray-500 font-medium">{pct}%</span>
                              </div>
                            </div>
                            <ChevronRight className="size-4 shrink-0 text-gray-300" />
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <CheckCircle2 className="size-8 text-green-400" />
                    <p className="text-sm text-gray-400">{t("dashboard.noPriorities") || "All categories are complete"}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-brand-info/10 text-brand-info">
                    <Activity className="size-4" />
                  </div>
                  <CardTitle className="text-sm">{t("dashboard.recentUpdates") || "Recent Updates"}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {recentUpdates.length > 0 ? (
                  <div className="space-y-1">
                    {recentUpdates.slice(0, 8).map((log, idx) => (
                      <div key={log.id} className="relative flex items-start gap-3 px-3 py-2.5">
                        {idx < recentUpdates.slice(0, 8).length - 1 && (
                          <div className="absolute start-6 top-8 bottom-0 w-px bg-gray-200" />
                        )}
                        <div className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                          idx === 0 ? "border-brand-orange bg-brand-orange/10" : "border-gray-300 bg-white"
                        }`}>
                          <div className={`size-2 rounded-full ${
                            idx === 0 ? "bg-brand-orange" : "bg-gray-300"
                          }`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">{log.user?.fullName || "System"}</span>
                            <span className="text-gray-500"> {log.action.toLowerCase()} </span>
                            <span className="text-gray-700">{log.entityType}</span>
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(log.createdAt).toLocaleDateString(isRtl ? "ar-SA" : "en-US", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <Activity className="size-8 text-gray-300" />
                    <p className="text-sm text-gray-400">{t("dashboard.noUpdates") || "No recent updates"}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
