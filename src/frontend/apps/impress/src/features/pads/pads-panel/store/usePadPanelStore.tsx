import { create } from 'zustand';

import { PadsOrdering } from '../api/usePads';

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
