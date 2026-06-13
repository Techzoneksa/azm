"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ChevronLeft, MapPin, CheckSquare } from "lucide-react";

const ATTEMPT_REASONS = [
  "CUSTOMER_NOT_RESPONDING",
  "WRONG_ADDRESS",
  "CUSTOMER_REFUSED",
  "CANNOT_ACCESS_LOCATION",
  "CUSTOMER_REQUESTED_RESCHEDULE",
  "OTHER",
];

export default function DriverAttemptPage() {
  const t = useTranslations("driver");
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [contacted, setContacted] = useState(false);
  const [callCount, setCallCount] = useState(0);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shipment, setShipment] = useState<{ id: string; trackingNumber: string; recipientName: string; status: string } | null>(null);
  const [shipmentLoading, setShipmentLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/driver/shipments/${id}`)
      .then((res) => res.json())
      .then((json) => {
        setShipment(json.data);
        setShipmentLoading(false);
      })
      .catch(() => setShipmentLoading(false));

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, [id]);

  const handleSubmit = async () => {
    if (!reason) {
      setError(t("attempt.selectReason") || "Please select a reason");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/driver/shipments/${id}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: reason,
          notes,
          locationLat: location?.lat ?? null,
          locationLng: location?.lng ?? null,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to record attempt");
      }
      router.push(`/driver/shipments/${id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (shipmentLoading) {
    return (
      <div className="space-y-4">
        <Skeleton variant="rectangular" className="h-12 w-full" />
        <Skeleton variant="rectangular" className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => router.push(`/driver/shipments/${id}`)}
        className="flex items-center gap-1 text-sm text-brand-text-gray"
      >
        <ChevronLeft className="size-4" />
        {t("attempt.back") || "Back"}
      </button>

      <Card>
        <CardHeader>
          <CardTitle className="text-brand-dark-blue">
            {t("attempt.title") || "Record Delivery Attempt"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {shipment && (
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <p className="font-medium">{shipment.trackingNumber}</p>
              <p className="text-brand-text-gray">{shipment.recipientName}</p>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-brand-dark-blue">
              {t("attempt.reason") || "Attempt Result"} *
            </label>
            <div className="grid grid-cols-1 gap-2">
              {ATTEMPT_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                    reason === r
                      ? "border-brand-orange bg-orange-50 text-brand-dark-blue font-medium"
                      : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  {t(`attempt.reasons.${r}`) || r.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-brand-dark-blue">
              {t("attempt.notes") || "Notes"}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
              placeholder={t("attempt.notesPlaceholder") || "Add notes..."}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setContacted(!contacted)}
              className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                contacted
                  ? "border-brand-orange bg-orange-50 text-brand-dark-blue"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              <CheckSquare className={`size-5 ${contacted ? "text-brand-orange" : "text-gray-400"}`} />
              {t("attempt.contacted") || "Contacted customer"}
            </button>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-brand-dark-blue">
              {t("attempt.callCount") || "Call count"}
            </label>
            <input
              type="number"
              min={0}
              value={callCount}
              onChange={(e) => setCallCount(parseInt(e.target.value) || 0)}
              className="w-24 rounded-lg border border-gray-300 p-2 text-center text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-brand-text-gray">
            <MapPin className="size-4" />
            {location
              ? (t("attempt.locationCaptured") || "Location captured")
              : (t("attempt.locationFailed") || "Location unavailable")}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-600">
              <AlertTriangle className="size-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <Button
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            loading={loading}
            disabled={!reason}
          >
            {t("attempt.submit") || "Submit"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
