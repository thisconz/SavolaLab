import { useState } from "react";
import api from "@/lib/api";
import { UserUpdate } from "@/types/user";

export default function useUserUpdate() {
  const [form, setForm] = useState<UserUpdate>({
    full_name: "",
    role: "",
    password: "",
    department: ""
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (): Promise<boolean> => {
    try {
      await api.put("/users/me", form);
      return true;
    } catch (err: any) {
      console.error("API Error:", err.response?.data || err.message);
      return false;
    }
  };

  return { form, setForm, handleChange, handleSubmit };
}
