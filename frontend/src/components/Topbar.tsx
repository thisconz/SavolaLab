"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User2, ChevronDown } from "lucide-react";
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
    // You can wire this to actual account switching logic later
  };

  return (
    <header className="bg-white px-6 py-4 border-b flex justify-between items-center">
      {/* LEFT SIDE: Page + Department */}
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>
        <span className="text-xs text-gray-500">{user?.department}</span>
      </div>

      {/* RIGHT SIDE: Actions */}
      <div className="relative flex items-center gap-4">
        {/* Switch Account */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1 text-sm text-gray-700 hover:text-green-600 transition"
          >
            <User2 className="w-5 h-5" />
            <ChevronDown className="w-4 h-4" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow z-50">
              {fakeUsers.map((u) => (
                <button
                  key={u.username}
                  onClick={() => handleUserSwitch(u.username)}
                  className={clsx(
                    "w-full text-left px-4 py-2 text-sm hover:bg-green-50",
                    u.username === user?.username && "bg-green-100 font-semibold"
                  )}
                >
                  {u.full_name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
