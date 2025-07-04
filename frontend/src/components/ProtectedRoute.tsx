"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !token) {
      router.push("/login");
    }
  }, [token, loading, router]);

  if (loading) {
    return <div className="p-4 text-center text-gray-600">Checking authentication...</div>;
  }

  if (!token) {
    return null; // prevent flash before redirect
  }

  return <>{children}</>;
}
