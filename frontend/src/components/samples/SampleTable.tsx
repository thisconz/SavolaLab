"use client";

import { useState } from "react";
import SampleDelete from "@/components/samples/SampleDelete";
import TestCreateForm from "@/components/tests/TestCreateForm";
import { Sample } from "@/types/sample";
import { useSamples } from "@/hooks/sample/useSamples";
import { formatSampleType } from "@/utils/format";
import Link from "next/link";
import { X, PackageOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SampleTable({ sampleType }: { sampleType?: string }) {
  const { samples, loading, refetch } = useSamples(sampleType);
  const [testSample, setTestSample] = useState<Sample | null>(null);

  /** Loading State */
  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-green-100 w-1/2 mx-auto rounded"></div>
          <div className="h-4 bg-green-100 w-1/3 mx-auto rounded"></div>
        </div>
        <p className="mt-4 text-green-600 font-semibold">Loading samples...</p>
      </div>
    );
  }

  /** No Data State */
  if (!samples || samples.length === 0) {
    return (
      <div className="py-20 text-center">
        <PackageOpen className="mx-auto mb-4 h-10 w-10 text-gray-400" />
        <p className="text-gray-500 font-medium italic">
          No {sampleType ? sampleType.replace(/_/g, " ") : ""} samples found.
        </p>
        <Link
          href="/dashboard/samples/create"
          className="mt-4 inline-block text-green-600 hover:text-green-800 font-semibold transition"
        >
          Create a new sample
        </Link>
        {sampleType && (
          <div className="mt-6">
            <Link
              href="/dashboard/samples/categories"
              className="text-green-700 hover:text-green-900 font-semibold inline-flex items-center gap-1"
            >
              ← Back to Categories
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {sampleType && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold capitalize">
            {sampleType.replace(/_/g, " ")} Samples
          </h3>
          <Link
            href="/dashboard/samples/categories"
            className="text-green-700 hover:text-green-900 font-semibold inline-flex items-center gap-1"
          >
            ← Back to Categories
          </Link>
        </div>
      )}

      {/* Table Wrapper */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-md">
        <table className="min-w-full divide-y divide-gray-200 text-gray-900">
          {/* Table Head */}
          <thead className="bg-gray-50">
            <tr>
              {[
                "Batch #",
                "Sample Type",
                "Details / Attachments",
                "Delete",
                "Create Test Result",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-100">
            {samples.map((s, index) => (
              <motion.tr
                key={s.batch_number}
                whileHover={{ backgroundColor: "#f0fdf4" }}
                className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="px-6 py-4 font-medium">{s.batch_number}</td>
                <td className="px-6 py-4">{formatSampleType(s.sample_type)}</td>
                <td className="px-6 py-4">
                  <Link
                    href={`/dashboard/samples/${s.batch_number}`}
                    className="text-green-700 hover:text-green-900 font-semibold transition"
                  >
                    View
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <SampleDelete
                    sampleId={s.id}
                    onDeleted={refetch}
                    className="text-red-600 hover:text-red-800 font-medium transition"
                  />
                </td>
                <td className="px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setTestSample(s)}
                    className="text-green-700 hover:text-green-900 font-semibold focus:outline-none focus:ring-2 focus:ring-green-400 rounded transition"
                  >
                    Create Test Result
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Test Result Modal */}
      <AnimatePresence>
        {testSample && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setTestSample(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setTestSample(null)}
                aria-label="Close create test modal"
                className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Modal Title */}
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                Create Test Result
              </h2>

              {/* Test Create Form */}
              <TestCreateForm batch_number={testSample.batch_number} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
