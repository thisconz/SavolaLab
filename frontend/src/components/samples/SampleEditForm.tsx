"use client";

import { useState, useEffect } from "react";
import { Sample } from "@/types/sample";
import api from "@/lib/api";

interface Props {
  batch_number: string;
}

export default function SampleEditForm({ batch_number }: Props) {
  const [sample, setSample] = useState<Sample | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSample = async () => {
    try {
      const res = await api.get(`/samples/${batch_number}`);
      setSample(res.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to load sample.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSample();
  }, [batch_number]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!sample) return;
    const { name, value } = e.target;
    setSample({ ...sample, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/samples/${batch_number}`, sample);
      alert("Sample updated successfully");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to update sample");
    }
  };

  if (loading) return <p>Loading sample...</p>;
  if (!sample) return <p>Sample not found.</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow text-gray-900">
      <div>
        <label className="block font-medium">Batch Number</label>
        <input
          name="batch_number"
          value={sample.batch_number}
          disabled
          className="border p-2 w-full rounded bg-gray-100"
        />
      </div>
      <div>
        <label className="block font-medium">Sample Type</label>
        <input
          name="sample_type"
          value={sample.sample_type}
          onChange={handleChange}
          className="border p-2 w-full rounded"
        />
      </div>
      <div>
        <label className="block font-medium">Location</label>
        <input
          name="location"
          value={sample.location}
          onChange={handleChange}
          className="border p-2 w-full rounded"
        />
      </div>
      <div>
        <label className="block font-medium">Notes</label>
        <textarea
          name="notes_text"
          value={sample.notes_text}
          onChange={handleChange}
          className="border p-2 w-full rounded"
        ></textarea>
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Save Changes
      </button>
    </form>
  );
}
