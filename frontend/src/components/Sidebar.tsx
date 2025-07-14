"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FlaskConical,
  FileText,
  Menu,
  ChevronsLeft,
  UserCircle2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/samples", label: "Samples", icon: FlaskConical },
  { href: "/dashboard/tests", label: "Test Results", icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [fullyOpen, setFullyOpen] = useState(true);
  const { user } = useAuth();

  const toggleSidebar = () => {
    if (!collapsed) setFullyOpen(false);
    setCollapsed((prev) => !prev);
  };

  useEffect(() => {
    if (!collapsed) {
      const timer = setTimeout(() => setFullyOpen(true), 700);
      return () => clearTimeout(timer);
    }
  }, [collapsed]);

  return (
    <aside
      className={clsx(
        "h-screen bg-white border-r shadow-sm transition-all duration-700 flex flex-col justify-between",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Top Section */}
      <div className="flex items-center justify-between p-4 border-b">
        {fullyOpen && (
          <span className="text-2xl font-bold text-green-600 transition-opacity">
            SavolaLab
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="text-gray-600 hover:text-green-600 transition"
        >
          {collapsed ? <Menu size={20} /> : <ChevronsLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      {fullyOpen && (
        <nav className="flex flex-col gap-1 p-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-green-100 text-green-800 font-semibold"
                    : "text-gray-700 hover:bg-green-50 hover:text-green-700"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {/* Bottom User Info */}
      {fullyOpen && user && (
        <div className="border-t px-4 py-4 flex items-start gap-3 text-sm">
          <UserCircle2 className="w-8 h-8 mt-1 text-gray-500 shrink-0" />
          <div className="space-y-0.5 leading-tight">
            <div className="font-semibold text-gray-800">{user.full_name}</div>
            <div className="text-xs text-gray-600">ID: @{user.username}</div>
            <div className="text-xs text-green-700">Role: {user.role}</div>
            <div className="text-xs text-gray-600">Department: {user.department}</div>
          </div>
        </div>
      )}
    </aside>
  );
}
