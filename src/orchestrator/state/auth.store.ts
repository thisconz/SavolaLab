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
  /** In-memory only — NOT persisted; httpOnly cookie handles continuity. */
  token: string | null;

  /** Derived at runtime — never persisted independently to avoid desync. */
  readonly isAuthenticated: boolean;

  login: (user: AuthUser, token?: string) => void;
  logout: () => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        currentUser: null,
        token: null,

        // Derived — computed lazily so it's always consistent with currentUser
        get isAuthenticated() {
          return get().currentUser !== null;
        },

        login: (user, token) =>
          set({ currentUser: user, token: token ?? null }, false, "auth/login"),

        logout: () =>
          set({ currentUser: null, token: null }, false, "auth/logout"),

        setToken: (token) => set({ token }, false, "auth/setToken"),
      }),
      {
        name: "zenthar-auth-storage",
        storage: createJSONStorage(() => safeLocalStorage),
        /**
         * Only persist the user identity, never the access token.
         * isAuthenticated is intentionally excluded — it's derived from currentUser.
         * The httpOnly refresh-token cookie handles silent session revival.
         */
        partialize: (state): Pick<AuthState, "currentUser"> => ({
          currentUser: state.currentUser,
        }),
      },
    ),
    { name: "AuthStore" },
  ),
);
