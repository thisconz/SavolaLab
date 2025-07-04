import ProtectedRoute from "@/components/ProtectedRoute";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Welcome to SavolaLab</h2>
        <p className="text-gray-900">Use the sidebar to manage samples and test results.</p>
      </div>
    </ProtectedRoute>
  );
}
