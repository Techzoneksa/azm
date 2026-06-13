"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertTriangle, Package, CheckCircle, XCircle, RotateCcw, Clock, Truck } from "lucide-react";

interface HomeData {
  driver: {
    id: string;
    fullName: string;
    phone: string | null;
    email: string | null;
    city: string | null;
    vehicleType: string | null;
    plateNumber: string | null;
    status: string | null;
    readinessStatus: string | null;
  };
  stats: {
    totalShipments: number;
    deliveredCount: number;
    failedCount: number;
    returnCount: number;
  };
  activeShift: {
    id: string;
    status: string;
    startedAt: string;
  } | null;
}

export default function DriverHomePage() {
  const t = useTranslations("driver");
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/driver/home")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load home data");
        return res.json();
      })
      .then((json) => {
        setData(json.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton variant="rectangular" className="h-24 w-full" />
        <Skeleton variant="rectangular" className="h-32 w-full" />
        <Skeleton variant="rectangular" className="h-20 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        icon={<AlertTriangle className="size-8" />}
        title={t("home.error") || "Error"}
        description={error || t("home.loadError") || "Failed to load data"}
        action={{
          label: t("home.retry") || "Retry",
          onClick: () => window.location.reload(),
        }}
      />
    );
  }

  const { driver, stats, activeShift } = data;
  const needsAttention = stats.failedCount + stats.returnCount;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-brand-dark-blue text-white text-lg font-bold">
              {driver.fullName.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-brand-dark-blue">
                {t("home.greeting") || "Welcome"}, {driver.fullName}
              </h2>
              <p className="text-sm text-brand-text-gray">
                {driver.city ? `${driver.city}` : ""}
                {driver.vehicleType ? ` \u2022 ${driver.vehicleType}` : ""}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-brand-dark-blue">
              {t("home.shiftStatus") || "Shift Status"}
            </h3>
            {activeShift ? (
              <Badge variant="success">{t("home.active") || "Active"}</Badge>
            ) : (
              <Badge variant="secondary">{t("home.notStarted") || "Not Started"}</Badge>
            )}
          </div>
          {activeShift ? (
            <div className="flex items-center gap-2 text-sm text-brand-text-gray">
              <Clock className="size-4" />
              <span>
                {t("home.startedAt") || "Started"}:{" "}
                {new Date(activeShift.startedAt).toLocaleTimeString()}
              </span>
            </div>
          ) : (
            <Link href="/driver/shift">
              <Button size="lg" className="mt-2 w-full">
                {t("home.startShift") || "Start Shift"}
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
            <Package className="size-6 text-brand-orange" />
            <span className="text-2xl font-bold text-brand-dark-blue">{stats.totalShipments}</span>
            <span className="text-xs text-brand-text-gray">
              {t("home.totalShipments") || "Total"}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
            <CheckCircle className="size-6 text-green-600" />
            <span className="text-2xl font-bold text-brand-dark-blue">{stats.deliveredCount}</span>
            <span className="text-xs text-brand-text-gray">
              {t("home.delivered") || "Delivered"}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
            <XCircle className="size-6 text-red-600" />
            <span className="text-2xl font-bold text-brand-dark-blue">{stats.failedCount}</span>
            <span className="text-xs text-brand-text-gray">
              {t("home.failed") || "Failed"}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
            <RotateCcw className="size-6 text-brand-orange" />
            <span className="text-2xl font-bold text-brand-dark-blue">{stats.returnCount}</span>
            <span className="text-xs text-brand-text-gray">
              {t("home.returns") || "Returns"}
            </span>
          </CardContent>
        </Card>
      </div>

      {needsAttention > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 shrink-0 text-red-600" />
              <div>
                <h3 className="text-sm font-semibold text-red-800">
                  {t("home.needsAttention") || "Needs Attention"}
                </h3>
                <p className="mt-1 text-xs text-red-600">
                  {stats.failedCount} {t("home.failedShipments") || "failed"},{" "}
                  {stats.returnCount} {t("home.pendingReturns") || "pending returns"}
                </p>
                <div className="mt-2 flex gap-2">
                  <Link href="/driver/shipments?status=FAILED_ATTEMPT">
                    <Button variant="outline" size="sm">
                      {t("home.viewFailed") || "View"}
                    </Button>
                  </Link>
                  <Link href="/driver/returns">
                    <Button variant="outline" size="sm">
                      {t("home.viewReturns") || "Returns"}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
