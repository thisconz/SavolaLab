"use client";

import { useAuth } from "@/context/AuthContext";

export default function Topbar() {
  const { logout, user } = useAuth();

  return (
    <header className="bg-white px-6 py-4 border-b flex justify-between items-center">
      <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
      <div className="flex items-center space-x-4">
        <p className="text-sm text-gray-600">Full Name: {user?.full_name || "Unknown"}</p>
        <div className="w-px h-6 bg-gray-300"></div>
        <p className="text-sm text-gray-600">Username: {user?.username || "Unknown"}</p>
        <div className="w-px h-6 bg-gray-300"></div>
        <p className="text-sm text-gray-600">Role: {user?.role || "Unknown"}</p>
        <div className="w-px h-6 bg-gray-300"></div>
        <p className="text-sm text-gray-600">Department: {user?.department || "Unknown"}</p>
      </div>
      <button
        onClick={logout}
        className="text-sm px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">Logout
      </button>
    </header>
  );
}
