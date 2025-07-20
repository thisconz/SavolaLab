"use client";

import SampleTable from "@/components/samples/SampleTable";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";
import { RefreshCw, Plus } from "lucide-react";
import { useState } from "react";

export default function SamplesPage() {
  const [refreshToggle, setRefreshToggle] = useState(false);

  // You can later hook this to SampleTable or refetch logic
  const handleRefresh = () => setRefreshToggle((prev) => !prev);

  return (
    <ProtectedRoute>
      <section className="bg-white p-8 rounded-2xl shadow-xl mb-12 max-w-full max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-6">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight select-none">
            Samples
          </h2>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              aria-label="Refresh samples"
              className="flex items-center justify-center p-3 rounded-lg border border-gray-300 hover:border-green-600 transition-colors shadow-sm text-gray-600 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1"
              title="Refresh Samples"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            <Link
              href="/dashboard/samples/create"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-transform hover:scale-[1.05] active:scale-95 select-none"
              aria-label="Create new sample"
            >
              <Plus className="w-5 h-5" />
              Create Sample
            </Link>
          </div>
        </header>

        <div className="overflow-auto rounded-xl border border-gray-200 shadow-md">
          <SampleTable key={refreshToggle.toString()} />
        </div>
      </section>
    </ProtectedRoute>
  );
}
