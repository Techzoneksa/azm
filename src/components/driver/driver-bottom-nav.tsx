"use client";

import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Home, Package, Undo2, Clock, User } from "lucide-react";
import { cn } from "@/lib/cn";

export function DriverBottomNav() {
  const t = useTranslations("driver");
  const pathname = usePathname();

  const items = [
    { href: "/driver", label: t("nav.home"), icon: Home },
    { href: "/driver/shipments", label: t("nav.shipments"), icon: Package },
    { href: "/driver/returns", label: t("nav.returns"), icon: Undo2 },
    { href: "/driver/shift", label: t("nav.shift"), icon: Clock },
    { href: "/driver/profile", label: t("nav.profile"), icon: User },
  ];

  return (
    <nav className="fixed bottom-0 start-0 end-0 z-50 border-t border-gray-200/80 bg-white/95 backdrop-blur-lg shadow-[0_-2px_12px_rgba(0,0,0,0.04)]">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1.5">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/driver" && pathname.startsWith(item.href));
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all duration-200",
                isActive
                  ? "text-brand-orange"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <item.icon
                className={cn(
                  "size-5 transition-all duration-200",
                  isActive && "drop-shadow-sm"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-brand-orange" : "text-gray-400"
                )}
              >
                {item.label}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
