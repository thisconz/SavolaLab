"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Test, TestListProps } from "@/types/test";

export default function TestList({ batch_number }: TestListProps) {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/dashboard/");
      const testsData: Test[] = res.data.tests || [];
      const filtered = testsData.filter(
        (test) =>
          test.sample_batch_number.trim().toUpperCase() ===
          batch_number.trim().toUpperCase()
      );
      setTests(filtered);
    } catch (err: any) {
      console.error("Failed to load tests:", err);
      setError("Failed to load tests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [batch_number]);

  if (loading) return <p>Loading tests...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (tests.length === 0) return <p>No tests found.</p>;

  return (
    <div className="overflow-x-auto bg-white shadow rounded-lg p-4">
      <table className="min-w-full table-auto text-sm rounded">
        <thead className="bg-green-700 text-left text-white text-sm font-semibold">
          <tr>
            <th className="px-4 py-2">Sample Batch</th>
            <th className="px-4 py-2">Parameter</th>
            <th className="px-4 py-2">Value</th>
            <th className="px-4 py-2">Unit</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Entered By</th>
            <th className="px-4 py-2">Entered At</th>
            <th className="px-4 py-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {tests.map((test) => (
            <tr key={test.id}>
              <td className="px-4 py-2 font-medium text-gray-900">{test.sample_batch_number}</td>
              <td className="px-4 py-2 text-gray-900">{test.parameter}</td>
              <td className="px-4 py-2 text-gray-900">{test.value}</td>
              <td className="px-4 py-2 text-gray-900">{test.unit}</td>
              <td className="px-4 py-2 text-gray-900">{test.status}</td>
              <td className="px-4 py-2 text-gray-900">{test.entered_by}</td>
              <td className="px-4 py-2 text-gray-900">{new Date(test.entered_at).toLocaleString()}</td>
              <td className="px-4 py-2 text-gray-900">{test.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}