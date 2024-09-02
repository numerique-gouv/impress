import { create } from 'zustand';

export interface UseDocVersionStore {
  isPanelOpen: boolean;
  setIsPanelOpen: (isOpen: boolean) => void;
}

export const useDocVersionStore = create<UseDocVersionStore>((set) => ({
  isPanelOpen: false,
  setIsPanelOpen: (isPanelOpen) => {
    set(() => ({ isPanelOpen }));
  },
}));
