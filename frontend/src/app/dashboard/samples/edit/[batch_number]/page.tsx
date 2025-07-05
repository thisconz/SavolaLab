'use client';

import SampleEditForm from "@/components/samples/SampleEditForm";
import Link from "next/link";

interface Props {
  params: { batch_number: string };
}

export default function EditSamplePage({ params }: Props) {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-gray-900">Edit Sample</h1>
        <div className="flex space-x-4">
          <Link
            href="/dashboard/samples/edit"
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Back
          </Link>
          <Link
            href="/dashboard/samples"
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Back to Samples
          </Link>
        </div>
      </div>

      <SampleEditForm batch_number={params.batch_number} />
    </div>
  );
}


