"use client";

import TestList from "@/components/tests/TestList";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState } from "react";
import Link from "next/link";

export default function SampleDetailsPage({ params }: { params: { batch_number: string } }) {
  const [refreshTests, setRefreshTests] = useState(false);

  const handleRefresh = () => setRefreshTests((prev) => !prev);

  return (
    <ProtectedRoute>
      <div className="bg-white p-6 rounded-lg shadow-md mb-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            Tests Results {params.batch_number}
          </h2>
          <div className="flex space-x-4">
            <Link
              href={`/dashboard/tests/create?batch_number=${params.batch_number}`}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Create Test Result
            </Link>
            <Link
              href={`/dashboard/tests/edit?batch_number=${params.batch_number}`}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Edit Test Result
            </Link>
            <Link
              href={`/dashboard/tests/export?batch_number=${params.batch_number}`}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Export
            </Link>
            <Link
              href={`/dashboard/tests/import?batch_number=${params.batch_number}`}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Import
            </Link>
            <Link
              href={`/dashboard/tests/delete?batch_number=${params.batch_number}`}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Delete
            </Link>
            <button
              onClick={handleRefresh}
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              Refresh Tests
            </button>
          </div>
        </div>

        <TestList batch_number={params.batch_number} key={refreshTests ? "r1" : "r0"} />
      </div>
    </ProtectedRoute>
  );
}
