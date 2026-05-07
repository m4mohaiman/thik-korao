"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "user" | "admin";
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (requiredRole === "admin" && !isAdmin) {
      router.push("/");
      return;
    }
  }, [user, isAdmin, isLoading, router, requiredRole]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-3xl mb-2">🔐</div>
          <p className="text-gray-500">চেক করা হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;
  if (requiredRole === "admin" && !isAdmin) return null;

  return <>{children}</>;
}