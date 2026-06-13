"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { RotateCcw, ChevronRight, Calendar, AlertTriangle } from "lucide-react";

interface ReturnItem {
  id: string;
  reason: string;
  status: string;
  notes: string | null;
  returnRequestedAt: string;
  returnDueAt: string | null;
  shipment: {
    id: string;
    trackingNumber: string;
    recipientName: string;
    city: string | null;
    district: string | null;
    status: string;
  };
}

export default function DriverReturnsPage() {
  const t = useTranslations("driver");
  const tReturns = useTranslations("returns");
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/driver/returns");
      if (!res.ok) throw new Error("Failed to load returns");
      const json = await res.json();
      setReturns(json.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton variant="rectangular" className="h-8 w-32" />
        {[1, 2].map((i) => (
          <Skeleton key={i} variant="rectangular" className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<AlertTriangle className="size-8" />}
        title={t("returns.error") || "Error"}
        description={error}
        action={{
          label: t("returns.retry") || "Retry",
          onClick: fetchReturns,
        }}
      />
    );
  }

  if (returns.length === 0) {
    return (
      <EmptyState
        icon={<RotateCcw className="size-8" />}
        title={t("returns.noReturns") || "No returns"}
        description={t("returns.noReturnsDesc") || "No return shipments assigned"}
      />
    );
  }

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-bold text-brand-dark-blue">
        {t("returns.title") || "My Returns"}
      </h1>

      <div className="space-y-3">
        {returns.map((r) => (
          <Card key={r.id} className="border-red-100">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="size-4 shrink-0 text-red-500" />
                    <span className="text-sm font-semibold text-brand-dark-blue truncate">
                      {r.shipment.trackingNumber}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-900">
                    {r.shipment.recipientName}
                  </p>
                  <p className="text-xs text-brand-text-gray">
                    {[r.shipment.district, r.shipment.city].filter(Boolean).join(", ")}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="destructive" className="text-[10px]">
                      {tReturns(`reason_${r.reason}`)}
                    </Badge>
                    <StatusBadge status={r.status} className="text-[10px]" formatLabel={(key) => tReturns("status_" + key)} />
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="size-3" />
                    <span>
                      {tReturns("returnRequestedAt")}: {new Date(r.returnRequestedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {r.notes && (
                    <p className="mt-1 text-xs text-brand-text-gray line-clamp-2">
                      {r.notes}
                    </p>
                  )}
                </div>
                <ChevronRight className="size-5 shrink-0 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
