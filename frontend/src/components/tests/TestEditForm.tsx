"use client";

import { useState, useEffect } from "react";
import { Test } from "@/types/test";
import { testParameters, statusOptions, unitOptions } from "@/constants/Test";
import { formatTestStatus, toDatetimeLocal } from "@/utils/format";
import { useTestsByBatch } from "@/hooks/test/useTestsByBatch";
import { useEditTests } from "@/hooks/test/useEditTests";
import { TestEditProps } from "@/types/test";

export default function TestEdit({ test, onSuccess, onCancel }: TestEditProps) {
  const { tests, loading, refetch } = useTestsByBatch(test.sample_batch_number);
  const { editTest, editingId } = useEditTests();

  const [form, setForm] = useState<Partial<Test>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (tests && tests.length > 0) {
      const initial = { ...tests[0], entered_at: toDatetimeLocal(tests[0].entered_at) };
      setForm(initial);
      validate(initial);
    }
  }, [tests]);

  const validate = (data: Partial<Test>) => {
    const newErrors: Record<string, string> = {};
    if (!data.parameter) newErrors.parameter = "Parameter is required";
    if (data.value === undefined || data.value === null) newErrors.value = "Value is required";
    if (!data.unit) newErrors.unit = "Unit is required";
    if (!data.status) newErrors.status = "Status is required";
    if (!data.entered_by) newErrors.entered_by = "Entered by is required";
    if (!data.entered_at || isNaN(new Date(data.entered_at).getTime())) newErrors.entered_at = "Valid date and time is required";

    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const updatedValue =
      name === "entered_at" ? new Date(value).toISOString() : name === "value" ? Number(value) : value;

    const updatedForm = { ...form, [name]: updatedValue };
    setForm(updatedForm);
    validate(updatedForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(form)) return;

    const result = await editTest(test.id, form);
    if (result.success) {
      onSuccess?.();
      refetch();
    } else {
      alert(result.error || "Failed to update test");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto
                 space-y-6
                 text-gray-800
                 font-sans
                 "
      style={{ fontFeatureSettings: "'liga' 0" }}
    >
      <div>
        <label htmlFor="parameter" className="block text-sm font-medium mb-1 text-gray-700">
          Parameter <span className="text-red-500">*</span>
        </label>
        <select
          id="parameter"
          name="parameter"
          value={form.parameter || ""}
          onChange={handleChange}
          className={`w-full rounded-md border px-4 py-3
            text-gray-900 text-base
            bg-gray-50
            focus:outline-none focus:ring-2 focus:ring-green-400
            transition
            ${
              errors.parameter
                ? "border-red-400 focus:ring-red-300"
                : "border-gray-300 focus:ring-green-400"
            }`}
          aria-invalid={!!errors.parameter}
          aria-describedby="parameter-error"
        >
          <option value="" disabled>
            Select a parameter
          </option>
          {testParameters.map((param) => (
            <option key={param} value={param}>
              {param}
            </option>
          ))}
        </select>
        {errors.parameter && (
          <p id="parameter-error" className="mt-1 text-xs text-red-500">
            {errors.parameter}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="value" className="block text-sm font-medium mb-1 text-gray-700">
          Value <span className="text-red-500">*</span>
        </label>
        <input
          id="value"
          name="value"
          type="number"
          step="any"
          value={form.value ?? ""}
          onChange={handleChange}
          className={`w-full rounded-md border px-4 py-3
            text-gray-900 text-base
            bg-gray-50
            focus:outline-none focus:ring-2 focus:ring-green-400
            transition
            ${
              errors.value ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-green-400"
            }`}
          aria-invalid={!!errors.value}
          aria-describedby="value-error"
        />
        {errors.value && (
          <p id="value-error" className="mt-1 text-xs text-red-500">
            {errors.value}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="unit" className="block text-sm font-medium mb-1 text-gray-700">
          Unit <span className="text-red-500">*</span>
        </label>
        <select
          id="unit"
          name="unit"
          value={form.unit || ""}
          onChange={handleChange}
          className={`w-full rounded-md border px-4 py-3
            text-gray-900 text-base
            bg-gray-50
            focus:outline-none focus:ring-2 focus:ring-green-400
            transition
            ${
              errors.unit ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-green-400"
            }`}
          aria-invalid={!!errors.unit}
          aria-describedby="unit-error"
        >
          <option value="" disabled>
            Select a unit
          </option>
          {unitOptions.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
        {errors.unit && (
          <p id="unit-error" className="mt-1 text-xs text-red-500">
            {errors.unit}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium mb-1 text-gray-700">
          Status <span className="text-red-500">*</span>
        </label>
        <select
          id="status"
          name="status"
          value={form.status || ""}
          onChange={handleChange}
          className={`w-full rounded-md border px-4 py-3
            text-gray-900 text-base
            bg-gray-50
            focus:outline-none focus:ring-2 focus:ring-green-400
            transition
            ${
              errors.status ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-green-400"
            }`}
          aria-invalid={!!errors.status}
          aria-describedby="status-error"
        >
          <option value="" disabled>
            Select a status
          </option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {formatTestStatus(status)}
            </option>
          ))}
        </select>
        {errors.status && (
          <p id="status-error" className="mt-1 text-xs text-red-500">
            {errors.status}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="entered_by" className="block text-sm font-medium mb-1 text-gray-700">
          Entered By <span className="text-red-500">*</span>
        </label>
        <input
          id="entered_by"
          name="entered_by"
          type="text"
          value={form.entered_by || ""}
          onChange={handleChange}
          className={`w-full rounded-md border px-4 py-3
            text-gray-900 text-base
            bg-gray-50
            focus:outline-none focus:ring-2 focus:ring-green-400
            transition
            ${
              errors.entered_by
                ? "border-red-400 focus:ring-red-300"
                : "border-gray-300 focus:ring-green-400"
            }`}
          aria-invalid={!!errors.entered_by}
          aria-describedby="enteredby-error"
        />
        {errors.entered_by && (
          <p id="enteredby-error" className="mt-1 text-xs text-red-500">
            {errors.entered_by}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="entered_at" className="block text-sm font-medium mb-1 text-gray-700">
          Entered At <span className="text-red-500">*</span>
        </label>
        <input
          id="entered_at"
          name="entered_at"
          type="datetime-local"
          value={form.entered_at || ""}
          onChange={handleChange}
          className={`w-full rounded-md border px-4 py-3
            text-gray-900 text-base
            bg-gray-50
            focus:outline-none focus:ring-2 focus:ring-green-400
            transition
            ${
              errors.entered_at
                ? "border-red-400 focus:ring-red-300"
                : "border-gray-300 focus:ring-green-400"
            }`}
          aria-invalid={!!errors.entered_at}
          aria-describedby="enteredat-error"
        />
        {errors.entered_at && (
          <p id="enteredat-error" className="mt-1 text-xs text-red-500">
            {errors.entered_at}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium mb-1 text-gray-700">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={form.notes || ""}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-300 px-4 py-3
            text-gray-900 text-base
            bg-gray-50
            focus:outline-none focus:ring-2 focus:ring-green-400
            transition
            resize-none"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!isValid || editingId === test.id}
          className={`px-8 py-3 rounded-lg font-semibold
            transition
            focus:outline-none focus:ring-2 focus:ring-green-500
            text-white
            ${
              !isValid || editingId === test.id
                ? "bg-green-300 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
        >
          {editingId === test.id ? "Updating..." : "Update Test"}
        </button>
      </div>
    </form>
  );
}
