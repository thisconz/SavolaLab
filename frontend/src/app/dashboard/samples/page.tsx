"use client";

import SampleTable from "@/components/samples/SampleTable";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";
import { RefreshCw, Plus } from "lucide-react";
import { useState } from "react";
import { motion, Variants } from "framer-motion";

const fadeInUp: Variants =  {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function SamplesPage() {
  const [refreshToggle, setRefreshToggle] = useState(false);
  const handleRefresh = () => setRefreshToggle((prev) => !prev);

  return (
    <ProtectedRoute>
      <section className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <motion.header
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h2 className="select-none text-3xl font-extrabold text-gray-900 tracking-tight">
              Samples
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage and review all QC samples in the system.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/samples/categories"
              className="text-green-700 hover:text-green-900 font-medium transition-colors"
            >
              Browse by Category
            </Link>

            <button
              onClick={handleRefresh}
              aria-label="Refresh samples"
              title="Refresh Samples"
              className="flex items-center justify-center rounded-lg border border-gray-200 p-3 text-gray-600 shadow-sm transition-colors hover:border-green-500 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1"
            >
              <RefreshCw className="h-5 w-5" />
            </button>

            <Link
              href="/dashboard/samples/create"
              aria-label="Create new sample"
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white shadow-md transition-all hover:scale-[1.05] hover:bg-green-700 active:scale-95"
            >
              <Plus className="h-5 w-5" />
              Create Sample
            </Link>
          </div>
        </motion.header>

        {/* Table */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: 0.1 }}
          className="overflow-auto rounded-2xl border border-gray-100 bg-white p-6 shadow-lg"
        >
          <SampleTable key={refreshToggle.toString()} />
        </motion.div>
      </section>
    </ProtectedRoute>
  );
}
