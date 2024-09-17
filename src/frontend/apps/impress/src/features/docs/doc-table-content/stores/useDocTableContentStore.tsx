import { create } from 'zustand';

export interface UseDocTableContentStore {
  isPanelTableContentOpen: boolean;
  setIsPanelTableContentOpen: (isOpen: boolean) => void;
}

export const useDocTableContentStore = create<UseDocTableContentStore>(
  (set) => ({
    isPanelTableContentOpen: false,
    setIsPanelTableContentOpen: (isPanelTableContentOpen) => {
      set(() => ({ isPanelTableContentOpen }));
    },
  }),
);
