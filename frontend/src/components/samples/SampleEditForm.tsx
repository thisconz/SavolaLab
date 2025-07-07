"use client";

import { useState, useEffect } from "react";
import { Sample } from "@/types/sample";
import api from "@/lib/api";

interface Props {
  batch_number: string;
}

const sampleTypes = [
  "white_sugar",
  "brown_sugar",
  "raw_sugar",
  "fine_liquor",
  "polish_liquor",
  "evaporator_liquor",
  "SAT_out",
  "condensate",
  "cooling_water",
  "wash_water",
];


export default function SampleEditForm({ batch_number }: Props) {
  const [sample, setSample] = useState<Sample | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (!sample) return;
    const { name, value } = e.target;

    const newValue = 
    name === "collected_at" ? new Date(value).toISOString() : value;
    setSample({ ...sample, [name]: newValue });
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!sample?.sample_type) {
      newErrors.sample_type = "Sample type is required";
    }

    if (!sample?.location) {
      newErrors.location = "Location is required";
    }

    if (!sample?.collected_at || isNaN(Date.parse(sample.collected_at))) {
      newErrors.collected_at = "Valid collection date and time is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      alert("Please correct the errors before submitting.");
      return;
    }

    try {
      await api.put(`/samples/${batch_number}`, sample);
      alert("Sample updated successfully");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to update sample");
    }
  };

  const isFormValid = () => {
    return (
      sample?.sample_type &&
      sample.location &&
      sample.collected_at &&
      !Object.keys(errors).length
    );
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
        className="border p-2 w-full rounded bg-gray-300"
        />
      </div>

      <div>
        <label className="block font-medium">Sample Type</label>
        <select
          name="sample_type"
          value={sample.sample_type}
          onChange={handleChange}
          className={`border p-2 w-full rounded ${
            errors.sample_type ? "border-red-500" : ""
          }`}
        >
          <option value="">Select sample type</option>
          {sampleTypes.map((type) => (
          <option key={type} value={type}>
            {type.replace(/_/g, " ")}
          </option>
        ))}
        </select>
        {errors.sample_type && (
          <p className="text-red-600 text-sm mt-1">{errors.sample_type}</p>
        )}
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
        <label className="block font-medium">Collected At</label>
        <input
        name="collected_at"
        type="datetime-local"
        value={sample.collected_at.slice(0, 16)} // trim seconds
        onChange={handleChange}
        className="border p-2 w-full rounded"
        />
      </div>

      <button
      type="submit"
      disabled={!isFormValid()}
      className={`px-4 py-2 rounded text-white ${
        isFormValid() ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
      }`}
      >
      Save Changes
      </button>
    </form>

  );
}
