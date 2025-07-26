"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FlaskConical,
  FileText,
  Menu,
  ChevronsLeft,
  UserCircle2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatRole } from "@/utils/format";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/samples", label: "Samples", icon: FlaskConical },
  { href: "/dashboard/tests", label: "Test Results", icon: FileText },
  { href: "/dashboard/profile", label: "Profile", icon: UserCircle2 },
  // Add more items as needed
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
      const timer = setTimeout(() => setFullyOpen(true), 300);
      return () => clearTimeout(timer);
    }
  }, [collapsed]);

  return (
    <motion.aside
      animate={{ width: collapsed ? "5rem" : "16rem" }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className={clsx(
        "h-screen bg-white shadow-md border-r border-gray-200 flex flex-col justify-between overflow-hidden"
      )}
    >
      {/* Top Section */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-white">
        <AnimatePresence>
          {!collapsed && fullyOpen && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-2xl font-bold text-green-600"
            >
              SavolaLab
            </motion.span>
          )}
        </AnimatePresence>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-green-100 text-green-700 transition"
        >
          {collapsed ? <Menu size={20} /> : <ChevronsLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 p-3 mt-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-green-100 text-green-800 font-semibold shadow-sm"
                  : "text-gray-600 hover:bg-green-50 hover:text-green-700"
              )}
            >
              <Icon className="w-5 h-5" />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {label}
                </motion.span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom User Info */}
      {user && (
        <div className="border-t border-gray-200 px-4 py-4">
          <div className="flex items-start gap-3 text-sm">
            <UserCircle2 className="w-8 h-8 mt-1 text-gray-500 shrink-0" />
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-0.5 leading-tight"
              >
                <div className="font-semibold text-gray-800">
                  {user.full_name}
                </div>
                <div className="text-xs text-gray-600">ID: @{user.username}</div>
                <div className="text-xs text-gray-600">
                  Role: {formatRole(user.role)}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </motion.aside>
  );
}
