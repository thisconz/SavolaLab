import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { AppTab } from "../../core/types/app.types";
import { safeLocalStorage } from "../../core/utils/storage";

interface AppState {
  // state
  activeTab: AppTab;
  isSidebarOpen: boolean;

  // actions
  setActiveTab: (tab: AppTab) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  resetStore: () => void;
}

const initialState = {
  activeTab: "dashboard" as AppTab,
  isSidebarOpen: true,
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setActiveTab: (tab) => set({ activeTab: tab }, false, "app/setActiveTab"),

        toggleSidebar: () =>
          set((state) => ({ isSidebarOpen: !state.isSidebarOpen }), false, "app/toggleSidebar"),

        setSidebarOpen: (open) => set({ isSidebarOpen: open }, false, "app/setSidebarOpen"),

        resetStore: () => set({ ...initialState }, false, "app/reset"),
      }),
      {
        name: "savola-app-storage",
        storage: createJSONStorage(() => safeLocalStorage),

        partialize: (state) => ({
          activeTab: state.activeTab,
          isSidebarOpen: state.isSidebarOpen,
        }),
      },
    ),
    { name: "AppStore" },
  ),
);
/**
 * SELECTORS
 * Using custom hooks as selectors improves performance by preventing
 * components from re-rendering when unrelated state changes.
 */
export const useActiveTab = () => useAppStore((state) => state.activeTab);

export const useIsSidebarOpen = () => useAppStore((state) => state.isSidebarOpen);

export const useSetActiveTab = () => useAppStore((state) => state.setActiveTab);

export const useToggleSidebar = () => useAppStore((state) => state.toggleSidebar);

export const useSetSidebarOpen = () => useAppStore((state) => state.setSidebarOpen);

export const useResetAppStore = () => useAppStore((state) => state.resetStore);

export type { AppTab };
