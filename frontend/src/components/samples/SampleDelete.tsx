"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Sample } from "@/types/sample";

export default function SampleDelete() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSamples = async () => {
    setLoading(true);
    try {
      const res = await api.get("/samples/");
      console.log("Fetched samples:", res.data);
      setSamples(res.data);
    } catch (err) {
      console.error("Failed to fetch samples", err);
      alert("Failed to fetch samples");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples();
  }, []);

  const handleDelete = async (sampleId: string) => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(sampleId)) {
      alert("Invalid sample ID format");
      return;
    }

    if (!confirm("Are you sure you want to delete this sample?")) return;

    setDeletingId(sampleId);
    try {
      await api.delete(`/samples/${sampleId}`);
      alert("Sample deleted");
      fetchSamples(); // refresh list
    } catch (err: any) {
      console.error("Delete failed", err);
      alert(err.response?.data?.detail || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div>Loading samples...</div>;

  return (
    <button
      onClick={() => handleDelete(samples[0].id)}
      disabled={deletingId === samples[0].id}
    >
      {deletingId === samples[0].id ? "Deleting..." : "Delete"}
    </button>
  );
}
