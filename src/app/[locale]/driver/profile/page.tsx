"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AlertTriangle, Phone, Mail, MapPin, Truck, FileText,
  Package, CheckCircle, LogOut, Calendar, IdCard, User
} from "lucide-react";

interface ProfileData {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  city: string | null;
  district: string | null;
  vehicleType: string | null;
  plateNumber: string | null;
  status: string;
  readinessStatus: string;
  nationalId: string;
  documents: Array<{
    id: string;
    type: string;
    documentNumber: string | null;
    expiryDate: string | null;
    status: string;
  }>;
  stats: {
    totalShipments: number;
    deliveredCount: number;
  };
}

export default function DriverProfilePage() {
  const t = useTranslations("driver");
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/driver/profile");
      if (!res.ok) throw new Error("Failed to load profile");
      const json = await res.json();
      setProfile(json.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton variant="circular" className="mx-auto size-20" />
        <Skeleton variant="rectangular" className="h-24 w-full" />
        <Skeleton variant="rectangular" className="h-32 w-full" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <EmptyState
        icon={<AlertTriangle className="size-8" />}
        title={t("profile.error") || "Error"}
        description={error || "Failed to load profile"}
        action={{
          label: t("profile.retry") || "Retry",
          onClick: fetchProfile,
        }}
      />
    );
  }

  const expiringDocs = profile.documents.filter((d) => {
    if (!d.expiryDate) return false;
    const daysLeft = (new Date(d.expiryDate).getTime() - Date.now()) / 86400000;
    return daysLeft < 30;
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col items-center p-6 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-brand-dark-blue text-3xl font-bold text-white">
            {profile.fullName.charAt(0)}
          </div>
          <h2 className="mt-3 text-xl font-bold text-brand-dark-blue">
            {profile.fullName}
          </h2>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={profile.status} />
            <StatusBadge status={profile.readinessStatus} customMap={{
              complete: { label: "Complete", variant: "success" },
              incomplete: { label: "Incomplete", variant: "destructive" },
            }} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-brand-dark-blue">
            <User className="me-2 inline size-4" />
            {t("profile.contactInfo") || "Contact Info"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Phone className="size-4 text-brand-text-gray" />
            <span>{profile.phone}</span>
          </div>
          {profile.email && (
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-brand-text-gray" />
              <span className="truncate">{profile.email}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-brand-text-gray" />
            <span>{[profile.district, profile.city].filter(Boolean).join(", ") || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2">
            <IdCard className="size-4 text-brand-text-gray" />
            <span>{profile.nationalId}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-brand-dark-blue">
            <Truck className="me-2 inline size-4" />
            {t("profile.vehicleInfo") || "Vehicle"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-brand-text-gray">{t("profile.vehicleType") || "Type"}:</span>{" "}
            <span className="font-medium">{profile.vehicleType || "N/A"}</span>
          </p>
          <p>
            <span className="text-brand-text-gray">{t("profile.plateNumber") || "Plate"}:</span>{" "}
            <span className="font-medium">{profile.plateNumber || "N/A"}</span>
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
            <Package className="size-6 text-brand-orange" />
            <span className="text-2xl font-bold text-brand-dark-blue">{profile.stats.totalShipments}</span>
            <span className="text-xs text-brand-text-gray">
              {t("profile.totalShipments") || "Total"}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
            <CheckCircle className="size-6 text-green-600" />
            <span className="text-2xl font-bold text-brand-dark-blue">{profile.stats.deliveredCount}</span>
            <span className="text-xs text-brand-text-gray">
              {t("profile.delivered") || "Delivered"}
            </span>
          </CardContent>
        </Card>
      </div>

      {profile.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-brand-dark-blue">
              <FileText className="me-2 inline size-4" />
              {t("profile.documents") || "Documents"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {profile.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 text-xs">
                <div>
                  <p className="font-medium text-gray-900">{doc.type.replace(/_/g, " ")}</p>
                  {doc.expiryDate && (
                    <p className="mt-0.5 text-brand-text-gray">
                      {t("profile.expires") || "Expires"}: {new Date(doc.expiryDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <StatusBadge status={doc.status} />
              </div>
            ))}
            {expiringDocs.length > 0 && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                <AlertTriangle className="size-4 shrink-0" />
                <p>
                  {t("profile.expiringDocs") || "Expiring documents"}: {expiringDocs.length}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Button
        variant="destructive"
        size="lg"
        className="w-full"
        onClick={handleLogout}
      >
        <LogOut className="size-5" />
        {t("profile.logout") || "Logout"}
      </Button>
    </div>
  );
}
