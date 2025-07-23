"use client";

import { useSamples } from "@/hooks/sample/useSamples";
import { useDeleteSample } from "@/hooks/sample/useDeleteSample";
import { Trash2 } from "lucide-react";
import { useState } from "react";

type SampleDeleteProps = {
  sampleId: string;
  onDeleted?: () => void;
  className?: string;
};

export default function SampleDelete({ sampleId, onDeleted, className }: SampleDeleteProps) {
  const { samples, loading } = useSamples();
  const { deleteSample, deletingId } = useDeleteSample();
  const [confirming, setConfirming] = useState(false);

  const handleDelete = async () => {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sampleId)) {
      alert("Invalid sample ID format");
      return;
    }

    // Delete request
    const result = await deleteSample(sampleId);
    if (result.success) {
      alert("Sample deleted successfully.");
      if (onDeleted) onDeleted();
    } else {
      alert(result.error || "Failed to delete sample.");
    }
    setConfirming(false);
  };

  if (loading) return <div className="text-gray-500 text-sm">Loading...</div>;
  if (samples.length === 0) return <div className="text-gray-500 text-sm">No samples found.</div>;

  return (
    <div className="relative inline-block">
      {/* Delete Button */}
      {!confirming ? (
        <button
          className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-red-500 text-white rounded-md shadow hover:bg-red-600 transition-colors ${className}`}
          onClick={() => setConfirming(true)}
          disabled={deletingId === sampleId}
        >
          <Trash2 className="w-4 h-4" />
          {deletingId === sampleId ? "Deleting..." : "Delete"}
        </button>
      ) : (
        <div className="flex gap-2 items-center">
          <button
            className="px-2 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            onClick={() => setConfirming(false)}
          >
            Cancel
          </button>
          <button
            className="px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            onClick={handleDelete}
            disabled={deletingId === sampleId}
          >
            {deletingId === sampleId ? "Deleting..." : "Confirm"}
          </button>
        </div>
      )}
    </div>
  );
}
