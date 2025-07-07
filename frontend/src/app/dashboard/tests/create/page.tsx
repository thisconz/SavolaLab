'use client';

import TestCreateForm from "@/components/tests/TestCreateForm";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState } from "react";


export default function CreateTestPage({ params }: { params: { batch_number: string } }) { 
    const [refreshTests, setRefreshTests] = useState(false);
    
    return (
        <ProtectedRoute>
                <TestCreateForm/> 
        </ProtectedRoute>
    );
}