"use client";

import { useState } from "react";
import SampleDelete from "./SampleDelete";
import SampleEdit from "./SampleEditForm";
import { Sample } from "@/types/sample";
import { useSamples } from "@/hooks/useSamples";
import { formatSampleType } from "@/utils/format";

export default function SampleTable() {
  const { samples, loading, refetch } = useSamples();
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);

  
  if (!samples) return <div>No samples found</div>;
  if (loading) return <div>Loading samples...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Batch #</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Type</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Collected At</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Location</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Assigned To</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Notes</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Delete</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Edit</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 text-gray-800">
          {samples.map(s => (
            <tr key={s.batch_number}>
              <td className="px-6 py-4 whitespace-nowrap">{s.batch_number}</td>
              <td className="px-6 py-4 whitespace-nowrap">{formatSampleType(s.sample_type)}</td>
              <td className="px-6 py-4 whitespace-nowrap">{new Date(s.collected_at).toLocaleString()}</td>
              <td className="px-6 py-4 whitespace-nowrap">{s.location}</td>
              <td className="px-6 py-4 whitespace-nowrap">{s.assigned_to || "—"}</td>
              <td className="px-6 py-4 whitespace-nowrap">{s.notes_text || "—"}</td>
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

    </div>
  );
}
