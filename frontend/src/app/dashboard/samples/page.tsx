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
              <Link href="/dashboard/samples/create" className="bg-green-600 hover:bg-green-800 text-white font-bold py-2 px-4 rounded">Create Sample</Link>
              <Link href="/dashboard/print" className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded">Print</Link>
            </div>
        </div>
        <SampleTable />
      </form>
    </ProtectedRoute>
  );
}
