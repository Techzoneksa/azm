"use client";

import { type HTMLAttributes, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";

export interface DashboardLayoutProps extends HTMLAttributes<HTMLDivElement> {
  locale: string;
  title: string;
  children: ReactNode;
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
  onToggleLanguage?: () => void;
}

function DashboardLayout({
  className,
  locale,
  title,
  children,
  userName,
  userRole,
  onLogout,
  onToggleLanguage,
  ...props
}: DashboardLayoutProps) {
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  return (
    <div
      className={cn(
        "flex min-h-screen bg-brand-light-bg",
        locale === "ar" ? "font-sans" : "",
        className
      )}
      dir={locale === "ar" ? "rtl" : "ltr"}
      {...props}
    >
      {/* Sidebar */}
      <Sidebar
        locale={locale}
        userName={userName}
        onLogout={onLogout}
        onToggleLanguage={onToggleLanguage}
      />

      {/* Main area */}
      <div className="flex flex-1 flex-col md:ms-64">
        <Navbar
          title={title}
          locale={locale}
          userName={userName}
          userRole={userRole}
          onMenuToggle={() => setSidebarMobileOpen(!sidebarMobileOpen)}
          onLogout={onLogout}
          onToggleLanguage={onToggleLanguage}
        />

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export { DashboardLayout };
