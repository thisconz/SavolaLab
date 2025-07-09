"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Test } from "@/types/test";

export default function TestDelete() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const res = await api.get("/tests/");
      console.log("Fetched tests:", res.data);
      setTests(res.data);
    } catch (err) {
      console.error("Failed to fetch tests", err);
      alert("Failed to fetch tests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleDelete = async (testId: string) => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(testId)) {
      alert("Invalid test ID format");
      return;
    }

    if (!confirm("Are you sure you want to delete this test?")) return;

    setDeletingId(testId);
    try {
      await api.delete(`/tests/${testId}`);
      alert("Test deleted");
      fetchTests(); // refresh list
    } catch (err: any) {
      console.error("Delete failed", err);
      alert(err.response?.data?.detail || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <button
      onClick={() => handleDelete(tests[0].id)}
      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
    >
      Delete
    </button>
  );
}