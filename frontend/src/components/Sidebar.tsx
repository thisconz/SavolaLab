"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx"; // Install clsx if needed: npm i clsx

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/samples", label: "Samples" },
    { href: "/dashboard/tests", label: "Test Results" },
  ];

  return (
    <aside className="w-64 bg-white border-r h-full">
      <div className="p-4 font-bold text-xl text-green-600">SavolaLab</div>
      <nav className="flex flex-col space-y-2 px-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "px-4 py-2 rounded hover:bg-green-300 hover:text-gray-900 transition duration-300 ease-in-out",
              pathname === item.href ? "bg-green-200 text-gray-900 font-semibold" : "text-gray-900"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
