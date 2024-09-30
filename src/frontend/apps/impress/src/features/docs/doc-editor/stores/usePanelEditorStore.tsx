import { create } from 'zustand';

export interface UsePanelEditorStore {
  isPanelOpen: boolean;
  setIsPanelOpen: (isOpen: boolean) => void;
  isPanelTableContentOpen: boolean;
  setIsPanelTableContentOpen: (isOpen: boolean) => void;
}

export const usePanelEditorStore = create<UsePanelEditorStore>((set) => ({
  isPanelOpen: false,
  isPanelTableContentOpen: true,
  setIsPanelTableContentOpen: (isPanelTableContentOpen) => {
    set(() => ({ isPanelTableContentOpen }));
  },
  setIsPanelOpen: (isPanelOpen) => {
    set(() => ({ isPanelOpen }));
  },
}));
