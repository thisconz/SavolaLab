'use client';

import TestCreateForm from "@/components/tests/TestCreateForm";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState } from "react";
import Link from "next/link";


export default function CreateTestPage({ params }: { params: { batch_number: string } }) { 
    const [refreshTests, setRefreshTests] = useState(false);
    
    return (
        <ProtectedRoute>
            <form className="bg-white p-6 rounded-lg shadow-md mb-6 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Create Test Result</h2>
                    <div className="flex space-x-4">
                        <Link href="/dashboard/tests" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">Back</Link>
                    </div>
                </div>
                <TestCreateForm
                    batch_number={params.batch_number}
                    onTestCreated={() => setRefreshTests(!refreshTests)}
                /> 
            </form>
        </ProtectedRoute>
    );
}