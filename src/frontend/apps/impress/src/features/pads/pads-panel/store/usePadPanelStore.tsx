import { create } from 'zustand';

import { PadsOrdering } from '@/features/pads/pad-management/api';

interface PadPanelStore {
  ordering: PadsOrdering;
  changeOrdering: () => void;
}

export const usePadPanelStore = create<PadPanelStore>((set) => ({
  ordering: PadsOrdering.BY_CREATED_ON_DESC,
  changeOrdering: () =>
    set(({ ordering }) => ({
      ordering:
        ordering === PadsOrdering.BY_CREATED_ON
          ? PadsOrdering.BY_CREATED_ON_DESC
          : PadsOrdering.BY_CREATED_ON,
    })),
}));
