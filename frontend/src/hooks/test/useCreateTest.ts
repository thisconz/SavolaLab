import { useState } from "react";
import api from "@/lib/api";
import { TestCreate } from "@/types/test";
import { testParameters, statusOptions, unitOptions } from "@/constants/test";
import { formatTestStatus } from "@/utils/format";

export default function useCreateTest(initialBatchNumber = "") {
  const [form, setForm] = useState<TestCreate>({
    sample_batch_number: initialBatchNumber,
    parameter: "",
    value: 0,
    unit: "",
    status: "",
    entered_by: "",
    entered_at: "",
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "entered_at" ? new Date(value).toISOString() : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting test:", form);
    try {
      await api.post("/tests/", form);
      alert("Test created!");
      setForm((prev) => ({
        ...prev,
        parameter: "",
        value: 0,
        unit: "",
        status: "",
        entered_by: "",
        entered_at: "",
        notes: "",
      }));
    } catch (err: any) {
      console.error("API Error:", err.response?.data || err.message);
      alert(err.response?.data?.detail || "Test creation failed");
    }
  };

  return { form, handleChange, handleSubmit, testParameters, statusOptions, unitOptions, formatTestStatus };
}
