"use client";

import { sampleTypes } from "@/constants/Sample";
import { useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { SampleCreate } from "@/types/sample";
import { formatSampleType } from "@/utils/format";
import Link from "next/link";

export default function SampleForm() {
  const router = useRouter();

  const [form, setForm] = useState<SampleCreate>({
    batch_number: "",
    sample_type: "",
    location: "",
    assigned_to: "",
    collected_at: "",
    notes_text: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/samples/", {
        ...form,
        collected_at: new Date(form.collected_at).toISOString(),
      });

      alert("Sample created!");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || "Sample creation failed");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg shadow-md mb-6 space-y-4"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">Create New Sample</h3>
        <Link
          href="/dashboard/samples"
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          Back
        </Link>
      </div>

      {/* Sample Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sample Type</label>
        <select
          name="sample_type"
          value={form.sample_type}
          onChange={handleChange}
          className="w-full border p-2 rounded text-gray-900"
          required
        >
          {sampleTypes.map((type) => (
            <option key={type} value={type}>
              {formatSampleType(type)}
            </option>
          ))}
        </select>
      </div>

      {/* Collection Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Collection Date</label>
        <input
          name="collected_at"
          type="datetime-local"
          value={form.collected_at}
          onChange={handleChange}
          className="w-full border p-2 rounded text-gray-900"
          required
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <input
          name="location"
          type="text"
          placeholder="Location"
          value={form.location}
          onChange={handleChange}
          className="w-full border p-2 rounded text-gray-900"
          required
        />
      </div>

      {/* Assigned To */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To (Employee ID)</label>
        <input
          name="assigned_to"
          type="text"
          placeholder="Employee ID"
          value={form.assigned_to}
          onChange={handleChange}
          className="w-full border p-2 rounded text-gray-900"
          required
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
        <textarea
          name="notes_text"
          placeholder="Additional details"
          value={form.notes_text}
          onChange={handleChange}
          className="w-full border p-2 rounded text-gray-900"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-semibold"
      >
        Create Sample
      </button>
    </form>
  );
}
