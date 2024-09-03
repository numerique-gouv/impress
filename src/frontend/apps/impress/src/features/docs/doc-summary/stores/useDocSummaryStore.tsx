import { create } from 'zustand';

export interface UseDocSummaryStore {
  isPanelSummaryOpen: boolean;
  setIsPanelSummaryOpen: (isOpen: boolean) => void;
}

export const useDocSummaryStore = create<UseDocSummaryStore>((set) => ({
  isPanelSummaryOpen: false,
  setIsPanelSummaryOpen: (isPanelSummaryOpen) => {
    set(() => ({ isPanelSummaryOpen }));
  },
}));
