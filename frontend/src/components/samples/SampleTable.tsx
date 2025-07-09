"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Sample } from "@/types/sample";
import SampleDelete from "./SampleDelete";
import SampleEdit from "./SampleEditForm";

interface Props {
  params: { batch_number: string };
}

export default function SampleTable( { params }: Props) {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);

  function formatSampleType(type: string): string {
    return type
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  useEffect(() => {
    const fetchSamples = async () => {
      try {
        const response = await api.get("/samples/");
        setSamples(response.data);
      } catch (err) {
        console.error("Failed to fetch samples:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSamples();
  }, []);

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
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Actions</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Edit</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 text-gray-800">
          {samples.map((sample) => (
            <tr key={sample.batch_number}>
              <td className="px-6 py-4 whitespace-nowrap">{sample.batch_number}</td>
              <td className="px-6 py-4 whitespace-nowrap">{formatSampleType(sample.sample_type)}</td>
              <td className="px-6 py-4 whitespace-nowrap">{new Date(sample.collected_at).toLocaleString()}</td>
              <td className="px-6 py-4 whitespace-nowrap">{sample.location}</td>
              <td className="px-6 py-4 whitespace-nowrap">{sample.assigned_to || "—"}</td>
              <td className="px-6 py-4 whitespace-nowrap"><SampleDelete /></td>
              <td className="px-6 py-4 whitespace-nowrap"><SampleEdit batch_number={params.batch_number} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
