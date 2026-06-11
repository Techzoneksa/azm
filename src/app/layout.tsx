import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AZM Flow - نظام إدارة وتشغيل التوصيل",
  description: "نظام إدارة وتشغيل شركة عزم للخدمات اللوجستية",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body className="min-h-screen bg-brand-light-bg font-sans">{children}</body>
    </html>
  );
}
