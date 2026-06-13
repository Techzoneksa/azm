"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertTriangle, Package, CheckCircle, XCircle, RotateCcw, Clock, Truck, User } from "lucide-react";

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
      <div className="space-y-4 animate-fade-in">
        <Skeleton variant="rectangular" className="h-24 w-full" />
        <Skeleton variant="rectangular" className="h-28 w-full" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rectangular" className="h-24 w-full" />
          ))}
        </div>
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
    <div className="space-y-4 animate-fade-in">
      {/* Driver Greeting Card */}
      <Card className="overflow-hidden border-0">
        <div className="gradient-brand p-5">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-white/20 text-white text-xl font-bold shadow-inner">
              {driver.fullName.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">
                {t("home.greeting") || "Welcome"}, {driver.fullName}
              </h2>
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-white/70">
                {driver.city && <span>{driver.city}</span>}
                {driver.vehicleType && <span className="flex items-center gap-1"><Truck className="size-3" />{driver.vehicleType}</span>}
                {driver.plateNumber && <span>{driver.plateNumber}</span>}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Shift Status Card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-brand-orange/10 text-brand-orange">
                <Clock className="size-4" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">
                {t("home.shiftStatus") || "Shift Status"}
              </h3>
            </div>
            {activeShift ? (
              <Badge variant="success">{t("home.active") || "Active"}</Badge>
            ) : (
              <Badge variant="secondary">{t("home.notStarted") || "Not Started"}</Badge>
            )}
          </div>
          {activeShift ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
              <Clock className="size-4 text-gray-400" />
              <span>
                {t("home.startedAt") || "Started"}:{" "}
                {new Date(activeShift.startedAt).toLocaleTimeString()}
              </span>
            </div>
          ) : (
            <Link href="/driver/shift">
              <Button size="lg" className="w-full">
                {t("home.startShift") || "Start Shift"}
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-5 text-center">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-orange/10 text-brand-orange">
              <Package className="size-5" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{stats.totalShipments}</span>
            <span className="text-xs text-gray-500 font-medium">{t("home.totalShipments") || "Total"}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-5 text-center">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-success/10 text-brand-success">
              <CheckCircle className="size-5" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{stats.deliveredCount}</span>
            <span className="text-xs text-gray-500 font-medium">{t("home.delivered") || "Delivered"}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-5 text-center">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-danger/10 text-brand-danger">
              <XCircle className="size-5" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{stats.failedCount}</span>
            <span className="text-xs text-gray-500 font-medium">{t("home.failed") || "Failed"}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-5 text-center">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-brand-orange">
              <RotateCcw className="size-5" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{stats.returnCount}</span>
            <span className="text-xs text-gray-500 font-medium">{t("home.returns") || "Returns"}</span>
          </CardContent>
        </Card>
      </div>

      {/* Needs Attention Alert */}
      {needsAttention > 0 && (
        <Card className="border-red-200/80 bg-gradient-to-r from-red-50 to-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <AlertTriangle className="size-4" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800">
                  {t("home.needsAttention") || "Needs Attention"}
                </h3>
                <p className="mt-1 text-xs text-red-600">
                  {stats.failedCount} {t("home.failedShipments") || "failed"},{" "}
                  {stats.returnCount} {t("home.pendingReturns") || "pending returns"}
                </p>
                <div className="mt-3 flex gap-2">
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
