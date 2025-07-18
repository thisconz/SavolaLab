"use client";
import { useState } from "react";
import useCreateTest from "@/hooks/test/useCreateTest";

interface TestCreateFormProps {
  batch_number?: string;
}

export default function TestCreateForm({ batch_number = "" }: TestCreateFormProps) {
  const {
    form,
    handleChange,
    handleSubmit,
    testParameters,
    statusOptions,
    unitOptions,
    formatTestStatus,
  } = useCreateTest(batch_number);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!form.sample_batch_number) newErrors.sample_batch_number = "Batch number is required.";
    if (!form.parameter) newErrors.parameter = "Parameter is required.";
    if (!form.value) newErrors.value = "Value is required.";
    if (!form.unit) newErrors.unit = "Unit is required.";
    if (!form.status) newErrors.status = "Status is required.";
    if (!form.entered_by) newErrors.entered_by = "Entered by is required.";
    if (!form.entered_at) newErrors.entered_at = "Entered at is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;  // Stop if invalid
    await handleSubmit(e);
  };

  return (
    <form onSubmit={onSubmit} className="text-gray-800 grid grid-cols-2 gap-4">
      {/* Sample Batch Number */}
      <div className="flex flex-col text-gray-500">
        <label htmlFor="sample_batch_number">Sample Batch Number</label>
        <input
          type="text"
          name="sample_batch_number"
          id="sample_batch_number"
          value={form.sample_batch_number || ""}
          placeholder="Sample Batch Number"
          onChange={handleChange}
          className={`border rounded-md p-2 ${errors.sample_batch_number ? "border-red-500" : "border-gray-300"}`}
          readOnly={!!batch_number}
        />
        {errors.sample_batch_number && <p className="text-red-500">{errors.sample_batch_number}</p>}
      </div>

      {/* Parameter */}
      <div className="flex flex-col">
        <label htmlFor="parameter">Parameter</label>
        <select
          id="parameter"
          name="parameter"
          value={form.parameter}
          onChange={handleChange}
          className={`border rounded-md p-2 text-gray-900 ${errors.parameter ? "border-red-500" : "border-gray-300"}`}
        >
          <option value="">Select a parameter</option>
          {testParameters.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {errors.parameter && <p className="text-red-500">{errors.parameter}</p>}
      </div>

      {/* Value */}
      <div className="flex flex-col">
        <label htmlFor="value">Value</label>
        <input
          type="number"
          name="value"
          id="value"
          value={form.value || ""}
          placeholder="Value"
          onChange={handleChange}
          className={`border rounded-md p-2 text-gray-900 ${errors.value ? "border-red-500" : "border-gray-300"}`}
        />
        {errors.value && <p className="text-red-500">{errors.value}</p>}
      </div>

      {/* Unit */}
      <div className="flex flex-col">
        <label htmlFor="unit">Unit</label>
        <select
          id="unit"
          name="unit"
          value={form.unit}
          onChange={handleChange}
          className={`border rounded-md p-2 text-gray-900 ${errors.unit ? "border-red-500" : "border-gray-300"}`}
        >
          <option value="">Select a unit</option>
          {unitOptions.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        {errors.unit && <p className="text-red-500">{errors.unit}</p>}
      </div>

      {/* Status */}
      <div className="flex flex-col">
        <label htmlFor="status">Status</label>
        <select
          id="status"
          name="status"
          value={form.status}
          onChange={handleChange}
          className={`border rounded-md p-2 text-gray-900 ${errors.status ? "border-red-500" : "border-gray-300"}`}
        >
          <option value="">Select a status</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {formatTestStatus(s)}
            </option>
          ))}
        </select>
        {errors.status && <p className="text-red-500">{errors.status}</p>}
      </div>

      {/* Entered By */}
      <div className="flex flex-col">
        <label htmlFor="entered_by">Entered By</label>
        <input
          type="text"
          name="entered_by"
          id="entered_by"
          value={form.entered_by || ""}
          placeholder="Entered By"
          onChange={handleChange}
          className={`border rounded-md p-2 text-gray-900 ${errors.entered_by ? "border-red-500" : "border-gray-300"}`}
        />
        {errors.entered_by && <p className="text-red-500">{errors.entered_by}</p>}
      </div>

      {/* Entered At */}
      <div className="flex flex-col">
        <label htmlFor="entered_at">Entered At</label>
        <input
          type="datetime-local"
          name="entered_at"
          id="entered_at"
          value={form.entered_at || ""}
          placeholder="Entered At"
          onChange={handleChange}
          className={`border rounded-md p-2 text-gray-900 ${errors.entered_at ? "border-red-500" : "border-gray-300"}`}
        />
        {errors.entered_at && <p className="text-red-500">{errors.entered_at}</p>}
      </div>
      
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
      >
        Create Test
      </button>
    </form>
  );
}
