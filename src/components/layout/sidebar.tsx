"use client";

import { type HTMLAttributes, useState } from "react";
import { cn } from "@/lib/cn";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  LayoutDashboard,
  ClipboardCheck,
  Building2,
  ShieldCheck,
  ExternalLink,
  Truck,
  Car,
  Users,
  Settings,
  LogOut,
  Globe,
  Menu,
  X,
  ChevronLeft,
  Handshake,
  FileText,
  MapPin,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavItem {
  labelKey: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
  { labelKey: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { labelKey: "readiness", href: "/readiness", icon: ClipboardCheck },
  { labelKey: "companyData", href: "/company-data", icon: Building2 },
  { labelKey: "compliance", href: "/compliance", icon: ShieldCheck },
  { labelKey: "officialLinks", href: "/official-links", icon: ExternalLink },
  { labelKey: "drivers", href: "/drivers", icon: Truck },
  { labelKey: "vehicles", href: "/vehicles", icon: Car },
  { labelKey: "partners", href: "/partners", icon: Handshake },
  { labelKey: "contracts", href: "/contracts", icon: FileText },
  { labelKey: "pickupPoints", href: "/pickup-points", icon: MapPin },
  { labelKey: "coverageAreas", href: "/coverage-areas", icon: Layers },
  { labelKey: "users", href: "/users", icon: Users },
  { labelKey: "settings", href: "/settings", icon: Settings },
];

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  locale: string;
  userName?: string;
  companyName?: string;
  onLogout?: () => void;
  onToggleLanguage?: () => void;
}

function Sidebar({
  className,
  locale,
  userName,
  companyName,
  onLogout,
  onToggleLanguage,
  ...props
}: SidebarProps) {
  const t = useTranslations("sidebar");
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isRtl = locale === "ar";

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div
      className={cn(
        "flex h-full flex-col bg-gray-950 text-white",
        className
      )}
      {...props}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-800 px-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold">
          AZ
        </div>
        <span className="text-lg font-bold tracking-tight">AZM Flow</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <button
              key={item.href}
              onClick={() => {
                router.push(item.href);
                setMobileOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="size-5 shrink-0" />
              <span>{t(item.labelKey)}</span>
              {active && (
                <ChevronLeft
                  className={cn(
                    "ms-auto size-4",
                    isRtl && "rotate-180"
                  )}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-gray-800 p-3 space-y-2">
        {/* Language Switch */}
        <button
          onClick={onToggleLanguage}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <Globe className="size-5 shrink-0" />
          <span>{isRtl ? "English" : "العربية"}</span>
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-red-600/20 hover:text-red-400"
        >
          <LogOut className="size-5 shrink-0" />
          <span>{t("logout")}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed start-4 top-3 z-50 flex size-10 items-center justify-center rounded-lg bg-gray-950 text-white shadow-lg md:hidden"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-50 w-64 transform transition-transform duration-200 ease-in-out md:hidden",
          mobileOpen ? "translate-x-0" : isRtl ? "translate-x-full" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:block md:w-64 md:shrink-0">
        <div className="fixed inset-y-0 start-0 z-30 w-64">{sidebarContent}</div>
      </aside>
    </>
  );
}

export { Sidebar };
