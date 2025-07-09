"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [employee_id, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();

 const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
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
  }
};


  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md space-y-6"
      >
        <h2 className="text-2xl font-bold text-center text-green-600">Login</h2>
        <input 
          type="text" 
          placeholder="Employee ID" 
          className="w-full px-4 py-2 border rounded-lg text-gray-900" 
          value={employee_id} 
          onChange={(e) => setEmployeeId(e.target.value)} 
          required 
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full px-4 py-2 border rounded-lg text-gray-900"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
          Login
        </button>
        <p className="text-sm text-center text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </main>
  );
}
