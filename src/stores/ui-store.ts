import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// -- Types ----------------------------------------------------------------------

export type AppPage =
  | 'home'
  | 'tracking'
  | 'history'
  | 'insights'
  | 'settings'
  | 'fan-setup'
  | 'privacy';

// -- State Shape ----------------------------------------------------------------

export interface UIState {
  isDemoMode: boolean;
  currentPage: AppPage;
  isNightMode: boolean;
  showConsent: boolean;

  /* actions */
  toggleDemo: () => void;
  setDemoMode: (enabled: boolean) => void;
  setPage: (page: AppPage) => void;
  toggleNight: () => void;
  setNightMode: (enabled: boolean) => void;
  setConsent: (show: boolean) => void;
}

// -- Store ----------------------------------------------------------------------

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isDemoMode: true,
      currentPage: 'home',
      isNightMode: false,
      showConsent: true,

      toggleDemo: () => {
        set((s) => ({ isDemoMode: !s.isDemoMode }));
      },

      setDemoMode: (enabled: boolean) => {
        set({ isDemoMode: enabled });
      },

      setPage: (page: AppPage) => {
        set({ currentPage: page });
      },

      toggleNight: () => {
        set((s) => ({ isNightMode: !s.isNightMode }));
      },

      setNightMode: (enabled: boolean) => {
        set({ isNightMode: enabled });
      },

      setConsent: (show: boolean) => {
        set({ showConsent: show });
      },
    }),
    {
      name: 'dreambreeze-ui',
      partialize: (state) => ({
        isDemoMode: state.isDemoMode,
        isNightMode: state.isNightMode,
        showConsent: state.showConsent,
      }),
    },
  ),
);
