// src/app/dashboard/samples/category/[category]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { RefreshCw, Plus } from "lucide-react";
import Link from "next/link";
import SampleTable from "@/components/samples/SampleTable";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { motion } from "framer-motion";

export default function SampleCategoryPage() {
  const params = useParams<{ category: string }>();
  const category = params?.category ?? "";
  const [refreshToggle, setRefreshToggle] = useState(false);

  const handleRefresh = () => setRefreshToggle((prev) => !prev);

  const label = category.replace(/_/g, " ");

  return (
    <ProtectedRoute>
      <section className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8"
        >
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight capitalize">
              {label}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Manage and review {label} samples.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/samples/categories"
              className="text-green-700 hover:text-green-900 font-semibold"
            >
              ← Back to Categories
            </Link>

            <button
              onClick={handleRefresh}
              aria-label="Refresh samples"
              className="flex items-center justify-center p-3 rounded-lg border border-gray-200 hover:border-green-500 transition-colors shadow-sm text-gray-600 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1"
              title="Refresh Samples"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            <Link
              href={`/dashboard/samples/create?sample_type=${category}`}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-transform hover:scale-[1.05] active:scale-95 select-none"
              aria-label="Create new sample"
            >
              <Plus className="w-5 h-5" />
              Create Sample
            </Link>
          </div>
        </motion.header>

        {/* Filtered Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 overflow-auto"
        >
          <SampleTable key={refreshToggle.toString()} sampleType={category} />
        </motion.div>
      </section>
    </ProtectedRoute>
  );
}
