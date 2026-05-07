"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialize = useAuthStore((state) => state.initialize);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // ✅ initialize শেষে mounted true
    initialize().finally(() => {
      setMounted(true);
    });
  }, [initialize]);

  // SSR-এ minimal HTML
  if (!mounted) {
    return (
      <html lang="bn">
        <body>
          <div className="h-screen flex items-center justify-center bg-gray-50">
            <div className="text-3xl animate-pulse">📍</div>
          </div>
        </body>
      </html>
    );
  }

  // Auth লোডিং
  if (isLoading) {
    return (
      <html lang="bn">
        <body>
          <div className="h-screen flex items-center justify-center">
            <div className="animate-spin text-3xl">📍</div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="bn" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}