"use client";

import { useState } from "react";
import api from "@/lib/api";
import { TestCreate } from "@/types/test";
import { useRouter } from "next/navigation";
import Link from "next/link";

const testParameters = ["pH", "tds", "colour", "density", "turbidity", "tss", "minute_sugar", "ash", "sediment", "starch", "particle_size", "cao", "purity", "moisture", "sucrose"]; // add more as needed
const statusOptions = ["pending", "cancelled", "approved", "rejected"];
const uitOptions = ["%", "g", "mg/kg", "ppm", "mL", "µm", "mm", "mg/L", "IU", "g/m³", "g/cm³", "NTU", "nm", "pH", "dimensionless", "other" ];

export default function TestForm() {
  const router = useRouter();

  const [form, setForm] = useState<TestCreate>({
    sample_batch_number: "",
    parameter: "",
    value: 0,
    unit: "",
    status: "",
    entered_by: "",
    entered_at: "",
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/tests/", {
        ...form,
        entered_at: new Date(form.entered_at).toISOString(),
      });
      alert("Test created!");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || "Test creation failed");
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="bg-white p-6 rounded-lg shadow-md mb-6 space-y-4"
    >
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Create New Test</h3>
        <Link href="/dashboard/tests" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Back</Link>
      </div>

      <input 
        type="text" 
        name="sample_batch_number" 
        placeholder="Sample Batch Number"
        value={form.sample_batch_number}
        onChange={handleChange}
        className="w-full border p-2 rounded text-gray-900"/>

      <select
        name="parameter"
        value={form.parameter}
        onChange={handleChange}
        className="w-full border p-2 rounded text-gray-900"
      >
        <option value="">Select a parameter</option>
        {testParameters.map((parameter) => (
          <option key={parameter} value={parameter}>
            {parameter}
          </option>
        ))}
      </select>

      <input
        type="number"
        name="value"
        value={form.value}
        onChange={handleChange}
        className="w-full p-2 border  rounded-md text-gray-900"
      />

      <select
        name="unit"
        value={form.unit}
        onChange={handleChange}
        className="w-full p-2 border  rounded-md text-gray-900"
      >
        <option value="">Select a unit</option>
        {uitOptions.map((unit) => (
          <option key={unit} value={unit}>
            {unit}
          </option>
        ))}
      </select>

      <select
        name="status"
        value={form.status}
        onChange={handleChange}
        className="w-full p-2 border  rounded-md text-gray-900"
      >
        <option value="">Select a status</option>
        {statusOptions.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>

      <input
        type="text"
        name="entered_by"
        placeholder="Entered By (Employee ID)"
        value={form.entered_by}
        onChange={handleChange}
        className="w-full p-2 border  rounded-md text-gray-900"
      />

      <input
        type="datetime-local"
        name="entered_at"
        value={form.entered_at}
        onChange={handleChange}
        className="w-full p-2 border  rounded-md text-gray-900"
      />

      <textarea
        name="notes"
        placeholder="Notes (optional)"
        value={form.notes}
        onChange={handleChange}
        className="w-full p-2 border  rounded-md text-gray-900"
      />

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
      >
        Create Test
      </button>
    </form>
  )
};