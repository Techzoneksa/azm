"use client";

import { type HTMLAttributes, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/cn";
import { useTranslations } from "next-intl";
import { Menu, ChevronDown, LogOut, User, Globe } from "lucide-react";

export interface NavbarProps extends HTMLAttributes<HTMLElement> {
  title: string;
  locale: string;
  userName?: string;
  userRole?: string;
  onMenuToggle?: () => void;
  onLogout?: () => void;
  onToggleLanguage?: () => void;
}

function Navbar({
  className,
  title,
  locale,
  userName = "User",
  userRole,
  onMenuToggle,
  onLogout,
  onToggleLanguage,
  ...props
}: NavbarProps) {
  const t = useTranslations("navbar");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isRtl = locale === "ar";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 shadow-sm md:px-6",
        className
      )}
      {...props}
    >
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="flex size-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 md:hidden"
        aria-label={t("menuToggle")}
      >
        <Menu className="size-5" />
      </button>

      {/* Page title */}
      <h1 className="flex-1 text-lg font-semibold text-gray-900 truncate">
        {title}
      </h1>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Language switcher */}
        <button
          onClick={onToggleLanguage}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100"
          title={isRtl ? "Switch to English" : "التحويل إلى العربية"}
        >
          <Globe className="size-4" />
          <span className="hidden sm:inline">
            {isRtl ? "EN" : "AR"}
          </span>
        </button>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            <div className="flex size-8 items-center justify-center rounded-full bg-brand-orange text-xs font-bold text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden text-start md:block">
              <div className="text-sm font-medium leading-tight">
                {userName}
              </div>
              {userRole && (
                <div className="text-xs text-gray-500">{userRole}</div>
              )}
            </div>
            <ChevronDown className="hidden size-4 text-gray-400 md:block" />
          </button>

          {dropdownOpen && (
            <div
              className={cn(
                "absolute top-full z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg",
                isRtl ? "start-0" : "end-0"
              )}
            >
              <div className="border-b border-gray-100 px-4 py-2 md:hidden">
                <div className="text-sm font-medium">{userName}</div>
                {userRole && (
                  <div className="text-xs text-gray-500">{userRole}</div>
                )}
              </div>
              <button
                onClick={onLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="size-4" />
                {t("logout")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export { Navbar };
