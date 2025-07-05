"use client";

import { useState } from "react";
import api from "@/lib/api";

interface Props {
  batch_number: string;
  onTestCreated: () => void;
}

const testParameters = ["pH", "tds", "colour", "density", "turbidity", "tss", "minute_sugar", "ash", "sediment", "starch", "particle_size", "cao", "purity", "moisture", "sucrose"]; // add more as needed
const statusOptions = ["pending", "cancelled", "approved", "rejected"];
const uitOptions = ["%", "g", "mg/kg", "ppm", "mL", "µm", "mm", "mg/L", "IU", "g/m³", "g/cm³", "NTU", "nm", "pH", "dimensionless", "other" ];

export default function TestCreateForm({ batch_number, onTestCreated }: Props) {
  const [batch, setBatch] = useState(batch_number);
  const [parameter, setParameter] = useState("");
  const [value, setValue] = useState<number | "">("");
  const [unit, setUnit] = useState("");
  const [status, setStatus] = useState("pending");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!parameter || value === "" || !unit) {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      await api.post("/tests/", {
        sample_batch_number: batch_number,
        parameter,
        value,
        unit,
        status,
        notes,
      });
      alert("Test created");
      setParameter("");
      setValue("");
      setUnit("");
      setStatus("pending");
      setNotes("");
      onTestCreated();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to create test");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow mt-6 text-gray-800">
      <h2 className="text-xl font-semibold">Add New Test</h2>

      <div>
        <label className="block font-medium">Batch#</label>
        <input
          type="text"
          value={batch}
          onChange={(e) => setBatch(e.target.value)}
          className="border p-2 w-full rounded"
          />
      </div>

      <div>
        <label className="block font-medium">Parameter</label>
        <select
          value={parameter}
          onChange={(e) => setParameter(e.target.value)}
          className="border p-2 w-full rounded"
        >
          <option value="">Select parameter</option>
          {testParameters.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-medium">Value</label>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="border p-2 w-full rounded"
          step="any"
          required
        />
      </div>

      <div>
        <label className="block font-medium">Unit</label>
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="border p-2 w-full rounded"
        >
          <option value="">Select unit</option>
          {uitOptions.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-medium">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border p-2 w-full rounded"
        >
          <option value="">Select status</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-medium">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="border p-2 w-full rounded"
          rows={3}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Add Test"}
      </button>
    </form>
  );
}
