"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Sample } from "@/types/sample";

export default function EditSamplesPage() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSamples = async () => {
    setLoading(true);
    try {
      const res = await api.get("/samples/");
      setSamples(res.data);
    } catch (err) {
      console.error("Failed to fetch samples", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples();
  }, []);

  if (loading) return <div>Loading samples...</div>;

  return (
    <form className="bg-white p-6 rounded-lg shadow-md mb-6 space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Edit Samples</h2>
            <Link href="/dashboard/samples" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Back</Link>
        </div>

        <div className="bg-white shadow rounded p-4 border border-gray-300 text-gray-800">
          {samples.length === 0 ? (
            <p>No samples found.</p>
          ) : (
            <ul className="space-y-2">
              {samples.map((sample) => (
                <li key={sample.id} className="flex justify-between items-center border-b py-2">
                  <div className="text-gray-900">
                    <strong>{sample.batch_number}</strong> — {sample.sample_type} — {sample.location} — {sample.assigned_to}
                  </div>
                  <Link href={`/dashboard/samples/edit/${sample.batch_number}`} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">Edit</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
    </form>
  );
}
