import { create } from 'zustand';

import { TeamsOrdering } from '../api/useTeams';

interface TeamsStore {
  ordering: TeamsOrdering;
  changeOrdering: () => void;
}

export const useTeamStore = create<TeamsStore>((set) => ({
  ordering: TeamsOrdering.BY_CREATED_ON_DESC,
  changeOrdering: () =>
    set(({ ordering }) => ({
      ordering:
        ordering === TeamsOrdering.BY_CREATED_ON
          ? TeamsOrdering.BY_CREATED_ON_DESC
          : TeamsOrdering.BY_CREATED_ON,
    })),
}));
