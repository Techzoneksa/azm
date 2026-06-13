"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { DriverBottomNav } from "@/components/driver/driver-bottom-nav";
import { DriverTopBar } from "@/components/driver/driver-top-bar";
import { Skeleton } from "@/components/ui/skeleton";

const pathTitles: Record<string, string> = {
  "/driver": "nav.home",
  "/driver/shipments": "nav.shipments",
  "/driver/shift": "nav.shift",
  "/driver/returns": "nav.returns",
  "/driver/profile": "nav.profile",
};

export default function DriverLayout({ children }: { children: ReactNode }) {
  const t = useTranslations("driver");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => {
        const user = data.user;
        if (!user?.roles?.includes("DRIVER")) {
          router.replace("/login");
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }, [router]);

  const basePath = `/${locale}/driver`;
  const relativePath = pathname.startsWith(basePath)
    ? pathname.slice(basePath.length) || "/driver"
    : "/driver";
  const titleKey = Object.entries(pathTitles).find(([key]) =>
    relativePath.startsWith(key)
  )?.[1];

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Skeleton variant="rectangular" className="h-8 w-48" />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-brand-light-bg">
      <DriverTopBar title={titleKey ? t(titleKey) : ""} onLogout={handleLogout} />
      <main className="px-4 pb-24 pt-4">{children}</main>
      <DriverBottomNav />
    </div>
  );
}
