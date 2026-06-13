import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AZM Flow - نظام إدارة وتشغيل التوصيل",
  description: "نظام إدارة وتشغيل شركة عزم للخدمات اللوجستية",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.ico", apple: "/logo.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#203860",
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
