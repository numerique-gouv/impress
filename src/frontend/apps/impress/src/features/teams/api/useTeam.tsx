import { UseQueryOptions, useQuery } from '@tanstack/react-query';

import { APIError, errorCauses, fetchAPI } from '@/api';

import { Team } from '../types';

export type TeamParams = {
  id: string;
};

export const getTeam = async ({ id }: TeamParams): Promise<Team> => {
  const response = await fetchAPI(`teams/${id}`);

  if (!response.ok) {
    throw new APIError('Failed to get the team', await errorCauses(response));
  }

  return response.json() as Promise<Team>;
};

export const KEY_TEAM = 'team';

export function useTeam(
  param: TeamParams,
  queryConfig?: UseQueryOptions<Team, APIError, Team>,
) {
  return useQuery<Team, APIError, Team>({
    queryKey: [KEY_TEAM, param],
    queryFn: () => getTeam(param),
    ...queryConfig,
  });
}
