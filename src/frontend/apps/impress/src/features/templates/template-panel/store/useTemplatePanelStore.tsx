import { create } from 'zustand';

import { TemplatesOrdering } from '../api/useTemplates';

interface TemplatePanelStore {
  ordering: TemplatesOrdering;
  changeOrdering: () => void;
}

export const useTemplatePanelStore = create<TemplatePanelStore>((set) => ({
  ordering: TemplatesOrdering.BY_CREATED_ON_DESC,
  changeOrdering: () =>
    set(({ ordering }) => ({
      ordering:
        ordering === TemplatesOrdering.BY_CREATED_ON
          ? TemplatesOrdering.BY_CREATED_ON_DESC
          : TemplatesOrdering.BY_CREATED_ON,
    })),
}));
