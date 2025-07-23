"use client";

import { sampleTypes } from "@/constants/Sample";
import { useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { SampleCreate } from "@/types/sample";
import { formatSampleType } from "@/utils/format";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { ArrowLeft, Save } from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

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

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/samples/", {
        ...form,
        collected_at: new Date(form.collected_at).toISOString(),
      });

      router.push("/dashboard/samples");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || "Sample creation failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className="space-y-6 rounded-2xl border border-gray-100 bg-white p-8 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-extrabold text-gray-900">Create New Sample</h3>
        <Link
          href="/dashboard/samples"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-blue-400 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      {/* Batch Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Batch Number
        </label>
        <input
          name="batch_number"
          type="text"
          placeholder="Enter batch number"
          value={form.batch_number}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400"
          required
        />
      </div>

      {/* Sample Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sample Type
        </label>
        <select
          name="sample_type"
          value={form.sample_type}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400"
          required
        >
          <option value="">-- Select Sample Type --</option>
          {sampleTypes.map((type) => (
            <option key={type} value={type}>
              {formatSampleType(type)}
            </option>
          ))}
        </select>
      </div>

      {/* Collection Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Collection Date
        </label>
        <input
          name="collected_at"
          type="datetime-local"
          value={form.collected_at}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400"
          required
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Location
        </label>
        <input
          name="location"
          type="text"
          placeholder="Enter location"
          value={form.location}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400"
          required
        />
      </div>

      {/* Assigned To */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Assigned To (Employee ID)
        </label>
        <input
          name="assigned_to"
          type="text"
          placeholder="Enter employee ID"
          value={form.assigned_to}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400"
          required
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (optional)
        </label>
        <textarea
          name="notes_text"
          placeholder="Add additional notes..."
          value={form.notes_text}
          onChange={handleChange}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={submitting}
        whileTap={{ scale: 0.96 }}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Save className="h-5 w-5" />
        {submitting ? "Creating..." : "Create Sample"}
      </motion.button>
    </motion.form>
  );
}
