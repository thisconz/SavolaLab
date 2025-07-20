"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/samples": "Samples",
  "/dashboard/tests": "Test Results",
};

const fakeUsers = [
  { username: "ahmad.qc", full_name: "Ahmad Al-Sayed" },
  { username: "sara.lab", full_name: "Sara H. LabTech" },
  { username: "mohammed.chemist", full_name: "Mohammed A. Chemist" },
];

export default function Topbar() {
  const { logout, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pageTitle = pageTitles[pathname] || "Dashboard";

  const handleUserSwitch = (username: string) => {
    console.log(`Switching to user: ${username}`);
    setDropdownOpen(false);
    // Replace with real account-switching logic
  };

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 px-6 py-3 flex justify-between items-center sticky top-0 z-40">
      {/* LEFT SIDE: Page Title & Department */}
      <div className="flex flex-col">
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
          {pageTitle}
        </h1>
        {user?.department && (
          <span className="text-xs text-gray-500">{user.department}</span>
        )}
      </div>

      {/* RIGHT SIDE: Actions */}
      <div className="relative flex items-center gap-5">
        {/* Switch Account Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-50 text-gray-700 hover:bg-green-50 hover:text-green-700 transition text-sm shadow-sm"
          >
            <User2 className="w-5 h-5" />
            <ChevronDown className="w-4 h-4" />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50"
              >
                {fakeUsers.map((u) => (
                  <button
                    key={u.username}
                    onClick={() => handleUserSwitch(u.username)}
                    className={clsx(
                      "w-full text-left px-4 py-2 text-sm hover:bg-green-50 transition text-gray-700",
                      u.username === user?.username &&
                        "bg-green-100 font-semibold text-green-700"
                    )}
                  >
                    {u.full_name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-1 text-sm rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition shadow-sm"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
