import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { User } from "../../core/types/";
import { safeLocalStorage } from "../../core/utils/storage";

export interface AuthUser extends User {
  pin?: string;
  password?: string;
  avatar?: string;
}

interface AuthState {
  currentUser: AuthUser | null;
  token: string | null;

  login: (user: AuthUser, token?: string) => void;
  logout: () => void;
  setToken: (token: string) => void;
}

/**
 * Derived state should NEVER live inside Zustand store.
 * Compute it at usage site:
 *   const isAuthenticated = useAuthStore(s => !!s.currentUser)
 */
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        currentUser: null,
        token: null,

        login: (user, token) =>
          set(
            {
              currentUser: user,
              token: token ?? null,
            },
            false,
            "auth/login",
          ),

        logout: () =>
          set(
            {
              currentUser: null,
              token: null,
            },
            false,
            "auth/logout",
          ),

        setToken: (token) => set({ token }, false, "auth/setToken"),
      }),
      {
        name: "zenthar-auth-storage",
        storage: createJSONStorage(() => safeLocalStorage),

        // Only persist identity and session token, avoid sensitive long-term data if necessary
        partialize: (state) => ({
          currentUser: state.currentUser,
        }),
      },
    ),
    { name: "AuthStore" },
  ),
);

export const useIsAuthenticated = () =>
  useAuthStore((s) => !!s.currentUser);