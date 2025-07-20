"use client";

import { useState } from "react";
import TestDelete from "./TestDelete";
import TestEdit from "./TestEditForm";
import { Test } from "@/types/test";
import { useTests } from "@/hooks/test/useTests";
import { formatTestStatus, formatParameter } from "@/utils/format";
import { X } from "lucide-react";

export default function TestTable() {
  const { tests, loading, refetch } = useTests();
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-green-500 animate-pulse text-lg font-semibold">
        Loading tests...
      </div>
    );
  }

  if (!tests || tests.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500 text-lg font-medium italic">
        No tests found.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg shadow-lg border border-green-300 bg-gradient-to-br from-green-50 to-white">
        <table className="min-w-full divide-y divide-green-200 text-gray-900">
          <thead className="bg-green-100">
            <tr>
              {[
                "Batch #",
                "Test Type",
                "Test Value",
                "Test Date",
                "Status",
                "Entered By",
                "Delete",
                "Edit",
              ].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide select-none text-green-800"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-green-100">
            {tests.map((test) => (
              <tr
                key={test.id}
                className="hover:bg-green-200/30 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  {test.sample_batch_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap capitalize">
                  {formatParameter(test.parameter)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-green-700 font-semibold">
                  {test.value}
                  {test.unit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {new Date(test.entered_at).toLocaleString()}
                </td>
                <td
                  className={`px-6 py-4 whitespace-nowrap font-semibold ${
                    test.status === "passed"
                      ? "text-green-700"
                      : test.status === "failed"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  {formatTestStatus(test.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap italic text-gray-700">
                  {test.entered_by || "—"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <TestDelete
                    testId={test.id}
                    onDeleted={refetch}
                    className="text-red-600 hover:text-red-800 transition"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => setSelectedTest(test)}
                    className="text-blue-700 hover:text-blue-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    aria-label={`Edit test ${test.parameter} for batch ${test.sample_batch_number}`}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for editing */}
      {selectedTest && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-test-title"
          tabIndex={-1}
          className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4"
          onClick={() => setSelectedTest(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setSelectedTest(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedTest(null)}
              aria-label="Close edit test modal"
              className="absolute top-5 right-5 text-gray-600 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 rounded"
            >
              <X className="w-7 h-7" />
            </button>

            <h2
              id="edit-test-title"
              className="text-2xl font-bold mb-6 text-gray-900"
            >
              Edit Test
            </h2>

            <TestEdit
              test={selectedTest}
              onSuccess={() => {
                setSelectedTest(null);
                refetch();
              }}
              onCancel={() => setSelectedTest(null)}
            />
          </div>
        </div>
      )}
    </>
  );
}
