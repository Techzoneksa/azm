"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ChevronLeft, MapPin, CheckSquare } from "lucide-react";

export default function DriverPODPage() {
  const t = useTranslations("driver");
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
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
    if (!receiverName.trim()) {
      setError(t("pod.requiredReceiver") || "Receiver name is required");
      return;
    }
    if (!confirmed) {
      setError(t("pod.requiredConfirm") || "Please confirm delivery");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/driver/shipments/${id}/pod`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverName: receiverName.trim(),
          receiverPhone: receiverPhone.trim() || undefined,
          otp: otp.trim() || undefined,
          notes: notes.trim() || undefined,
          locationLat: location?.lat ?? null,
          locationLng: location?.lng ?? null,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to submit POD");
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
        <Skeleton variant="rectangular" className="h-72 w-full" />
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
        {t("pod.back") || "Back"}
      </button>

      <Card>
        <CardHeader>
          <CardTitle className="text-brand-dark-blue">
            {t("pod.title") || "Proof of Delivery"}
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
            <label className="mb-1 block text-sm font-medium text-brand-dark-blue">
              {t("pod.receiverName") || "Receiver Name"} *
            </label>
            <Input
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder={t("pod.receiverNamePlaceholder") || "Enter receiver name"}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-dark-blue">
              {t("pod.receiverPhone") || "Receiver Phone"}
            </label>
            <Input
              value={receiverPhone}
              onChange={(e) => setReceiverPhone(e.target.value)}
              placeholder={t("pod.receiverPhonePlaceholder") || "Enter receiver phone"}
              type="tel"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-dark-blue">
              {t("pod.otp") || "OTP Code"}
            </label>
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder={t("pod.otpPlaceholder") || "Enter OTP if applicable"}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-dark-blue">
              {t("pod.notes") || "Notes"}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
              placeholder={t("pod.notesPlaceholder") || "Additional notes..."}
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-brand-text-gray">
            <MapPin className="size-4" />
            {location
              ? (t("pod.locationCaptured") || "Location captured")
              : (t("pod.locationFailed") || "Location unavailable")}
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 size-4 accent-brand-orange"
            />
            <span className="text-sm text-gray-700">
              {t("pod.confirmLabel") || "I confirm delivery was completed"}
            </span>
          </label>

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
            disabled={!receiverName.trim() || !confirmed}
          >
            {t("pod.submit") || "Submit POD"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
