"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Package, RefreshCw, ChevronRight, ArrowUp } from "lucide-react";

interface Shipment {
  id: string;
  trackingNumber: string;
  partnerReference: string | null;
  recipientName: string;
  city: string | null;
  district: string | null;
  status: string;
  priority: string;
  pieces: number;
  lastStatusUpdate: string;
}

const statusFilters = [
  { key: "", labelKey: "shipments.all" },
  { key: "ASSIGNED_TO_DRIVER", labelKey: "shipments.ready" },
  { key: "OUT_FOR_DELIVERY", labelKey: "shipments.outForDelivery" },
  { key: "FAILED_ATTEMPT", labelKey: "shipments.failed" },
  { key: "DELIVERED", labelKey: "shipments.delivered" },
  { key: "RETURN_PENDING", labelKey: "shipments.returned" },
];

const priorityColors: Record<string, string> = {
  HIGH: "text-red-600",
  URGENT: "text-red-600",
  NORMAL: "text-brand-orange",
  LOW: "text-gray-400",
};

const statusToVariant: Record<string, string> = {
  ASSIGNED_TO_DRIVER: "default",
  OUT_FOR_DELIVERY: "warning",
  FAILED_ATTEMPT: "destructive",
  DELIVERED: "success",
  RETURN_PENDING: "warning",
};

export default function DriverShipmentsPage() {
  const t = useTranslations("driver");
  const tShip = useTranslations("shipments");
  const searchParams = useSearchParams();
  const activeFilter = searchParams.get("status") || "";
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchShipments = useCallback(async (status: string) => {
    setLoading(true);
    setError("");
    try {
      const url = status
        ? `/api/driver/shipments?status=${encodeURIComponent(status)}`
        : "/api/driver/shipments";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load shipments");
      const json = await res.json();
      setShipments(json.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShipments(activeFilter);
  }, [activeFilter, fetchShipments]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchShipments(activeFilter);
    setRefreshing(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-brand-dark-blue">
          {t("shipments.title") || "My Shipments"}
        </h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          loading={refreshing}
        >
          <RefreshCw className="size-4" />
        </Button>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {statusFilters.map((f) => {
          const isActive = activeFilter === f.key;
          const href = f.key ? `/driver/shipments?status=${f.key}` : "/driver/shipments";
          return (
            <Link
              key={f.key}
              href={href}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-brand-dark-blue text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t(f.labelKey)}
            </Link>
          );
        })}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" className="h-28 w-full" />
          ))}
        </div>
      )}

      {error && (
        <EmptyState
          icon={<Package className="size-8" />}
          title={t("shipments.error") || "Error"}
          description={error}
          action={{
            label: t("shipments.retry") || "Retry",
            onClick: () => fetchShipments(activeFilter),
          }}
        />
      )}

      {!loading && !error && shipments.length === 0 && (
        <EmptyState
          icon={<Package className="size-8" />}
          title={t("shipments.noShipments") || "No shipments"}
          description={t("shipments.noShipmentsDesc") || "No shipments assigned to you"}
        />
      )}

      {!loading && !error && shipments.length > 0 && (
        <div className="space-y-3">
          {shipments.map((s) => (
            <Link key={s.id} href={`/driver/shipments/${s.id}`}>
              <Card className="active:bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-brand-dark-blue truncate">
                          {s.trackingNumber}
                        </span>
                        <StatusBadge
                          status={s.status}
                          formatLabel={(key) => tShip("status_" + key)}
                          customMap={Object.fromEntries(
                            Object.entries(statusToVariant).map(([k, v]) => [
                              k.toLowerCase(),
                              { label: "", variant: v as "default" | "secondary" | "destructive" | "success" | "warning" | "outline" },
                            ])
                          )}
                        />
                      </div>
                      <p className="mt-1 text-sm text-gray-900">{s.recipientName}</p>
                      <p className="text-xs text-brand-text-gray">
                        {[s.district, s.city].filter(Boolean).join(", ")}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                        <span>{s.pieces} {t("shipments.pieces") || "pcs"}</span>
                        {s.priority !== "NORMAL" && (
                          <span className={`flex items-center gap-1 font-medium ${priorityColors[s.priority] || ""}`}>
                            <ArrowUp className="size-3" />
                            {s.priority}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
