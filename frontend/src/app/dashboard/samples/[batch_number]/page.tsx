"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getSampleByBatchNumber } from "@/lib/samples";
import { getAttachmentsBySample } from "@/lib/attachments";
import { Sample } from "@/types/sample";
import AttachmentUpload from "@/components/attachments/AttachmentUpload";
import AttachmentList from "@/components/attachments/AttachmentList";
import { formatSampleType, toDatetimeLocal } from "@/utils/format";
import { ArrowLeft, RefreshCcw, Edit2, Save, X } from "lucide-react";
import { AttachmentWire } from "@/types/attatchments";

import { useEditSample } from "@/hooks/sample/useEditSample";

export default function SampleDetailsPage() {
  const params = useParams();
  const batchNumber = params?.batch_number as string;

  // Sample State
  const [sample, setSample] = useState<Sample | null>(null);
  const [attachments, setAttachments] = useState<AttachmentWire[]>([]);
  const [loading, setLoading] = useState(true);
  const [sampleError, setSampleError] = useState<string | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Sample>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { editSample } = useEditSample();

  /** Fetch Sample */
  const fetchSample = useCallback(async () => {
    try {
      setSampleError(null);
      const data = await getSampleByBatchNumber(batchNumber);
      setSample(data);
      setEditForm(data); // preload edit form when loading sample
    } catch {
      setSampleError("Failed to fetch sample details.");
      setSample(null);
    }
  }, [batchNumber]);

  /** Fetch Attachments */
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

  /** Initialization */
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
    try {
      return new Date(sample.collected_at).toLocaleString();
    } catch {
      return sample.collected_at;
    }
  }, [sample?.collected_at]);

  // Simple validation
  const validate = (data: Partial<Sample>) => {
    const errors: Record<string, string> = {};
    if (!data.sample_type) errors.sample_type = "Sample Type is required.";
    if (!data.location) errors.location = "Location is required.";
    if (!data.collected_at || isNaN(Date.parse(data.collected_at))) errors.collected_at = "Valid collection date/time required.";
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const val = name === "collected_at" ? new Date(value).toISOString() : value;
    setEditForm((prev) => ({ ...prev, [name]: val }));
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

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse min-h-screen flex flex-col justify-center items-center bg-green-50">
        <div className="h-7 w-48 rounded bg-gradient-to-r from-green-300 via-green-200 to-green-300" />
        <div className="h-32 rounded-lg bg-gradient-to-r from-green-200 via-green-100 to-green-200 mt-4" />
        <div className="h-64 rounded-lg bg-gradient-to-r from-green-100 via-green-50 to-green-100 mt-4" />
      </div>
    );
  }

  if (!sample && sampleError) {
    return (
      <div className="p-8 space-y-4 text-center min-h-screen flex flex-col justify-center items-center bg-green-50">
        <p className="text-red-600 font-semibold">{sampleError}</p>
        <button onClick={init} className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
          Retry
        </button>
        <Link href="/dashboard/samples" className="text-sm text-green-700 hover:underline inline-flex items-center gap-1 mt-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Samples
        </Link>
      </div>
    );
  }

  if (!sample) {
    return (
      <div className="p-8 text-center space-y-4 min-h-screen flex flex-col justify-center items-center bg-green-50">
        <p className="text-red-600 font-semibold">Sample not found.</p>
        <Link href="/dashboard/samples" className="text-sm text-green-700 hover:underline inline-flex items-center gap-1 mt-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Samples
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-md p-6 space-y-10 border border-green-300">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-green-900">Sample Details</h1>
          <div className="flex items-center gap-4">
            {isEditing ? (
              <>
                <button
                  disabled={saving}
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-5 h-5" />
                  Save
                </button>
                <button
                  disabled={saving}
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Edit2 className="w-5 h-5" />
                Edit Sample
              </button>
            )}

            <Link href="/dashboard/samples" className="text-sm text-green-700 hover:text-green-900 transition inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back to Samples
            </Link>
          </div>
        </div>

        {/* Sample Info or Edit Form */}
        <section className="bg-white rounded-lg shadow-md p-6 space-y-4 border border-green-300 bg-gradient-to-br from-green-50 to-white">
          {sampleError && <p className="text-sm text-red-600 mb-2">{sampleError}</p>}

          {isEditing ? (
            <>
              <div>
                <label htmlFor="sample_type" className="block mb-1 font-medium text-gray-700">
                  Sample Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="sample_type"
                  name="sample_type"
                  value={editForm.sample_type || ""}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 transition ${
                    editErrors.sample_type ? "border-red-500 focus:ring-red-400" : "border-gray-300"
                  }`}
                >
                  <option value="">Select sample type</option>
                  {[
                    "white",
                    "brown",
                    "raw",
                    "fine_liquor",
                    "polish_liquor",
                    "evaporator_liquor",
                    "sat_out",
                  ].map((type) => (
                    <option key={type} value={type}>
                      {formatSampleType(type)}
                    </option>
                  ))}
                </select>
                {editErrors.sample_type && <p className="text-red-600 mt-1 text-sm">{editErrors.sample_type}</p>}
              </div>

              <div>
                <label htmlFor="location" className="block mb-1 font-medium text-gray-700">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={editForm.location || ""}
                  onChange={handleInputChange}
                  placeholder="Location"
                  className={`w-full rounded-md border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 transition ${
                    editErrors.location ? "border-red-500 focus:ring-red-400" : "border-gray-300"
                  }`}
                />
                {editErrors.location && <p className="text-red-600 mt-1 text-sm">{editErrors.location}</p>}
              </div>

              <div>
                <label htmlFor="collected_at" className="block mb-1 font-medium text-gray-700">
                  Collection Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="collected_at"
                  name="collected_at"
                  type="datetime-local"
                  value={toDatetimeLocal(editForm.collected_at || sample.collected_at)}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 transition ${
                    editErrors.collected_at ? "border-red-500 focus:ring-red-400" : "border-gray-300"
                  }`}
                />
                {editErrors.collected_at && <p className="text-red-600 mt-1 text-sm">{editErrors.collected_at}</p>}
              </div>
            </>
          ) : (
            <table className="w-full border-collapse text-green-900 text-sm">
              <tbody>
                {[
                  ["Batch #", sample.batch_number],
                  ["Sample Type", formatSampleType(sample.sample_type)],
                  ["Location", sample.location || "—"],
                  ["Assigned To", sample.assigned_to || "—"],
                  ["Notes", sample.notes_text || "—"],
                  ["Collected At", collectedAt],
                  [
                    "Created At",
                    sample.created_at ? new Date(sample.created_at).toLocaleString() : "—",
                  ],
                ].map(([label, value], idx) => (
                  <tr key={label} className={idx % 2 === 0 ? "bg-green-100" : "bg-green-50"}>
                    <td className="py-3 px-4 font-semibold w-1/3">{label}</td>
                    <td className="py-3 px-4">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Attachments */}
        <section className="bg-white rounded-lg shadow-md p-6 space-y-6 border border-green-300 bg-gradient-to-br from-green-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-green-900">Attachments</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{attachments.length}</span>
            </div>
            <div className="flex items-center gap-4">
              {attachmentError && <span className="text-xs text-red-600">{attachmentError}</span>}
              <button
                onClick={fetchAttachments}
                className="flex items-center gap-1 text-sm text-green-700 hover:text-green-900 transition"
                aria-label="Refresh attachments"
              >
                <RefreshCcw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          <AttachmentUpload batchNumber={batchNumber} onUploadSuccess={fetchAttachments} />

          <AttachmentList attachments={attachments} onDelete={fetchAttachments} />
        </section>
      </div>
    </div>
  );
}
