"use client";

import { useState } from "react";
import SampleDelete from "@/components/samples/SampleDelete";
import SampleEdit from "@/components/samples/SampleEditForm";
import TestCreateForm from "@/components/tests/TestCreateForm";
import { Sample } from "@/types/sample";
import { Test } from "@/types/test";
import { useSamples } from "@/hooks/sample/useSamples";
import { formatSampleType } from "@/utils/format";
import Link from "next/link";

export default function SampleTable() {
  const { samples, loading, refetch } = useSamples();
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [testSample, setTestSample] = useState<Sample | null>(null);

  if (!samples) return <div>No samples found</div>;
  if (loading) return <div>Loading samples...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Batch #</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
              Details / Attachments
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Delete</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Edit</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Create Test Result</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 text-gray-800">
          {samples.map(s => (
            <tr key={s.batch_number}>
              <td className="px-6 py-4 whitespace-nowrap">{s.batch_number}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/dashboard/samples/${s.batch_number}`}
                  className="text-blue-600 hover:text-blue-800 font-semibold"
                >
                  View
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap"><SampleDelete sampleId={s.id} onDeleted={refetch} /></td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => setSelectedSample(s)}
                  className="text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Edit
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => setTestSample(s)}
                  className="text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Create Test Result
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedSample && (
        <div role="dialog"
          aria-modal="true"
          aria-labelledby="edit-sample-title"
          className="fixed inset-0 z-10 bg-black bg-opacity-50 flex items-center justify-center"
          onClick={() => setSelectedSample(null)}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-xl shadow-lg relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedSample(null)}
              aria-label="Close edit sample modal"
              className="absolute top-2 right-3 text-gray-500 hover:text-red-600 text-xl"
            >
              &times;
            </button>

            <h2 id="edit-sample-title" className="sr-only">
              Edit Sample
            </h2>

            <SampleEdit batch_number={selectedSample.batch_number} />
          </div>
        </div>
      )}

      {testSample && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-test-title"
          className="fixed inset-0 z-10 bg-black bg-opacity-50 flex items-center justify-center"
          onClick={() => setTestSample(null)}
        >
        <div
          className="bg-white rounded-lg p-6 w-full max-w-xl shadow-lg relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setTestSample(null)}
            aria-label="Close create test modal"
            className="absolute top-2 right-3 text-gray-700 hover:text-red-600 text-xl"
          >
            &times;
          </button>

            <h2 id="create-test-title" className="sr-only">
              Create Test Result
            </h2>

            <TestCreateForm batch_number={testSample.batch_number} />
          </div>
        </div>
    )}

    </div>
  );
}
