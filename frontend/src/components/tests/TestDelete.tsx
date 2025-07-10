"use client";

import { useTests } from "@/hooks/useTests";
import { useDeleteTests } from "@/hooks/useDeleteTests";

type TestDeleteProps = {
  testId: string;
  onDeleted?: () => void; // optional callback for refetch
};

export default function TestDelete({ testId, onDeleted }: TestDeleteProps) {
  const { tests, loading } = useTests();
  const { deleteTest, deletingId } = useDeleteTests();

  const handleDelete = async () => {

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(testId)) {
      alert("Invalid test ID format");
      return;
    }

    if (!confirm("Are you sure you want to delete this test?")) return;

    const result = await deleteTest(testId);

    if (result.success) {
      alert("Test deleted");
      if (onDeleted) onDeleted();
    } else {
      alert(result.error);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (tests.length === 0) return <p>No tests found.</p>;

  return (
    <button
      className="text-sm px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600" 
      onClick={handleDelete}
      disabled={deletingId === testId}
    >
      {deletingId === testId ? "Deleting..." : "Delete"}
    </button>
  );
}