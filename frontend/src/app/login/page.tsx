"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogIn, UserPlus } from "lucide-react";

export default function LoginPage() {
  const [employee_id, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("username", employee_id);
      formData.append("password", password);
      formData.append("grant_type", "password");
      formData.append("scope", "");
      formData.append("client_id", "string");
      formData.append("client_secret", "string");

      const response = await api.post("/users/login", formData.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const token = response.data.access_token;
      localStorage.setItem("token", token);
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Full login error:", error);
      const detail =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        "Unknown error";
      alert("Login failed: " + detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-gray-100 px-4">
      <motion.form
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onSubmit={handleLogin}
        className="bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-xl w-full max-w-md space-y-6 border border-gray-100"
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className="text-3xl font-extrabold text-green-600">Welcome Back</h2>
          <p className="text-sm text-gray-500">Login to access SavolaLab</p>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Employee ID"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 text-gray-900 transition"
            value={employee_id}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 text-gray-900 transition"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
          >
            {loading ? (
              <span className="animate-pulse">Logging in...</span>
            ) : (
              <>
                <LogIn className="w-5 h-5" /> Login
              </>
            )}
          </button>

          <Link
            href="/create-account"
            className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
          >
            <UserPlus className="w-5 h-5" /> Create Account
          </Link>
        </div>
      </motion.form>
    </main>
  );
}
