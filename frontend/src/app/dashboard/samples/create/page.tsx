import SampleForm from "@/components/samples/SampleForm";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function CreateSamplePage() {
    return (
        <ProtectedRoute>
            <SampleForm /> 
        </ProtectedRoute>
    );
}