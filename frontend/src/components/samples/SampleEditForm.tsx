"use client";

import { useState, useEffect } from "react";
import { Sample, Props } from "@/types/sample";
import { sampleTypes } from "@/constants/Sample";
import { formatSampleType, toDatetimeLocal } from "@/utils/format";
import { useSampleByBatch } from "@/hooks/sample/useSampleByBatch";
import { useEditSample } from "@/hooks/sample/useEditSample";

export default function SampleEdit({ batch_number }: Props) {
  const { sample, loading, refetch } = useSampleByBatch(batch_number);
  const { editSample, editingId } = useEditSample();

  const [form, setForm] = useState<Partial<Sample>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (sample) {
      setForm(sample);
      validate(sample);
    }
  }, [sample]);

    const validate = (data: Partial<Sample>) => {
    const newErrors: Record<string, string> = {};
    if (!data.sample_type) newErrors.sample_type = "Sample type is required";
    if (!data.location) newErrors.location = "Location is required";
    if (!data.collected_at || isNaN(Date.parse(data.collected_at)))
      newErrors.collected_at = "Valid collection date and time is required";

    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const parsedValue = name === "collected_at" ? new Date(value).toISOString() : value;
    const updatedForm = { ...form, [name]: parsedValue };

    setForm(updatedForm);
    validate(updatedForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(form)) {
      alert("Please correct the errors before submitting.");
      return;
    }
    const result = await editSample(batch_number, form);
    if (result.success) {
      alert("Sample updated successfully");
      refetch();
    } else {
      alert(result.error);
    }
  };

  if (loading) return <p>Loading sample...</p>;
  if (!sample) return <p>Sample not found.</p>;

  return (
    <form className="bg-white p-6 rounded-lg mb-6 space-y-4" onSubmit={handleSubmit}>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Edit Sample</h2>
      </div>

      <div className="bg-white shadow rounded p-4 border border-gray-300 text-gray-800">
        {/* Sample Type */}
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">Sample Type:</label>
          <select
            name="sample_type"
            value={form.sample_type}
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

        {/* Location */}
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">Location:</label>
          <input
            type="text"
            name="location"
            value={form.location}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
          {errors.location && <p className="text-red-500">{errors.location}</p>}
        </div>

        {/* Collection Date */}
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">Collection Date:</label>
          <input
            type="datetime-local"
            name="collected_at"
            value={toDatetimeLocal(form.collected_at || sample.collected_at)}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
          {errors.collected_at && <p className="text-red-500">{errors.collected_at}</p>}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={editingId === batch_number || !isValid}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {editingId === batch_number ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
