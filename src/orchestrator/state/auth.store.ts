import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { type User } from "../../core/types/";
import { safeLocalStorage } from "../../core/utils/storage";

export interface AuthUser extends User {
  pin?: string;
  password?: string;
  avatar?: string;
}

interface AuthState {
  currentUser: AuthUser | undefined;
  token: string | undefined;

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
        currentUser: undefined,
        // token deliberately NOT persisted — lives in HTTP-only cookie only
        // We store it in memory only for same-tab API calls that need it
        token: undefined,
        login: (user, token) => set({ currentUser: user, token: token ?? undefined }),
        logout: () => set({ currentUser: undefined, token: undefined }),
        setToken: (token) => set({ token }),
      }),
      {
        name: "zenthar-auth",
        storage: createJSONStorage(() => safeLocalStorage),
        // ONLY persist user metadata, NEVER the token
        partialize: (state) => ({
          currentUser: state.currentUser
            ? {
                id: state.currentUser.id,
                employee_number: state.currentUser.employee_number,
                name: state.currentUser.name,
                role: state.currentUser.role,
                dept: state.currentUser.dept,
                initials: state.currentUser.initials,
                permissions: state.currentUser.permissions,
              }
            : undefined,
          // token: omitted intentionally
        }),
      },
    ),
    { name: "AuthStore" },
  ),
);

export const useIsAuthenticated = () => useAuthStore((s) => !!s.currentUser);
