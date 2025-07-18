"use client";

import { useState } from "react";
import TestDelete from "./TestDelete";
import TestEdit from "./TestEditForm";
import { Test, TestProps } from "@/types/test";
import { useTests } from "@/hooks/test/useTests";
import { formatTestStatus } from "@/utils/format";


export default function TestTable() {
  const { tests, loading, refetch } = useTests();
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);

  if (!tests) {
    return <div>No tests found</div>;
  }
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
              Batch #
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
              Test Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
              Test Value
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
              Test Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
              Entered By
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
              Delete
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
              Edit
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 text-gray-800">
          {tests.map((test) => (
            <tr key={test.id}>
              <td className="px-6 py-4 whitespace-nowrap">{test.sample_batch_number}</td>
              <td className="px-6 py-4 whitespace-nowrap">{test.parameter}</td>
              <td className="px-6 py-4 whitespace-nowrap">{test.value}{test.unit}</td>
              <td className="px-6 py-4 whitespace-nowrap">{new Date(test.entered_at).toLocaleString()}</td>
              <td className="px-6 py-4 whitespace-nowrap">{formatTestStatus(test.status)}</td>
              <td className="px-6 py-4 whitespace-nowrap">{test.entered_by || "—"}</td>
              <td className="px-6 py-4 whitespace-nowrap"><TestDelete testId={test.id} onDeleted={refetch} /></td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => setSelectedTest(test)}
                  className="text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedTest && (
        <div role="dialog"
          aria-modal="true"
          aria-labelledby="edit-test-title"
          className="fixed inset-0 z-10 bg-black bg-opacity-50 flex items-center justify-center"
          onClick={() => setSelectedTest(null)}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-xl shadow-lg relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedTest(null)}
              aria-label="Close edit test modal"
              className="absolute top-2 right-3 text-gray-500 hover:text-red-600 text-xl"
            >
              &times;
            </button>

            <h2 id="edit-sample-title" className="sr-only">
              Edit Test
            </h2>
            <TestEdit test={selectedTest} />
          </div>
        </div>
      )}
    </div>
  );
}
