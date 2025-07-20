"use client";

import { useSamples } from "@/hooks/sample/useSamples";
import { useDeleteSample } from "@/hooks/sample/useDeleteSample";

type SampleDeleteProps = {
  sampleId: string;
  onDeleted?: () => void;
  className?: string;
};

// SampleDelete component
export default function SampleDelete({ sampleId, onDeleted }: SampleDeleteProps) {
  const { samples, loading } = useSamples();
  const { deleteSample, deletingId } = useDeleteSample();

  // Handle delete sample
  const handleDelete = async () => {

    // Check if sample ID is valid UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(sampleId)) {
      alert("Invalid sample ID format");
      return;
    }

    // Confirm delete
    if (!confirm("Are you sure you want to delete this sample?")) return;

    const result = await deleteSample(sampleId);

    if (result.success) {
      alert("Sample deleted");
      if (onDeleted) onDeleted();
    } else {
      alert(result.error);
    }
  };

  // Render loading state
  if (loading) return <div>Loading samples...</div>;
  // Render no samples found
  if (samples.length === 0) return <div>No samples found.</div>;

  // Render sample list
  return (
    <button 
      className="text-sm px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600" 
      onClick={handleDelete}
      disabled={deletingId === sampleId}>
       {deletingId === sampleId ? "Deleting..." : "Delete"}
    </button>
  );
}
