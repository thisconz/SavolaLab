"use client";

import { useState, useEffect } from "react";
import { Test } from "@/types/test";
import { testParameters, statusOptions, unitOptions } from "@/constants/Test";
import { formatTestStatus, toDatetimeLocal } from "@/utils/format";
import { useTestsByBatch } from "@/hooks/useTestsByBatch";
import { useEditTests } from "@/hooks/useEditTests";

export default function TestEdit({ test }: { test: Test }) {
  const { tests, loading, refetch } = useTestsByBatch(test.sample_batch_number);
  const { editTest, editingId } = useEditTests();

  const [form, setForm] = useState<Partial<Test>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (tests && tests.length > 0) {
      setForm(tests[0]);
      validate(tests[0]);
    }
  }, [tests]);

  const validate = (data: Partial<Test>) => {
    const newErrors: Record<string, string> = {};
    if (!data.parameter) newErrors.parameter = "Parameter is required";
    if (!data.value) newErrors.value = "Value is required";
    if (!data.unit) newErrors.unit = "Unit is required";
    if (!data.status) newErrors.status = "Status is required";
    if (!data.entered_by) newErrors.entered_by = "Entered by is required";
    if (!data.entered_at || isNaN(Date.parse(data.entered_at)))
      newErrors.entered_at = "Valid date and time is required";

    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const parsedValue = name === "entered_at" ? new Date(value).toISOString() : value;
    const updatedForm = { ...form, [name]: parsedValue };

    setForm(updatedForm);
    validate(updatedForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(form)) {
      alert("Please correct the errors before submitting.");
      return;
    }
    const result = await editTest(test.id, form);
    if (result.success) {
      alert("Test updated successfully");
      refetch();
    } else {
      alert(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Edit Test</h2>
      </div>

      <div className="flex flex-col">
        <label htmlFor="parameter">Parameter</label>
        <select
          name="parameter"
          id="parameter"
          value={form.parameter || ""}
          onChange={handleChange}
          className="border border-gray-300 rounded-md p-2"
        >
          <option value="">Select a parameter</option>
          {testParameters.map((parameter) => (
            <option key={parameter} value={parameter}>
              {parameter}
            </option>
          ))}
        </select>
        {errors.parameter && <p className="text-red-500">{errors.parameter}</p>}
      </div>
      <div className="flex flex-col">
        <label htmlFor="value">Value</label>
        <input
          type="number"
          name="value"
          id="value"
          value={form.value || ""}
          onChange={handleChange}
          className="border border-gray-300 rounded-md p-2"
        />
        {errors.value && <p className="text-red-500">{errors.value}</p>}
      </div>
      <div className="flex flex-col">
        <label htmlFor="unit">Unit</label>
        <select
          name="unit"
          id="unit"
          value={form.unit || ""}
          onChange={handleChange}
          className="border border-gray-300 rounded-md p-2"
        >
          <option value="">Select a unit</option>
          {unitOptions.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
        {errors.unit && <p className="text-red-500">{errors.unit}</p>}
      </div>
      <div className="flex flex-col">
        <label htmlFor="status">Status</label>
        <select
          name="status"
          id="status"
          value={form.status || ""}
          onChange={handleChange}
          className="border border-gray-300 rounded-md p-2"
        >
          <option value="">Select a status</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {formatTestStatus(status)}
            </option>
          ))}
        </select>
        {errors.status && <p className="text-red-500">{errors.status}</p>}
      </div>
      <div className="flex flex-col">
        <label htmlFor="entered_by">Entered By</label>
        <input
          type="text"
          name="entered_by"
          id="entered_by"
          value={form.entered_by || ""}
          onChange={handleChange}
          className="border border-gray-300 rounded-md p-2"
        />
        {errors.entered_by && <p className="text-red-500">{errors.entered_by}</p>}
      </div>
      <div className="flex flex-col">
        <label htmlFor="entered_at">Entered At</label>
        <input
          type="datetime-local"
          name="entered_at"
          id="entered_at"
          value={form.entered_at || ""}
          onChange={handleChange}
          className="border border-gray-300 rounded-md p-2"
        />
        {errors.entered_at && <p className="text-red-500">{errors.entered_at}</p>}
      </div>
      <div className="flex flex-col">
        <label htmlFor="notes">Notes</label>
        <textarea
          name="notes"
          id="notes"
          value={form.notes || ""}
          onChange={handleChange}
          className="border border-gray-300 rounded-md p-2"
        />
      </div>
      <button type="submit" disabled={!isValid} className="bg-blue-500 text-white p-2 rounded-md">
        Update Test
      </button>
    </form>
  );
}
