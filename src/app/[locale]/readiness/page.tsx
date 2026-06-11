"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Building2,
  FileCheck,
  Users,
  Truck,
  MapPin,
  ShieldAlert,
  FileText,
  Cpu,
  RefreshCw,
  CircleAlert,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface ReadinessItem {
  id: string;
  name: string;
  nameAr: string;
  isCompleted: boolean;
  sortOrder: number;
}

interface ReadinessScoreEntry {
  score: number;
  totalItems: number;
  completedItems: number;
}

interface ReadinessCategory {
  id: string;
  name: string;
  nameAr: string;
  description: string | null;
  weight: number;
  sortOrder: number;
  isActive: boolean;
  items: ReadinessItem[];
  scores: ReadinessScoreEntry[];
}

interface ReadinessApiResponse {
  data: ReadinessCategory[];
}

const categoryIcons: Record<string, React.ReactNode> = {
  "Company Readiness": <Building2 className="size-6" />,
  "Licenses Readiness": <FileCheck className="size-6" />,
  "Drivers Readiness": <Users className="size-6" />,
  "Vehicles Readiness": <Truck className="size-6" />,
  "National Address Readiness": <MapPin className="size-6" />,
  "Privacy & Tracking Readiness": <ShieldAlert className="size-6" />,
  "Contracts Readiness": <FileText className="size-6" />,
  "Integrations Readiness": <Cpu className="size-6" />,
};

function CircularScore({ value, size = 200 }: { value: number; size?: number }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const getColor = () => {
    if (value >= 80) return "text-green-500";
    if (value >= 50) return "text-amber-500";
    return "text-red-500";
  };

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
          className={`transition-all duration-700 ease-out ${getColor()}`}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-4xl font-bold ${getColor()}`}>{Math.round(value)}%</span>
        <span className="mt-1 text-sm text-gray-500">Overall</span>
      </div>
    </div>
  );
}

function CategoryCard({
  category,
  isRtl,
}: {
  category: ReadinessCategory;
  isRtl: boolean;
}) {
  const items = category.items || [];
  const completed = items.filter((i) => i.isCompleted).length;
  const total = items.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const icon = categoryIcons[category.name] || <ShieldCheck className="size-6" />;

  const getStatus = () => {
    if (total === 0) return "empty";
    if (percentage === 100) return "ready";
    if (percentage >= 50) return "partially_ready";
    return "not_ready";
  };

  const status = getStatus();

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex size-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            {icon}
          </div>
          <StatusBadge status={status} />
        </div>
        <h3 className="mt-4 text-base font-semibold text-gray-900">
          {isRtl ? category.nameAr : category.name}
        </h3>
        {category.description && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">
            {category.description}
          </p>
        )}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium text-gray-900">{percentage}%</span>
          </div>
          <Progress
            value={percentage}
            variant={percentage === 100 ? "success" : percentage >= 50 ? "warning" : "danger"}
            size="md"
          />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{completed} / {total} completed</span>
            <span className="font-medium">Weight: {Math.round(category.weight * 100)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <Skeleton variant="circular" className="size-48" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton variant="circular" className="size-12" />
              <Skeleton variant="text" className="mt-4 h-5 w-32" />
              <Skeleton variant="text" className="mt-1 h-3 w-48" />
              <Skeleton variant="text" className="mt-4 h-2 w-full" />
              <Skeleton variant="text" className="mt-2 h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function ReadinessPage() {
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [categories, setCategories] = useState<ReadinessCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReadiness = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/readiness");
      if (!res.ok) throw new Error("Failed to load readiness data");
      const json: ReadinessApiResponse = await res.json();
      setCategories(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReadiness();
  }, [fetchReadiness]);

  const overallScore = categories.length > 0
    ? Math.round(
        categories.reduce((acc, cat) => {
          const items = cat.items || [];
          const completed = items.filter((i) => i.isCompleted).length;
          const catScore = items.length > 0 ? (completed / items.length) * 100 : 0;
          return acc + catScore * (cat.weight || 0);
        }, 0)
      )
    : 0;

  const totalCompleted = categories.reduce(
    (acc, cat) => acc + (cat.items || []).filter((i) => i.isCompleted).length,
    0
  );
  const totalItems = categories.reduce(
    (acc, cat) => acc + (cat.items || []).length,
    0
  );

  if (error) {
    return (
      <DashboardLayout locale={locale} title={t("readiness.title") || "Readiness Center"}>
        <EmptyState
          icon={<CircleAlert className="size-8" />}
          title={t("common.error") || "Error"}
          description={error}
          action={{ label: t("common.retry") || "Retry", onClick: fetchReadiness }}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      locale={locale}
      title={t("readiness.title") || "Readiness Center"}
    >
      {loading ? (
        <LoadingSkeleton />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="size-8" />}
          title={t("readiness.noData") || "No readiness data"}
          description={t("readiness.noDataDesc") || "Readiness categories have not been configured yet."}
          action={{ label: t("common.refresh") || "Refresh", onClick: fetchReadiness }}
        />
      ) : (
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t("readiness.center") || "Readiness Center"}
              </h1>
              <p className="text-sm text-gray-500">
                {t("readiness.monitorDescription") || "Monitor and track your operational readiness across all categories"}
              </p>
            </div>
            <button
              onClick={fetchReadiness}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="size-4" />
              {t("common.refresh") || "Refresh"}
            </button>
          </div>

          {/* Overall Score */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-6 md:flex-row md:gap-12">
                <CircularScore value={overallScore} />
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">
                    {t("readiness.overallReadiness") || "Overall Readiness"}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {t("readiness.weightedScore") || "Weighted score across all categories"}
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-green-600" />
                        <span className="text-xs text-gray-600">{t("readiness.completed") || "Completed"}</span>
                      </div>
                      <p className="mt-1 text-xl font-bold text-green-700">{totalCompleted}</p>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="size-4 text-amber-600" />
                        <span className="text-xs text-gray-600">{t("readiness.pending") || "Pending"}</span>
                      </div>
                      <p className="mt-1 text-xl font-bold text-amber-700">{totalItems - totalCompleted}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-gray-600" />
                        <span className="text-xs text-gray-600">{t("readiness.totalItems") || "Total Items"}</span>
                      </div>
                      <p className="mt-1 text-xl font-bold text-gray-900">{totalItems}</p>
                    </div>
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="size-4 text-blue-600" />
                        <span className="text-xs text-gray-600">{t("readiness.categories") || "Categories"}</span>
                      </div>
                      <p className="mt-1 text-xl font-bold text-blue-700">{categories.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score Breakdown */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {t("readiness.categoryBreakdown") || "Category Breakdown"}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categories.map((cat) => (
                <CategoryCard key={cat.id} category={cat} isRtl={isRtl} />
              ))}
            </div>
          </div>

          {/* Score Formula */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-700">
                {t("readiness.scoringFormula") || "Score Calculation"}
              </CardTitle>
              <CardDescription>
                {t("readiness.formulaDescription") || "Overall score = sum of (category score × category weight) for all categories"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-2 text-start text-xs font-medium uppercase text-gray-500">
                        {t("readiness.category") || "Category"}
                      </th>
                      <th className="pb-2 text-end text-xs font-medium uppercase text-gray-500">
                        {t("readiness.weight") || "Weight"}
                      </th>
                      <th className="pb-2 text-end text-xs font-medium uppercase text-gray-500">
                        {t("readiness.score") || "Score"}
                      </th>
                      <th className="pb-2 text-end text-xs font-medium uppercase text-gray-500">
                        {t("readiness.contribution") || "Contribution"}
                      </th>
                      <th className="pb-2 text-end text-xs font-medium uppercase text-gray-500">
                        {t("readiness.status") || "Status"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => {
                      const items = cat.items || [];
                      const completedItems = items.filter((i) => i.isCompleted).length;
                      const catScore = items.length > 0 ? (completedItems / items.length) * 100 : 0;
                      const contribution = catScore * (cat.weight || 0);
                      return (
                        <tr key={cat.id} className="border-b border-gray-100">
                          <td className="py-2.5 text-start font-medium text-gray-900">
                            {isRtl ? cat.nameAr : cat.name}
                          </td>
                          <td className="py-2.5 text-end text-gray-700">
                            {Math.round((cat.weight || 0) * 100)}%
                          </td>
                          <td className="py-2.5 text-end text-gray-700">
                            {Math.round(catScore)}%
                          </td>
                          <td className="py-2.5 text-end font-medium text-gray-900">
                            {Math.round(contribution)}%
                          </td>
                          <td className="py-2.5 text-end">
                            <Badge
                              variant={
                                items.length === 0
                                  ? "outline"
                                  : catScore === 100
                                    ? "success"
                                    : catScore >= 50
                                      ? "warning"
                                      : "destructive"
                              }
                            >
                              {items.length === 0
                                ? "N/A"
                                : catScore === 100
                                  ? "Complete"
                                  : `${Math.round(catScore)}%`}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="font-semibold">
                      <td className="pt-3 text-start text-gray-900">
                        {t("readiness.total") || "Total"}
                      </td>
                      <td className="pt-3 text-end text-gray-900">100%</td>
                      <td className="pt-3 text-end text-gray-900" />
                      <td className="pt-3 text-end text-blue-600">{overallScore}%</td>
                      <td className="pt-3 text-end">
                        <Badge
                          variant={
                            overallScore >= 80
                              ? "success"
                              : overallScore >= 50
                                ? "warning"
                                : "destructive"
                          }
                        >
                          {overallScore >= 80
                            ? "Good"
                            : overallScore >= 50
                              ? "Needs Work"
                              : "Critical"}
                        </Badge>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
