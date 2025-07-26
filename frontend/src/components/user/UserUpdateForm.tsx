"use client";

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  FormEvent,
  ChangeEvent,
} from "react";
import useUserUpdate from "@/hooks/user/useUserUpdate";
import { userRoles, userDepartments } from "@/constants/user";
import toast from "react-hot-toast";
import clsx from "clsx";

interface UserUpdateFormProps {
  initialData?: {
    full_name?: string;
    role?: string;
    department?: string;
  };
}

type FormKeys = keyof ReturnType<typeof useUserUpdate>["form"];
type Errors = Partial<Record<FormKeys, string>>;

export default function UserUpdateForm({ initialData }: UserUpdateFormProps) {
  const { form, setForm, handleChange, handleSubmit } = useUserUpdate();
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  // Hydrate with initial values
  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({
        ...prev,
        full_name: initialData.full_name ?? "",
        role: initialData.role ?? "",
        department: initialData.department ?? "",
      }));
    }
  }, [initialData, setForm]);

  // Validation logic
  const validate = useCallback(() => {
    const newErrors: Errors = {};

    if (!form.full_name?.trim()) newErrors.full_name = "Full name is required.";
    if (!form.role) newErrors.role = "Role is required.";
    if (!form.department) newErrors.department = "Department is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const isDirty = useMemo(() => {
    return (
      form.full_name?.trim() !== initialData?.full_name?.trim() ||
      form.role !== initialData?.role ||
      form.department !== initialData?.department
    );
  }, [form, initialData]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setTouched(true);
      if (!validate()) return;

      setSubmitting(true);
      const success = await handleSubmit();
      setSubmitting(false);

      toast[success ? "success" : "error"](
        success ? "User updated successfully!" : "Failed to update user."
      );
    },
    [validate, handleSubmit]
  );

  const commonChangeHandler = <T extends HTMLInputElement | HTMLSelectElement>(
    e: ChangeEvent<T>
  ) => {
    handleChange(e);
    setTouched(true);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <FormField
        label="Full Name"
        name="full_name"
        value={form.full_name ?? ""}
        onChange={commonChangeHandler}
        error={touched ? errors.full_name : ""}
      />

      <FormSelect
        label="Role"
        name="role"
        value={form.role ?? ""}
        onChange={commonChangeHandler}
        error={touched ? errors.role : ""}
        options={userRoles}
      />

      <FormSelect
        label="Department"
        name="department"
        value={form.department ?? ""}
        onChange={commonChangeHandler}
        error={touched ? errors.department : ""}
        options={userDepartments}
      />

      <button
        type="submit"
        disabled={!isDirty || !isValid || submitting}
        className={clsx(
          "px-4 py-2 rounded-md font-medium text-white transition-all duration-200",
          !isDirty || !isValid || submitting
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        )}
      >
        {submitting ? "Updating..." : "Update"}
      </button>
    </form>
  );
}

// Reusable input component
function FormField({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-sm font-semibold">
        {label}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={`${name}-error`}
        className={clsx("border rounded-md p-2 transition-all", {
          "border-red-600": error,
          "border-gray-300": !error,
        })}
      />
      {error && (
        <p id={`${name}-error`} className="text-red-600 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}

// Reusable select dropdown
function FormSelect({
  label,
  name,
  value,
  onChange,
  error,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
  options: string[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-sm font-semibold">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={`${name}-error`}
        className={clsx("border rounded-md p-2 transition-all", {
          "border-red-600": error,
          "border-gray-300": !error,
        })}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${name}-error`} className="text-red-600 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
