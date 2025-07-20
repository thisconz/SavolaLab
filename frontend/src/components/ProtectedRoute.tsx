"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
  redirectTo?: string;          // Redirect if not authenticated
  unauthorizedRedirectTo?: string; // Redirect if role not authorized
}

export default function ProtectedRoute({
  children,
  roles,
  redirectTo = "/login",
  unauthorizedRedirectTo = "/unauthorized",
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace(redirectTo);
      } else if (roles && !roles.includes(user.role)) {
        router.replace(unauthorizedRedirectTo);
      }
    }
  }, [loading, user, roles, router, redirectTo, unauthorizedRedirectTo]);

  if (loading) {
    return (
      <div
        className="flex justify-center items-center h-screen"
        role="status"
        aria-live="polite"
        aria-label="Loading authentication status"
      >
        <svg
          className="animate-spin h-10 w-10 text-green-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      </div>
    );
  }

  // If user is null but not loading, redirect is in progress
  // Render nothing while router.replace works
  if (!user || (roles && !roles.includes(user.role))) {
    return null;
  }

  return <>{children}</>;
}
