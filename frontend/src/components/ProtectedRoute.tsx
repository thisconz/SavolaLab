"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  roles,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        setChecking(true);
        router.replace(redirectTo);
      } else if (roles && !roles.includes(user.role)) {
        setChecking(true);
        router.replace("/unauthorized");
      } else {
        setChecking(false);
      }
    }
  }, [loading, user, roles, router, redirectTo]);

  // While loading, show a spinner or placeholder
  if (loading || checking) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-green-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}