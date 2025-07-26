"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCcw,
  Edit2,
  Save,
  X,
} from "lucide-react";

import { getSampleByBatchNumber } from "@/lib/samples";
import { getAttachmentsBySample } from "@/lib/attachments";

import { Sample } from "@/types/sample";
import { AttachmentWire } from "@/types/attatchments";

import AttachmentUpload from "@/components/attachments/AttachmentUpload";
import AttachmentList from "@/components/attachments/AttachmentList";

import { formatSampleType, toDatetimeLocal } from "@/utils/format";
import { useEditSample } from "@/hooks/sample/useEditSample";
import { sampleTypes } from "@/constants/sample";

/* -------------------------- REUSABLE COMPONENTS -------------------------- */
const Section = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <motion.section
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="bg-white rounded-2xl shadow-xl p-10 border border-gray-100 space-y-6"
  >
    {title && <h2 className="text-3xl font-bold text-green-900">{title}</h2>}
    {children}
  </motion.section>
);

const LoadingState = () => (
  <div className="flex flex-col justify-center items-center min-h-screen bg-green-50 animate-pulse space-y-8">
    <div className="h-10 w-64 rounded bg-gradient-to-r from-green-300 via-green-200 to-green-300" />
    <div className="h-32 w-3/4 max-w-xl rounded bg-gradient-to-r from-green-200 via-green-100 to-green-200" />
    <div className="h-64 w-3/4 max-w-xl rounded bg-gradient-to-r from-green-100 via-green-50 to-green-100" />
  </div>
);

const ErrorState = ({ message, retry }: { message: string; retry?: () => void }) => (
  <div className="flex flex-col justify-center items-center min-h-screen bg-green-50 space-y-5 text-center">
    <p className="text-red-600 font-semibold text-lg">{message}</p>
    {retry && (
      <button
        onClick={retry}
        className="px-6 py-3 bg-green-600 text-white text-lg rounded-lg hover:bg-green-700 transition shadow"
      >
        Retry
      </button>
    )}
    <Link
      href="/dashboard/samples"
      className="inline-flex items-center gap-2 text-lg text-green-700 hover:text-green-900"
    >
      <ArrowLeft className="w-5 h-5" /> Back to Samples
    </Link>
  </div>
);

/* -------------------------- MAIN COMPONENT -------------------------- */
export default function SampleDetailsPage() {
  const { batch_number } = useParams();
  const batchNumber = batch_number as string;

  const [sample, setSample] = useState<Sample | null>(null);
  const [attachments, setAttachments] = useState<AttachmentWire[]>([]);
  const [loading, setLoading] = useState(true);
  const [sampleError, setSampleError] = useState<string | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Sample>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { editSample } = useEditSample();

  const fetchSample = useCallback(async () => {
    try {
      setSampleError(null);
      const data = await getSampleByBatchNumber(batchNumber);
      setSample(data);
      setEditForm(data);
    } catch {
      setSampleError("Failed to fetch sample details.");
      setSample(null);
    }
  }, [batchNumber]);

  const fetchAttachments = useCallback(async () => {
    try {
      setAttachmentError(null);
      const data = await getAttachmentsBySample(batchNumber);
      setAttachments(data);
    } catch {
      setAttachmentError("Failed to fetch attachments.");
      setAttachments([]);
    }
  }, [batchNumber]);

  const init = useCallback(async () => {
    if (!batchNumber) return;
    setLoading(true);
    await Promise.allSettled([fetchSample(), fetchAttachments()]);
    setLoading(false);
  }, [batchNumber, fetchSample, fetchAttachments]);

  useEffect(() => {
    init();
  }, [init]);

  const collectedAt = useMemo(() => {
    if (!sample?.collected_at) return "—";
    return new Date(sample.collected_at).toLocaleString();
  }, [sample?.collected_at]);

  const validate = (data: Partial<Sample>) => {
    const errors: Record<string, string> = {};
    if (!data.sample_type) errors.sample_type = "Sample Type is required.";
    if (!data.location) errors.location = "Location is required.";
    if (!data.collected_at || isNaN(Date.parse(data.collected_at)))
      errors.collected_at = "Valid collection date/time required.";
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: name === "collected_at" ? new Date(value).toISOString() : value,
    }));
  };

  const handleSave = async () => {
    if (!validate(editForm)) return;
    setSaving(true);
    try {
      await editSample(batchNumber, editForm);
      await fetchSample();
      setIsEditing(false);
      setEditErrors({});
    } catch {
      alert("Failed to save sample changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm(sample || {});
    setEditErrors({});
    setIsEditing(false);
  };

  if (loading) return <LoadingState />;
  if (!sample && sampleError) return <ErrorState message={sampleError} retry={init} />;
  if (!sample) return <ErrorState message="Sample not found." />;

  return (
    <div className="container mx-auto px-6 py-12 space-y-14 relative">
      {/* HEADER */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white shadow-xl rounded-2xl p-10 flex flex-col items-center gap-6"
      >
        <h1 className="text-4xl font-extrabold text-green-900">Sample Details</h1>
        <div className="flex flex-wrap items-center gap-4">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-lg shadow"
            >
              <Edit2 className="w-5 h-5" /> Edit Sample
            </button>
          )}
          <Link
            href="/dashboard/samples"
            className="flex items-center gap-2 text-lg text-green-700 hover:text-green-900"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Samples
          </Link>
        </div>
      </motion.header>

      {/* SAMPLE INFO */}
      <Section title="Sample Information">
        {isEditing ? (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Sample Type */}
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Sample Type <span className="text-red-500">*</span>
              </label>
              <select
                name="sample_type"
                value={editForm.sample_type || ""}
                onChange={handleInputChange}
                className={`w-full rounded-lg border px-3 py-3 text-lg focus:ring-2 focus:ring-green-400 ${
                  editErrors.sample_type ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select sample type</option>
                {sampleTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {editErrors.sample_type && <p className="text-red-600 text-sm">{editErrors.sample_type}</p>}
            </div>

            {/* Location */}
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                name="location"
                type="text"
                value={editForm.location || ""}
                onChange={handleInputChange}
                className={`w-full rounded-lg border px-3 py-3 text-lg focus:ring-2 focus:ring-green-400 ${
                  editErrors.location ? "border-red-500" : "border-gray-300"
                }`}
              />
              {editErrors.location && <p className="text-red-600 text-sm">{editErrors.location}</p>}
            </div>

            {/* Collected At */}
            <div className="md:col-span-2">
              <label className="block mb-1 font-medium text-gray-700">
                Collection Date <span className="text-red-500">*</span>
              </label>
              <input
                name="collected_at"
                type="datetime-local"
                value={toDatetimeLocal(editForm.collected_at || sample.collected_at)}
                onChange={handleInputChange}
                className={`w-full rounded-lg border px-3 py-3 text-lg focus:ring-2 focus:ring-green-400 ${
                  editErrors.collected_at ? "border-red-500" : "border-gray-300"
                }`}
              />
              {editErrors.collected_at && <p className="text-red-600 text-sm">{editErrors.collected_at}</p>}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-green-900">
            {[
              ["Batch #", sample.batch_number],
              ["Sample Type", formatSampleType(sample.sample_type)],
              ["Location", sample.location || "—"],
              ["Assigned To", sample.assigned_to || "—"],
              ["Notes", sample.notes_text || "—"],
              ["Collected At", collectedAt],
              ["Created At", sample.created_at ? new Date(sample.created_at).toLocaleString() : "—"],
            ].map(([label, value]) => (
              <div key={label} className="bg-green-50 p-5 rounded-xl shadow-sm">
                <p className="font-semibold text-lg">{label}</p>
                <p className="text-base">{value}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ATTACHMENTS */}
      <Section title="Attachments">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm px-4 py-1 rounded-full bg-green-100 text-green-700 shadow">
            {attachments.length} Files
          </span>
          <button
            onClick={fetchAttachments}
            className="flex items-center gap-1 text-green-700 hover:text-green-900"
          >
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>
        </div>
        {attachmentError && <p className="text-red-600 text-sm">{attachmentError}</p>}
        <AttachmentUpload batchNumber={batchNumber} onUploadSuccess={fetchAttachments} />
        <AttachmentList attachments={attachments} onDelete={fetchAttachments} />
      </Section>

      {/* FLOATING BAR */}
      {isEditing && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-xl px-8 py-4 flex items-center gap-6 z-50 border"
        >
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-lg disabled:opacity-50 shadow"
          >
            <Save className="w-5 h-5" /> Save
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-gray-300 rounded-lg hover:bg-gray-400 text-lg disabled:opacity-50 shadow"
          >
            <X className="w-5 h-5" /> Cancel
          </button>
        </motion.div>
      )}
    </div>
  );
}
