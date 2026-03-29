import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { AppTab } from "../../core/types/app.types";

import { safeLocalStorage } from "../../core/utils/storage";

export type { AppTab };

interface AppState {
  activeTab: AppTab;
  isSidebarOpen: boolean;
  setActiveTab: (tab: AppTab) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

/**
 * Global application store for UI state that needs to persist or be shared across features.
 */
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        activeTab: "dashboard",
        isSidebarOpen: true,
        setActiveTab: (tab) => set({ activeTab: tab }),
        toggleSidebar: () =>
          set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
        setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      }),
      {
        name: "savola-app-storage",
        storage: createJSONStorage(() => safeLocalStorage),
        partialize: (state) =>
          ({
            activeTab: state.activeTab,
            isSidebarOpen: state.isSidebarOpen,
          }) as AppState,
      },
    ),
  ),
);
