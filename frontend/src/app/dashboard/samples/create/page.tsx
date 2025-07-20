import SampleForm from "@/components/samples/SampleCreateForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function CreateSamplePage() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <section className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-6 select-none">
            Create New Sample
          </h1>
          <SampleForm />
        </section>
      </main>
    </ProtectedRoute>
  );
}
