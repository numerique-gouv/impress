import { create } from 'zustand';

import { PadsOrdering } from '../api/usePads';

interface PadStore {
  ordering: PadsOrdering;
  changeOrdering: () => void;
}

export const usePadStore = create<PadStore>((set) => ({
  ordering: PadsOrdering.BY_CREATED_ON_DESC,
  changeOrdering: () =>
    set(({ ordering }) => ({
      ordering:
        ordering === PadsOrdering.BY_CREATED_ON
          ? PadsOrdering.BY_CREATED_ON_DESC
          : PadsOrdering.BY_CREATED_ON,
    })),
}));
