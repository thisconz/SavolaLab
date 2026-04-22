import { create }                               from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { User }                                 from "../../core/types/";
import { safeLocalStorage }                     from "../../core/utils/storage";

export interface AuthUser extends User {
  pin?:      string;
  password?: string;
  avatar?:   string;
}

interface AuthState {
  currentUser:     AuthUser | null;
  isAuthenticated: boolean;
  /** In-memory only — NOT persisted to localStorage */
  token:           string | null;

  login:    (user: AuthUser, token?: string) => void;
  logout:   () => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        currentUser:     null,
        isAuthenticated: false,
        token:           null,

        login: (user, token) =>
          set({ currentUser: user, isAuthenticated: true, token: token ?? null }),

        logout: () =>
          set({ currentUser: null, isAuthenticated: false, token: null }),

        setToken: (token) =>
          set({ token }),
      }),
      {
        name:    "zenthar-auth-storage",
        storage: createJSONStorage(() => safeLocalStorage),
        // ─── FIX S2: persist only the user identity, never the token ──────
        // token is excluded — the httpOnly cookie handles session continuity.
        // isAuthenticated is excluded — derived from a real API call on load.
        partialize: (state): Pick<AuthState, "currentUser"> => ({
          currentUser: state.currentUser,
        }),
      },
    ),
  ),
);