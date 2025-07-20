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
    if (!data.sample_type) newErrors.sample_type = "Sample type is required.";
    if (!data.location) newErrors.location = "Location is required.";
    if (!data.collected_at || isNaN(Date.parse(data.collected_at)))
      newErrors.collected_at = "Valid collection date and time is required.";

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

  if (loading) return <p className="text-center py-10 text-gray-500">Loading sample...</p>;
  if (!sample) return <p className="text-center py-10 text-red-600">Sample not found.</p>;

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md space-y-6"
      noValidate
    >
      <h2 className="text-2xl font-semibold text-gray-900">Edit Sample</h2>

      <div className="space-y-5 bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
        {/* Sample Type */}
        <div>
          <label
            htmlFor="sample_type"
            className="block mb-1 font-medium text-gray-700"
          >
            Sample Type <span className="text-red-500">*</span>
          </label>
          <select
            id="sample_type"
            name="sample_type"
            value={form.sample_type || ""}
            onChange={handleChange}
            className={`w-full rounded-md border px-3 py-2 text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-400 transition
              ${errors.sample_type ? "border-red-500 focus:ring-red-400" : "border-gray-300"}`}
            aria-invalid={!!errors.sample_type}
            aria-describedby="error-sample_type"
          >
            <option value="">Select sample type</option>
            {sampleTypes.map((type) => (
              <option key={type} value={type}>
                {formatSampleType(type)}
              </option>
            ))}
          </select>
          {errors.sample_type && (
            <p id="error-sample_type" className="mt-1 text-sm text-red-600">
              {errors.sample_type}
            </p>
          )}
        </div>

        {/* Location */}
        <div>
          <label
            htmlFor="location"
            className="block mb-1 font-medium text-gray-700"
          >
            Location <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={form.location || ""}
            onChange={handleChange}
            placeholder="Enter location"
            className={`w-full rounded-md border px-3 py-2 text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-400 transition
              ${errors.location ? "border-red-500 focus:ring-red-400" : "border-gray-300"}`}
            aria-invalid={!!errors.location}
            aria-describedby="error-location"
          />
          {errors.location && (
            <p id="error-location" className="mt-1 text-sm text-red-600">
              {errors.location}
            </p>
          )}
        </div>

        {/* Collection Date */}
        <div>
          <label
            htmlFor="collected_at"
            className="block mb-1 font-medium text-gray-700"
          >
            Collection Date <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            id="collected_at"
            name="collected_at"
            value={toDatetimeLocal(form.collected_at || sample.collected_at)}
            onChange={handleChange}
            className={`w-full rounded-md border px-3 py-2 text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-400 transition
              ${errors.collected_at ? "border-red-500 focus:ring-red-400" : "border-gray-300"}`}
            aria-invalid={!!errors.collected_at}
            aria-describedby="error-collected_at"
          />
          {errors.collected_at && (
            <p id="error-collected_at" className="mt-1 text-sm text-red-600">
              {errors.collected_at}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={editingId === batch_number || !isValid}
          className={`px-5 py-2 rounded-md font-semibold text-white transition
            ${
              editingId === batch_number || !isValid
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-400"
            }`}
          aria-disabled={editingId === batch_number || !isValid}
        >
          {editingId === batch_number ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
