import SampleForm from "@/components/samples/SampleCreateForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function CreateSamplePage() {
    return (
        <ProtectedRoute>
            <SampleForm /> 
        </ProtectedRoute>
    );
}