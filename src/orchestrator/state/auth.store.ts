import { create }                                  from "zustand";
import { createJSONStorage, devtools, persist }    from "zustand/middleware";
import { User }                                    from "../../core/types/";
import { safeLocalStorage }                        from "../../core/utils/storage";

export interface AuthUser extends User {
  pin?:      string;
  password?: string;
  avatar?:   string;
}

interface AuthState {
  currentUser:     AuthUser | null;
  isAuthenticated: boolean;
  token:           string | null;

  login:    (user: AuthUser, token?: string) => void;
  logout:   () => void;
  /** Updates access token without changing user (used by auto-refresh) */
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
          set({ currentUser: user, isAuthenticated: true, token }),

        logout: () =>
          set({ currentUser: null, isAuthenticated: false, token: null }),

        setToken: (token) =>
          set({ token }),
      }),
      {
        name:       "savola-auth-storage",
        storage:    createJSONStorage(() => safeLocalStorage),
        partialize: (state) => ({
          currentUser:     state.currentUser,
          isAuthenticated: state.isAuthenticated,
          token:           state.token,
        }) as AuthState,
      },
    ),
  ),
);