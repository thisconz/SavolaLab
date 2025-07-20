"use client";

import { useSearchParams } from "next/navigation";
import TestCreateForm from "@/components/tests/TestCreateForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TestCreatePage() {
  const searchParams = useSearchParams();
  const batch_number = searchParams.get("batch_number") || "";

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-gray-100 flex flex-col items-center justify-start py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-8 sm:p-10">
        {/* Header with back link */}
        <header className="mb-8 flex items-center space-x-4">
          <Link
            href={`/dashboard/tests?batch_number=${batch_number}`}
            className="inline-flex items-center text-green-600 hover:text-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
            aria-label="Go back to Test Results"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Tests
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex-1 text-center sm:text-left">
            Create Test {batch_number && `for Batch: `}
            <span className="text-green-600 font-semibold">{batch_number}</span>
          </h1>
        </header>

        {/* Form container */}
        <section>
          <TestCreateForm batch_number={batch_number} />
        </section>
      </div>
    </main>
  );
}
