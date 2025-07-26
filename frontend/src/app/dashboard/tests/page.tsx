"use client";

import { useState } from "react";
import Link from "next/link";
import TestList from "@/components/tests/TestTable";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { RefreshCw, Plus } from "lucide-react";
import { motion } from "framer-motion";

type SampleDetailsPageProps = {
  params: { 
    batch_number: string
    sample_type?: string
  };
};

export default function SampleDetailsPage({ params }: SampleDetailsPageProps) {
  const [refreshTests, setRefreshTests] = useState(false);

  const handleRefresh = () => setRefreshTests((prev) => !prev);

  return (
    <ProtectedRoute>
      <section className="max-w-7xl mx-auto px-6 py-10">
        {/* Header Section */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8"
          >

            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight select-none"
              >
              Test Results for Batch #{params.batch_number || "N/A"}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Manage and review all tests for this batch.
              </p>
            </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              aria-label="Refresh test results"
              className="flex items-center justify-center p-3 rounded-lg border border-gray-300 hover:border-green-600 transition-colors shadow-sm text-gray-600 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1"
              title="Refresh Test Results"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            {/* Create Test Button */}
            <Link
              href={`/dashboard/tests/create?batch_number=${params.sample_type || "N/A"}`}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-transform hover:scale-[1.05] active:scale-95 select-none"
              aria-label="Create new test"
            >
              <Plus className="w-5 h-5" />
              Create Test
            </Link>
          </div>
        </motion.header>

        {/* Test List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="overflow-hidden rounded-xl border border-gray-200 shadow-md"
        >
          <TestList key={refreshTests ? "refresh-true" : "refresh-false"} />
        </motion.div>
      </section>
    </ProtectedRoute>
  );
}
