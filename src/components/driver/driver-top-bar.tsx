"use client";

import { useTranslations } from "next-intl";

interface DriverTopBarProps {
  title: string;
  onLogout?: () => void;
}

export function DriverTopBar({ title, onLogout }: DriverTopBarProps) {
  const t = useTranslations("driver");

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-brand-dark-blue px-4 py-3 text-white">
      <div className="flex items-center gap-3">
        <img src="/logo.svg" alt="AZM" className="h-8 w-auto brightness-0 invert" />
      </div>
      <h1 className="text-sm font-bold">{title}</h1>
      {onLogout && (
        <button onClick={onLogout} className="text-xs text-gray-300 hover:text-white" aria-label={t("nav.logout")}>
          <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
          </svg>
        </button>
      )}
    </header>
  );
}
