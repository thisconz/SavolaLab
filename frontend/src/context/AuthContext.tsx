"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { JwtPayload, AuthContextType } from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper: Check expiry
const isTokenExpired = (exp: number): boolean => Date.now() >= exp * 1000;

// Improved AuthProvider
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{
    username: string;
    role: string;
    full_name: string;
    department: string;
  } | null>(null);

  const router = useRouter();

  /** ✅ Initialize Auth State */
  useEffect(() => {
    const storedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (storedToken) validateAndSetToken(storedToken);
    setLoading(false);
  }, []);

  /** ✅ Validate token and set user */
  const validateAndSetToken = useCallback((jwt: string) => {
    try {
      const decoded = jwtDecode<JwtPayload>(jwt);
      if (isTokenExpired(decoded.exp)) {
        logout();
        return false;
      }
      setTokenState(jwt);
      setUser({
        username: decoded.sub,
        role: decoded.role,
        full_name: decoded.full_name,
        department: decoded.department,
      });

      // Auto logout when token expires
      const remainingTime = decoded.exp * 1000 - Date.now();
      setTimeout(() => logout(), remainingTime);

      return true;
    } catch {
      logout();
      return false;
    }
  }, []);

  /** ✅ Set token method */
  const setToken = useCallback(
    (newToken: string | null) => {
      if (newToken) {
        localStorage.setItem("token", newToken);
        validateAndSetToken(newToken);
      } else {
        localStorage.removeItem("token");
        setUser(null);
        setTokenState(null);
      }
    },
    [validateAndSetToken]
  );

  /** ✅ Logout method */
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    setTokenState(null);
    router.push("/login");
  }, [router]);

  /** ✅ Computed property */
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ token, setToken, logout, loading, user, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

/** ✅ Custom hook */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
