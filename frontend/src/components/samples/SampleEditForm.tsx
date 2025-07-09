"use client";

import { useState, useEffect } from "react";
import { Sample, Props } from "@/types/sample";
import api from "@/lib/api";

const sampleTypes = [
  "white_sugar",
  "brown_sugar",
  "raw_sugar",
  "fine_liquor",
  "polish_liquor",
  "evaporator_liquor",
  "sat_out",
  "condensate",
  "cooling_water",
  "wash_water",
];

export default function SampleEdit({ batch_number }: Props) {
  const [sample, setSample] = useState<Sample | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  function formatSampleType(type: string): string {
    return type
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

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

  function toDatetimeLocal(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
  }

  if (loading) return <p>Loading sample...</p>;
  if (!sample) return <p>Sample not found.</p>;

  return (
    <form className="bg-white p-6 rounded-lg shadow-md mb-6 space-y-4" onSubmit={handleSubmit}>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Edit Sample</h2>
      </div>

      <div className="bg-white shadow rounded p-4 border border-gray-300 text-gray-800">

        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">Sample Type:</label>
          <select
            name="sample_type"
            value={sample.sample_type}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          >
            {sampleTypes.map((type) => (
              <option key={type} value={type}>
                {formatSampleType(type)}
              </option>
            ))}
          </select>
          {errors.sample_type && <p className="text-red-500">{errors.sample_type}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">Location:</label>
          <input
            type="text"
            name="location"
            value={sample.location}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
          {errors.location && <p className="text-red-500">{errors.location}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">Collection Date:</label>
          <input
            type="datetime-local"
            name="collected_at"
            value={toDatetimeLocal(sample.collected_at)}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
          {errors.collected_at && <p className="text-red-500">{errors.collected_at}</p>}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!isFormValid()}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}
