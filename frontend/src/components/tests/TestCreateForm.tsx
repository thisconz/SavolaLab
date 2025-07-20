"use client";

import { useState, useCallback, useMemo, ChangeEvent, FormEvent } from "react";
import useCreateTest from "@/hooks/test/useCreateTest";
import clsx from "clsx";

interface TestCreateFormProps {
  batch_number?: string;
}

type FormKeys = keyof ReturnType<typeof useCreateTest>["form"];
type Errors = Partial<Record<FormKeys, string>>;

function InputField({
  id,
  label,
  type = "text",
  placeholder = "",
  value,
  onChange,
  error,
  readOnly = false,
}: {
  id: FormKeys;
  label: string;
  type?: string;
  placeholder?: string;
  value: any;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  readOnly?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <label
        htmlFor={id}
        className="mb-2 font-semibold text-gray-800 select-none"
      >
        {label} <span className="text-red-600 ml-1">*</span>
      </label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        aria-invalid={!!error}
        aria-describedby={error ? `error-${id}` : undefined}
        className={clsx(
          "rounded-lg border px-4 py-3 text-gray-900 transition duration-150 ease-in-out placeholder:text-gray-400",
          readOnly ? "bg-gray-100 cursor-not-allowed" : "bg-white",
          error
            ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-400"
            : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-400"
        )}
      />
      {error && (
        <p
          id={`error-${id}`}
          role="alert"
          className="mt-1 text-sm font-medium text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function SelectField({
  id,
  label,
  options,
  value,
  onChange,
  error,
}: {
  id: FormKeys;
  label: string;
  options: string[];
  value: string | undefined;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col">
      <label
        htmlFor={id}
        className="mb-2 font-semibold text-gray-800 select-none"
      >
        {label} <span className="text-red-600 ml-1">*</span>
      </label>
      <select
        id={id}
        name={id}
        value={value ?? ""}
        onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={error ? `error-${id}` : undefined}
        className={clsx(
          "rounded-lg border px-4 py-3 text-gray-900 transition duration-150 ease-in-out bg-white",
          error
            ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-400"
            : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-400"
        )}
      >
        <option value="" disabled>
          Select a {label.toLowerCase()}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {error && (
        <p
          id={`error-${id}`}
          role="alert"
          className="mt-1 text-sm font-medium text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
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

  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = useCallback(() => {
    const newErrors: Errors = {};

    if (!form.sample_batch_number) newErrors.sample_batch_number = "Batch number is required.";
    if (!form.parameter) newErrors.parameter = "Parameter is required.";
    if (form.value === undefined || form.value === null) newErrors.value = "Value is required.";
    if (!form.unit) newErrors.unit = "Unit is required.";
    if (!form.status) newErrors.status = "Status is required.";
    if (!form.entered_by) newErrors.entered_by = "Entered by is required.";
    if (!form.entered_at) newErrors.entered_at = "Entered at is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      setSubmitting(true);
      try {
        await handleSubmit(e);
      } finally {
        setSubmitting(false);
      }
    },
    [handleSubmit, validate]
  );

  const formattedStatusOptions = useMemo(
    () => statusOptions.map((s) => ({ label: formatTestStatus(s), value: s })),
    [statusOptions, formatTestStatus]
  );

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8 p-8 bg-white rounded-xl shadow-lg text-gray-900"
    >
      <InputField
        id="sample_batch_number"
        label="Sample Batch Number"
        type="text"
        placeholder="Enter sample batch number"
        value={form.sample_batch_number ?? ""}
        onChange={handleChange}
        readOnly={!!batch_number}
        error={errors.sample_batch_number}
      />

      <SelectField
        id="parameter"
        label="Parameter"
        options={testParameters}
        value={form.parameter}
        onChange={handleChange}
        error={errors.parameter}
      />

      <InputField
        id="value"
        label="Value"
        type="number"
        placeholder="Enter value"
        value={form.value ?? ""}
        onChange={handleChange}
        error={errors.value}
      />

      <SelectField
        id="unit"
        label="Unit"
        options={unitOptions}
        value={form.unit}
        onChange={handleChange}
        error={errors.unit}
      />

      <SelectField
        id="status"
        label="Status"
        options={formattedStatusOptions.map((o) => o.value)}
        value={form.status}
        onChange={handleChange}
        error={errors.status}
      />

      <InputField
        id="entered_by"
        label="Entered By"
        type="text"
        placeholder="Enter your Employee ID"
        value={form.entered_by ?? ""}
        onChange={handleChange}
        error={errors.entered_by}
      />

      <InputField
        id="entered_at"
        label="Entered At"
        type="datetime-local"
        value={form.entered_at ?? ""}
        onChange={handleChange}
        error={errors.entered_at}
      />

      <div className="sm:col-span-2 flex justify-end mt-4">
        <button
          type="submit"
          disabled={submitting}
          aria-disabled={submitting}
          aria-label="Create new test"
          className={clsx(
            "inline-block bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl shadow-lg transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-blue-700",
            submitting && "opacity-60 cursor-not-allowed"
          )}
        >
          {submitting ? "Creating..." : "Create Test"}
        </button>
      </div>
    </form>
  );
}
