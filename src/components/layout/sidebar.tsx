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
  Package,
  Upload,
  Radio,
  ArrowLeftRight,
  BarChart3,
} from "lucide-react";

interface NavItem {
  labelKey: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
  { labelKey: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { labelKey: "readiness", href: "/readiness", icon: ClipboardCheck },
  { labelKey: "companyData", href: "/company", icon: Building2 },
  { labelKey: "compliance", href: "/compliance", icon: ShieldCheck },
  { labelKey: "officialLinks", href: "/official-links", icon: ExternalLink },
  { labelKey: "drivers", href: "/drivers", icon: Truck },
  { labelKey: "vehicles", href: "/vehicles", icon: Car },
  { labelKey: "partners", href: "/partners", icon: Handshake },
  { labelKey: "contracts", href: "/contracts", icon: FileText },
  { labelKey: "pickupPoints", href: "/pickup-points", icon: MapPin },
  { labelKey: "coverageAreas", href: "/coverage-areas", icon: Layers },
  { labelKey: "shipments", href: "/shipments", icon: Package },
  { labelKey: "shipmentImport", href: "/shipments/import", icon: Upload },
  { labelKey: "dispatch", href: "/dispatch", icon: Radio },
  { labelKey: "returns", href: "/returns", icon: ArrowLeftRight },
  { labelKey: "operationsReports", href: "/reports/operations", icon: BarChart3 },
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
        "flex h-full flex-col gradient-brand",
        className
      )}
      {...props}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-orange to-brand-light-orange text-white text-xs font-bold shadow-sm">
          A
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-white">AZM Flow</span>
          <span className="text-[10px] text-white/50 font-medium">Logistics OS</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
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
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-gradient-to-r from-brand-orange to-brand-light-orange text-white shadow-sm"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className={cn("size-5 shrink-0", active && "drop-shadow-sm")} />
              <span>{t(item.labelKey)}</span>
              {active && (
                <div className={cn("ms-auto size-1.5 rounded-full bg-white", isRtl && "me-auto ms-0")} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-white/10 p-3 space-y-1">
        {/* Language Switch */}
        <button
          onClick={onToggleLanguage}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Globe className="size-5 shrink-0" />
          <span>{isRtl ? "English" : "العربية"}</span>
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-red-500/20 hover:text-red-300"
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
        className="fixed start-4 top-3 z-50 flex size-10 items-center justify-center rounded-xl bg-white text-brand-dark-blue shadow-lg ring-1 ring-gray-200 md:hidden"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 z-50 w-64 shadow-sidebar transition-transform duration-300 ease-out md:hidden",
          mobileOpen
            ? "translate-x-0"
            : isRtl
              ? "translate-x-full"
              : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:block md:w-64 md:shrink-0">
        <div className="fixed inset-y-0 z-30 w-64 shadow-sidebar">{sidebarContent}</div>
      </aside>
    </>
  );
}

export { Sidebar };
