"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  sub: string;    // username
  role: string;   // role name
  exp: number;    // expiry timestamp
}

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
  loading: boolean;
  user: { username: string; role: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setTokenState(storedToken);
      try {
        const decoded = jwtDecode<JwtPayload>(storedToken);
        setUser({ username: decoded.sub, role: decoded.role });
      } catch {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const setToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem("token", newToken);
      try {
        const decoded = jwtDecode<JwtPayload>(newToken);
        setUser({ username: decoded.sub, role: decoded.role });
      } catch {
        setUser(null);
      }
    } else {
      localStorage.removeItem("token");
      setUser(null);
    }
    setTokenState(newToken);
  };

  const logout = () => {
    setToken(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ token, setToken, logout, loading, user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
