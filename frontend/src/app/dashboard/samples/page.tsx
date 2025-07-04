import SampleTable from "@/components/SampleTable";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function SamplesPage() {
  return (
    <ProtectedRoute>
      <div>
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Samples</h2>
          <div className="w-px h-6 bg-gray-300"></div>
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Add Sample</button>
        </div>
        <SampleTable />
      </div>
    </ProtectedRoute>
  );
}