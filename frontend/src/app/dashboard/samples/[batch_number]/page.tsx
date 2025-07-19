"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { getSampleByBatchNumber } from "@/lib/samples";
import { getAttachmentsBySample } from "@/lib/attachments";
import { Sample } from "@/types/sample";
import AttachmentUpload from "@/components/attachments/AttachmentUpload";
import AttachmentList from "@/components/attachments/AttachmentList";
import { formatSampleType } from "@/utils/format";

interface Attachment {
  id?: string;
  attachment_id?: string;
  filename: string;
  uploaded_at?: string;
  created_at?: string;
  size_bytes?: number;
  content_type?: string;
  uploaded_by?: string;
}

export default function SampleDetailsPage() {
  const params = useParams();
  const batchNumber = params?.batch_number as string;

  const [sample, setSample] = useState<Sample | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sampleError, setSampleError] = useState<string | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  /** Fetch Sample */
  const fetchSample = useCallback(async () => {
    try {
      setSampleError(null);
      const data = await getSampleByBatchNumber(batchNumber);
      setSample(data);
    } catch (err) {
      setSampleError("Failed to fetch sample details.");
      setSample(null);
    }
  }, [batchNumber]);

  /** Fetch Attachments */
  const fetchAttachments = useCallback(async () => {
    try {
      setAttachmentError(null);
      const data = await getAttachmentsBySample(batchNumber);
      const list: Attachment[] = Array.isArray(data)
        ? data
        : (data.attachments || []);
      setAttachments(list);
    } catch (err) {
      setAttachmentError("Failed to fetch attachments.");
      setAttachments([]);
    }
  }, [batchNumber]);

  /** Orchestrated init */
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

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-6 w-64 rounded bg-gray-200" />
        <div className="h-40 rounded bg-gray-200" />
        <div className="h-56 rounded bg-gray-200" />
      </div>
    );
  }
  
  if (!sample && sampleError) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-red-600">{sampleError}</p>
        <button
          onClick={init}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
        <Link
          href="/dashboard/samples"
          className="text-sm text-blue-600 underline block"
        >
          ← Back to Samples
        </Link>
      </div>
    );
  }

    if (!sample) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-red-600">Sample not found.</p>
        <Link
          href="/dashboard/samples"
          className="text-sm text-blue-600 underline"
        >
          ← Back to Samples
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          Sample Details
        </h1>
        <Link
          href="/dashboard/samples"
          className="text-sm text-blue-600 hover:opacity-75 transition"
        >
          ← Back to Samples
        </Link>
      </div>

      {/* Sample Info */}
      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        {sampleError && (
          <p className="text-sm text-red-600 mb-2">{sampleError}</p>
        )}
        <table className="w-full">
          <tbody className="text-gray-700">
            <tr>
              <td className="py-2">Batch #</td>
              <td className="py-2">{sample.batch_number}</td>
            </tr>
            <tr>
              <td className="py-2">Sample Type</td>
              <td className="py-2">{formatSampleType(sample.sample_type)}</td>
            </tr>
            <tr>
              <td className="py-2">Location</td>
              <td className="py-2">{sample.location || "—"}</td>
            </tr>
            <tr>
              <td className="py-2">Assigned To</td>
              <td className="py-2">{sample.assigned_to || "—"}</td>
            </tr>
            <tr>
              <td className="py-2">Notes</td>
              <td className="py-2">{sample.notes_text || "—"}</td>
            </tr>
            <tr>
              <td className="py-2">Collected At</td>
              <td className="py-2">{collectedAt}</td>
            </tr>
            <tr>
              <td className="py-2">Created At</td>
              <td className="py-2">
                {sample.created_at
                  ? new Date(sample.created_at).toLocaleString()
                  : "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </section>


      {/* Attachments */}
      <section className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-800">
              Attachments
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
              {attachments.length}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {attachmentError && (
              <span className="text-xs text-red-600">
                {attachmentError}
              </span>
            )}
            <button
              onClick={fetchAttachments}
              className="text-sm text-blue-600 hover:opacity-75 transition"
            >
              ⟳ Refresh
            </button>
          </div>
        </div>

        <AttachmentUpload
          batchNumber={batchNumber}
          onUploadSuccess={fetchAttachments}
        />

        <AttachmentList
          attachments={attachments}
          onDelete={fetchAttachments}
        />
      </section>
    </div>
  );
}