import ProtectedRoute from "@/components/ProtectedRoute";
import SampleDelete from "@/components/samples/SampleDelete";
import Link from "next/link";

export default function DeleteSamplesPage() {
  return (
    <ProtectedRoute>
      <form className="bg-white p-6 rounded-lg shadow-md mb-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Delete Samples</h2>
          <p className="text-gray-600">Delete samples by selecting them from the list below.</p>
          <Link href="/dashboard/samples" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Back</Link>
        </div>
      <SampleDelete />
      </form>
    </ProtectedRoute>
  );
}
