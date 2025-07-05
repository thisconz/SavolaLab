"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Sample } from "@/types/sample";

export default function SampleTable() {
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
    <div className="overflow-x-auto bg-white shadow rounded-lg p-4">
      <table className="min-w-full table-auto text-sm rounded">
        <thead className="bg-green-700 text-left text-white text-sm font-semibold">
          <tr>
            <th className="px-4 py-2">Batch #</th>
            <th className="px-4 py-2">Type</th>
            <th className="px-4 py-2">Collected At</th>
            <th className="px-4 py-2">Location</th>
            <th className="px-4 py-2">Assigned To</th>
          </tr>
        </thead>
        <tbody>
          {samples.map((sample) => (
            <tr key={sample.batch_number} className="border-t">
              <td className="px-4 py-2 font-medium text-gray-900">{sample.batch_number}</td>
              <td className="px-4 py-2 text-gray-900">{formatSampleType(sample.sample_type)}</td>
              <td className="px-4 py-2 text-gray-900">{new Date(sample.collected_at).toLocaleString()}</td>
              <td className="px-4 py-2 text-gray-900">{sample.location}</td>
              <td className="px-4 py-2 text-gray-900">{sample.assigned_to || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
