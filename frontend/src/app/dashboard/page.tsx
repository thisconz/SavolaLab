import ProtectedRoute from "@/components/ProtectedRoute";
import SamplesTestsCount from "@/components/dashboard/SamplesTestsCount";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">Dashboard</h1>
        <SamplesTestsCount />
      </div>
    </ProtectedRoute>
  );
}
