"use client";

import { useState } from "react";
import Link from "next/link";
import TestList from "@/components/tests/TestTable";
import ProtectedRoute from "@/components/ProtectedRoute";

type SampleDetailsPageProps = {
  params: { batch_number: string };
};

export default function SampleDetailsPage({ params }: SampleDetailsPageProps) {
  const [refreshTests, setRefreshTests] = useState(false);
  const handleRefresh = () => setRefreshTests((prev) => !prev);

  return (
    <ProtectedRoute>
      <section className="bg-white p-6 rounded-lg shadow-md mb-6 space-y-4">
        <header className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            Test Results – <span className="text-blue-800">{params.batch_number}</span>
          </h2>
          <div className="flex space-x-3">
            <Link
              href={`/dashboard/tests/create?batch_number=${params.batch_number}`}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
            >
              + Create Test
            </Link>
            <button
              type="button"
              onClick={handleRefresh}
              className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition"
            >
              ⟳ Refresh
            </button>
          </div>
        </header>

        <TestList batch_number={params.batch_number} refreshTests={refreshTests} />
      </section>
    </ProtectedRoute>
  );
}
