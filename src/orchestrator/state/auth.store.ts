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
  isAuthenticated: boolean;
  token: string | null;
  login: (user: AuthUser, token?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        currentUser: null,
        isAuthenticated: false,
        token: null,
        login: (user, token) =>
          set({ currentUser: user, isAuthenticated: true, token }),
        logout: () =>
          set({ currentUser: null, isAuthenticated: false, token: null }),
      }),
      {
        name: "savola-auth-storage",
        storage: createJSONStorage(() => safeLocalStorage),
        partialize: (state) =>
          ({
            currentUser: state.currentUser,
            isAuthenticated: state.isAuthenticated,
          }) as AuthState,
      },
    ),
  ),
);
