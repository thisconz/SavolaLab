import SampleTable from "@/components/samples/SampleTable";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";

export default function SamplesPage() {

  return (
    <ProtectedRoute>
      <form className="bg-white p-6 rounded-lg shadow-md mb-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Samples</h2>
          <div className="flex space-x-4">
            <Link href="/dashboard/samples/create" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Create Sample</Link>
            <Link href="/dashboard/samples/edit" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Edit Sample</Link>
            <Link href="/dashboard/samples/delete" className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">Delete</Link>
          </div>
        </div>
        <SampleTable />
      </form>
    </ProtectedRoute>
  );
}
