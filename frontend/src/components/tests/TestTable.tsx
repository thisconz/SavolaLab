"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Test, TestListProps } from "@/types/test";
import TestDelete from "./TestDelete";

export default function TestTable({ batch_number }: TestListProps) {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

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
              Entered By
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
              Actions
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
              <td className="px-6 py-4 whitespace-nowrap">{test.status}</td>
              <td className="px-6 py-4 whitespace-nowrap">{test.entered_by || "—"}</td>
              <td className="px-6 py-4 whitespace-nowrap"><TestDelete/></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}