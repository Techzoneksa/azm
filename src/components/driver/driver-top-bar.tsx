"use client";

import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";

interface DriverTopBarProps {
  title: string;
  onLogout?: () => void;
}

export function DriverTopBar({ title, onLogout }: DriverTopBarProps) {
  const t = useTranslations("driver");

  return (
    <header className="sticky top-0 z-40 gradient-brand px-4 py-3 text-white shadow-sm">
      <div className="mx-auto flex max-w-lg items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-orange to-brand-light-orange text-xs font-bold shadow-sm">
            A
          </div>
          <span className="text-sm font-bold">AZM Flow</span>
        </div>
        <h1 className="text-sm font-semibold text-white/90">{title}</h1>
        {onLogout && (
          <button
            onClick={onLogout}
            className="flex size-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={t("nav.logout")}
          >
            <LogOut className="size-4" />
          </button>
        )}
      </div>
    </header>
  );
}
