"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Test, TestListProps } from "@/types/test";

export default function TestTable({ batch_number }: TestListProps) {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  function formatTestType(type?: string): string {
    if (!type || typeof type !== "string") return "Unknown";
    return type
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await api.get("/tests/");
        console.log("Fetched tests:", response.data);
        setTests(response.data);
      } catch (err) {
        console.error("Failed to fetch tests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [batch_number]);

  if (loading) return <div>Loading tests...</div>;

  return (
    <div className="overflow-x-auto bg-white shadow rounded-lg p-4">
      <table className="min-w-full table-auto text-sm rounded">
        <thead className="bg-green-700 text-left text-white text-sm font-semibold">
          <tr>
            <th className="px-4 py-2">Batch#</th>
            <th className="px-4 py-2">Parameter</th>
            <th className="px-4 py-2">Test Result</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Entered By</th>
            <th className="px-4 py-2">Entered At</th>
          </tr>
        </thead>
        <tbody>
          {tests.map(test => (
            <tr key={test.id} className="border-t">
              <td className="px-4 py-2 font-medium text-gray-900">{test.sample_batch_number}</td>
              <td className="px-4 py-2 text-gray-900">{formatTestType(test.parameter)}</td>
              <td className="px-4 py-2 text-gray-900">{test.value} {test.unit}</td>
              <td className="px-4 py-2 text-gray-900">{test.status}</td>
              <td className="px-4 py-2 text-gray-900">{test.entered_by}</td>
              <td className="px-4 py-2 text-gray-900">{new Date(test.entered_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}