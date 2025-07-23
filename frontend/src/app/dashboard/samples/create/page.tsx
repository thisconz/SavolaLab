"use client";

import SampleForm from "@/components/samples/SampleCreateForm";
import ProtectedRoute from "@/components/ProtectedRoute";
import { motion } from "framer-motion";

export default function CreateSamplePage() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
        >
          {/* Page Title */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold text-gray-900 select-none">
              Create New Sample
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              Fill out the form below to register a new QC sample.
            </p>
          </div>

          {/* Sample Form */}
          <SampleForm />
        </motion.section>
      </main>
    </ProtectedRoute>
  );
}
