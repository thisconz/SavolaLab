import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { AppTab } from "../../core/types/app.types";
import { safeLocalStorage } from "../../core/utils/storage";

interface AppState {
  // State
  activeTab: AppTab;
  isSidebarOpen: boolean;
  
  // Actions - Grouped for better organization
  actions: {
    setActiveTab: (tab: AppTab) => void;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    resetStore: () => void;
  };
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
        
        actions: {
          setActiveTab: (tab) => set({ activeTab: tab }, false, "app/setActiveTab"),
          
          toggleSidebar: () =>
            set(
              (state) => ({ isSidebarOpen: !state.isSidebarOpen }),
              false,
              "app/toggleSidebar"
            ),
            
          setSidebarOpen: (open) => 
            set({ isSidebarOpen: open }, false, "app/setSidebarOpen"),
            
          resetStore: () => set(initialState, false, "app/reset"),
        },
      }),
      {
        name: "savola-app-storage",
        storage: createJSONStorage(() => safeLocalStorage),
        // Partializing only the raw state, excluding actions from persistence
        partialize: (state) => ({
          activeTab: state.activeTab,
          isSidebarOpen: state.isSidebarOpen,
        }),
      },
    ),
    { name: "AppStore" }
  )
);

/**
 * SELECTORS
 * Using custom hooks as selectors improves performance by preventing 
 * components from re-rendering when unrelated state changes.
 */
export const useAppActions = () => useAppStore((state) => state.actions);
export const useActiveTab = () => useAppStore((state) => state.activeTab);
export const useIsSidebarOpen = () => useAppStore((state) => state.isSidebarOpen);

export type { AppTab };
