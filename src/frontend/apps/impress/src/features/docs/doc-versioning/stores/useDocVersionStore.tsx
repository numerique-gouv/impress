import { create } from 'zustand';

export interface UseDocVersionStore {
  isPanelVersionOpen: boolean;
  setIsPanelVersionOpen: (isOpen: boolean) => void;
}

export const useDocVersionStore = create<UseDocVersionStore>((set) => ({
  isPanelVersionOpen: false,
  setIsPanelVersionOpen: (isPanelVersionOpen) => {
    set(() => ({ isPanelVersionOpen }));
  },
}));
