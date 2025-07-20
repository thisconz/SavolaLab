"use client";

import { useState } from "react";
import SampleDelete from "@/components/samples/SampleDelete";
import TestCreateForm from "@/components/tests/TestCreateForm";
import { Sample } from "@/types/sample";
import { useSamples } from "@/hooks/sample/useSamples";
import Link from "next/link";
import { X } from "lucide-react";

export default function SampleTable() {
  const { samples, loading, refetch } = useSamples();
  const [testSample, setTestSample] = useState<Sample | null>(null);

  if (loading) {
    return (
      <div className="py-20 text-green-600 font-semibold text-center animate-pulse">
        Loading samples...
      </div>
    );
  }

  if (!samples || samples.length === 0) {
    return (
      <div className="py-20 text-gray-500 font-medium italic text-center">
        No samples found.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg shadow-lg border border-green-300 bg-gradient-to-br from-green-50 to-white">
        <table className="min-w-full divide-y divide-green-200 text-green-900">
          <thead className="bg-green-100">
            <tr>
              {["Batch #", "Details / Attachments", "Delete", "Create Test Result"].map(
                (heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide select-none"
                  >
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-green-100 bg-white">
            {samples.map((s) => (
              <tr
                key={s.batch_number}
                className="hover:bg-green-100 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4 font-medium">{s.batch_number}</td>

                <td className="px-6 py-4">
                  <Link
                    href={`/dashboard/samples/${s.batch_number}`}
                    className="text-green-700 hover:text-green-900 font-semibold transition"
                  >
                    View
                  </Link>
                </td>

                <td className="px-6 py-4">
                  <SampleDelete
                    sampleId={s.id}
                    onDeleted={refetch}
                    className="text-red-600 hover:text-red-800 transition cursor-pointer"
                  />
                </td>

                <td className="px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setTestSample(s)}
                    className="text-green-700 hover:text-green-900 font-semibold focus:outline-none focus:ring-2 focus:ring-green-400 rounded transition"
                  >
                    Create Test Result
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Remove the Edit Sample Modal entirely */}

      {/* Create Test Result Modal */}
      {testSample && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-test-title"
          tabIndex={-1}
          className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4"
          onClick={() => setTestSample(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setTestSample(null);
          }}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-xl shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setTestSample(null)}
              aria-label="Close create test modal"
              className="absolute top-4 right-4 text-green-700 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 rounded"
            >
              <X className="w-6 h-6" />
            </button>

            <h2
              id="create-test-title"
              className="text-2xl font-bold mb-6 text-green-900"
            >
              Create Test Result
            </h2>

            <TestCreateForm batch_number={testSample.batch_number} />
          </div>
        </div>
      )}
    </>
  );
}
