"use client";

import { useState } from "react";
import Link from "next/link";
import TestList from "@/components/tests/TestTable";
import ProtectedRoute from "@/components/ProtectedRoute";
import { RefreshCw, Plus } from "lucide-react";

type SampleDetailsPageProps = {
  params: { batch_number: string };
};

export default function SampleDetailsPage({ params }: SampleDetailsPageProps) {
  const [refreshTests, setRefreshTests] = useState(false);
  const handleRefresh = () => setRefreshTests((prev) => !prev);

  return (
    <ProtectedRoute>
      <section className="bg-white p-8 rounded-2xl shadow-xl mb-12 max-w-full max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-6">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight select-none">
            Test Results{" "}
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
              href={`/dashboard/tests/create?batch_number=${params.batch_number}`}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-transform hover:scale-[1.05] active:scale-95 select-none"
              aria-label="Create new test"
            >
              <Plus className="w-5 h-5" />
              Create Test
            </Link>

            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded transition"
              aria-label="Refresh test results"
            >
            </button>
          </div>
        </header>

        <TestList key={refreshTests ? "refresh-true" : "refresh-false"} />
      </section>
    </ProtectedRoute>
  );
}
