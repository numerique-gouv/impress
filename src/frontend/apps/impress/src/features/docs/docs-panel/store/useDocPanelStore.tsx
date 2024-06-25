import { create } from 'zustand';

import { DocsOrdering } from '@/features/docs/doc-management/api';

interface DocPanelStore {
  ordering: DocsOrdering;
  changeOrdering: () => void;
}

export const useDocPanelStore = create<DocPanelStore>((set) => ({
  ordering: DocsOrdering.BY_CREATED_ON_DESC,
  changeOrdering: () =>
    set(({ ordering }) => ({
      ordering:
        ordering === DocsOrdering.BY_CREATED_ON
          ? DocsOrdering.BY_CREATED_ON_DESC
          : DocsOrdering.BY_CREATED_ON,
    })),
}));
