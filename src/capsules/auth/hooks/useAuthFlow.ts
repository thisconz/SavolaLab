import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuthStore } from "../../../orchestrator/state/auth.store";
import { AuthApi } from "../api/auth.api";
import { User } from "../../../core/types";

interface UseAuthFlowOptions {
  onSuccess?: () => void;
  isOpen?: boolean;
}

const getInitials = (name: string) => {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase();
};

export const useAuthFlow = ({
  onSuccess,
  isOpen = true,
}: UseAuthFlowOptions = {}) => {
  const { login, currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"pin" | "password">("pin");
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  console.log("[DEBUG] useAuthFlow render, isOpen:", isOpen, "users count:", users.length);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    console.log("[DEBUG] fetchUsers called");
    try {
      const data = await AuthApi.getUsers();
      console.log("[DEBUG] fetchUsers success:", data);
      setUsers(data || []);
    } catch (err: any) {
      if (err?.status !== 401) {
        console.warn("[DEBUG] fetchUsers error:", err);
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    } else {
      setSelectedUser(null);
      setInputValue("");
      setError("");
      setIsRegistering(false);
    }
  }, [isOpen, fetchUsers]);

  const handleUserSelect = useCallback(
    (user: User) => {
      if (String(user.id) === String(currentUser?.id)) {
        onSuccess?.();
        return;
      }
      setSelectedUser(user);
      setInputValue("");
      setError("");
    },
    [currentUser, onSuccess],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedUser || loading) return;

      setLoading(true);
      try {
        const payload =
          authMode === "pin"
            ? { employee_number: selectedUser.id, pin: inputValue }
            : { employee_number: selectedUser.id, password: inputValue };

        const response = await AuthApi.login(payload);

        if (response.success) {
          login(
            {
              ...response.user,
              id: String(response.user.employee_number),
              employee_number: String(response.user.employee_number),
              name: response.user.name,
              role: response.user.role as any,
              dept: response.user.dept,
              initials: getInitials(response.user.name),
              permissions: {
                view_results: 1,
                input_data: 1,
                edit_formulas: 1,
                change_specs: 1,
              },
            },
            response.token,
          );

          toast.success(`Welcome back, ${response.user.name}`);

          setSelectedUser(null);
          setInputValue("");
          onSuccess?.();
        }
      } catch (err: any) {
        const msg = err?.message || `Invalid ${authMode.toUpperCase()}`;
        setError(msg);
        setInputValue("");
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [selectedUser, loading, authMode, inputValue, login, onSuccess],
  );

  const resetState = useCallback(() => {
    setSelectedUser(null);
    setInputValue("");
    setError("");
    setIsRegistering(false);
  }, []);

  return {
    users,
    selectedUser,
    setSelectedUser,
    authMode,
    setAuthMode,
    inputValue,
    setInputValue,
    error,
    setError,
    loading,
    isRegistering,
    setIsRegistering,
    fetchUsers,
    handleUserSelect,
    handleSubmit,
    resetState,
    currentUser,
  };
};
