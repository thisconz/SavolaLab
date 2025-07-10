"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { JwtPayload, AuthContextType } from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to check expiry
const isTokenExpired = (exp: number): boolean => {
  return Date.now() >= exp * 1000;
};

// Provider component to wrap around the app
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ username: string; role: string; full_name: string; department: string } | null>(null);
  const router = useRouter();

  // Initial token check
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      try {
        const decoded = jwtDecode<JwtPayload>(storedToken);
        console.log("Decoded Token:", decoded);
        if (isTokenExpired(decoded.exp)) {
          logout();
        } else {
          setTokenState(storedToken);
          setUser({ username: decoded.sub, role: decoded.role, full_name: decoded.full_name, department: decoded.department });
        }
      } catch {
        logout();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setLoading(false);
  }, []);

  // Token setter
  const setToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem("token", newToken);
      try {
        const decoded = jwtDecode<JwtPayload>(newToken);
        setUser({ username: decoded.sub, role: decoded.role, full_name: decoded.full_name, department: decoded.department });
      } catch {
        setUser(null);
      }
    } else {
      localStorage.removeItem("token");
      setUser(null);
    }
    setTokenState(newToken);
  };

  // Logout function
  const logout = () => {
    setToken(null);
    router.push("/login");
  };

  // Redirect to login if token is expired
  return (
    <AuthContext.Provider value={{ token, setToken, logout, loading, user }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to access the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
