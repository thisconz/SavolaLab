"use client";

import React, { ReactNode, FC, memo } from "react";
import { AuthProvider } from "@/context/AuthContext";

interface AuthProviderWrapperProps {
  children: ReactNode;
}

/**
 * Wraps application components with AuthProvider to provide authentication context.
 * Memoized to avoid unnecessary re-renders.
 */
const AuthProviderWrapper: FC<AuthProviderWrapperProps> = memo(({ children }) => {
  return <AuthProvider>{children}</AuthProvider>;
});

export default AuthProviderWrapper;
