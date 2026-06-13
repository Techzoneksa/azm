"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle, Clock, Play, Square, MapPin, Info } from "lucide-react";

interface ShiftData {
  id: string;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  startLocationLat: number | null;
  startLocationLng: number | null;
  endLocationLat: number | null;
  endLocationLng: number | null;
  notes: string | null;
}

function formatDuration(start: string, end?: string): string {
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const diffMs = e - s;
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

export default function DriverShiftPage() {
  const t = useTranslations("driver");
  const [shift, setShift] = useState<ShiftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const fetchShift = useCallback(async () => {
    try {
      const res = await fetch("/api/driver/shift");
      if (!res.ok) throw new Error("Failed to fetch shift");
      const json = await res.json();
      setShift(json.data);
      setLoading(false);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShift();
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, [fetchShift]);

  const handleStartShift = async () => {
    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch("/api/driver/shift/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationLat: location?.lat ?? null,
          locationLng: location?.lng ?? null,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to start shift");
      }
      const json = await res.json();
      setShift(json.data);
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndShift = async () => {
    setShowEndConfirm(false);
    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch("/api/driver/shift/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationLat: location?.lat ?? null,
          locationLng: location?.lng ?? null,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to end shift");
      }
      const json = await res.json();
      setShift(json.data);
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton variant="rectangular" className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<AlertTriangle className="size-8" />}
        title={t("shift.error") || "Error"}
        description={error}
        action={{ label: t("shift.retry") || "Retry", onClick: fetchShift }}
      />
    );
  }

  const isActive = shift?.status === "ACTIVE";
  const isEnded = shift?.status === "ENDED";
  const isNotStarted = !shift || shift.status === "NOT_STARTED";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-brand-dark-blue">
              {t("shift.title") || "Shift Management"}
            </CardTitle>
            {isActive && <Badge variant="success">{t("shift.active") || "Active"}</Badge>}
            {isEnded && <Badge variant="secondary">{t("shift.ended") || "Ended"}</Badge>}
            {isNotStarted && <Badge variant="outline">{t("shift.notStarted") || "Not Started"}</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isNotStarted && (
            <div className="flex flex-col items-center gap-4 py-6">
              <Clock className="size-16 text-brand-light-orange" />
              <p className="text-center text-sm text-brand-text-gray">
                {t("shift.startPrompt") || "You haven't started your shift yet"}
              </p>
              {actionError && (
                <p className="text-xs text-red-600">{actionError}</p>
              )}
              <Button
                size="lg"
                className="w-full"
                onClick={handleStartShift}
                loading={actionLoading}
              >
                <Play className="size-5" />
                {t("shift.startShift") || "Start Shift"}
              </Button>
            </div>
          )}

          {isActive && shift.startedAt && (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <Clock className="size-5" />
                  <span className="text-sm font-semibold">
                    {t("shift.shiftActive") || "Shift Active"}
                  </span>
                </div>
                <div className="mt-2 space-y-1 text-sm text-green-700">
                  <p>
                    {t("shift.startedAt") || "Started at"}:{" "}
                    {new Date(shift.startedAt).toLocaleTimeString()}
                  </p>
                  <p>
                    {t("shift.duration") || "Duration"}:{" "}
                    {formatDuration(shift.startedAt)}
                  </p>
                </div>
              </div>
              {actionError && (
                <p className="text-xs text-red-600">{actionError}</p>
              )}
              <Button
                variant="destructive"
                size="lg"
                className="w-full"
                onClick={() => setShowEndConfirm(true)}
                loading={actionLoading}
              >
                <Square className="size-5" />
                {t("shift.endShift") || "End Shift"}
              </Button>
            </div>
          )}

          {isEnded && shift.startedAt && (
            <div className="space-y-3">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="space-y-2 text-sm text-brand-text-gray">
                  <p>
                    {t("shift.startedAt") || "Started"}:{" "}
                    {new Date(shift.startedAt).toLocaleString()}
                  </p>
                  {shift.endedAt && (
                    <p>
                      {t("shift.endedAt") || "Ended"}:{" "}
                      {new Date(shift.endedAt).toLocaleString()}
                    </p>
                  )}
                  <p>
                    {t("shift.totalDuration") || "Total Duration"}:{" "}
                    {formatDuration(shift.startedAt, shift.endedAt ?? undefined)}
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                className="w-full"
                onClick={handleStartShift}
                loading={actionLoading}
              >
                <Play className="size-5" />
                {t("shift.startNewShift") || "Start New Shift"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("shift.confirmEndTitle") || "End Shift"}</DialogTitle>
            <DialogDescription>
              {t("shift.confirmEndDesc") || "Are you sure you want to end your shift?"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            <Info className="size-4 shrink-0" />
            <p>{t("shift.endWarning") || "Make sure all shipments are delivered or returned before ending."}</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEndConfirm(false)}
            >
              {t("shift.cancel") || "Cancel"}
            </Button>
            <Button variant="destructive" onClick={handleEndShift}>
              {t("shift.confirmEnd") || "End Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
