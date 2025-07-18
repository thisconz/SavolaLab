// app/tests/create/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import TestCreateForm from "@/components/tests/TestCreateForm";

export default function TestCreatePage() {
  const searchParams = useSearchParams();
  const batch_number = searchParams.get("batch_number") || "";

  return (
    <div className="p-6 min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-2xl">
        <TestCreateForm batch_number={batch_number} />
      </div>
    </div>
  );
}
