"use client";

import { useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SampleCreate } from "@/types/sample";

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
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Create New Sample</h3>
        <Link href="/dashboard/samples" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Back</Link>
      </div>

      <select
        name="sample_type"
        value={form.sample_type}
        onChange={handleChange}
        className="w-full border p-2 rounded text-gray-900"
      >
        <option value="white_sugar">White</option>
        <option value="brown_sugar" >Brown</option>
        <option value="raw_sugar">Raw</option>
        <option value="polish_liquor">Polish Liquor</option>
        <option value="fine_liquor">Fine Liquor</option>
        <option value="evaporator_liquor">Evaporator Liquor</option>
        <option value="sat_out">SAT Out</option>
        <option value="condensate">Condensate</option>
        <option value="cooling_water">Cooling Water</option>
        <option value="wash_water">Wash Water</option>
      </select>

      <input
        name="collected_at"
        type="datetime-local"
        value={form.collected_at}
        onChange={handleChange}
        className="w-full border p-2 rounded text-gray-900"
      />

      <input
        name="location"
        type="text"
        placeholder="Location"
        value={form.location}
        onChange={handleChange}
        className="w-full border p-2 rounded text-gray-900"
        required
      />

      <textarea
        name="notes_text"
        placeholder="Notes (optional)"
        value={form.notes_text}
        onChange={handleChange}
        className="w-full border p-2 rounded text-gray-900"
      />

      <input
        name="assigned_to"
        type="text"
        placeholder="Assigned To (Employee ID)"
        value={form.assigned_to}
        onChange={handleChange}
        className="w-full border p-2 rounded text-gray-900"
        required
      />
      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Create Sample
      </button>
    </form>
  );
}
