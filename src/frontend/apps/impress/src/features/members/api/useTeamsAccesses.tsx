import { UseQueryOptions, useQuery } from '@tanstack/react-query';

import { APIError, APIList, errorCauses, fetchAPI } from '@/api';

import { Access } from '../types';

export type TeamAccessesAPIParams = {
  page: number;
  teamId: string;
  ordering?: string;
};

type AccessesResponse = APIList<Access>;

export const getTeamAccesses = async ({
  page,
  teamId,
  ordering,
}: TeamAccessesAPIParams): Promise<AccessesResponse> => {
  let url = `teams/${teamId}/accesses/?page=${page}`;

  if (ordering) {
    url += '&ordering=' + ordering;
  }

  const response = await fetchAPI(url);

  if (!response.ok) {
    throw new APIError(
      'Failed to get the team accesses',
      await errorCauses(response),
    );
  }

  return response.json() as Promise<AccessesResponse>;
};

export const KEY_LIST_TEAM_ACCESSES = 'teams-accesses';

export function useTeamAccesses(
  params: TeamAccessesAPIParams,
  queryConfig?: UseQueryOptions<AccessesResponse, APIError, AccessesResponse>,
) {
  return useQuery<AccessesResponse, APIError, AccessesResponse>({
    queryKey: [KEY_LIST_TEAM_ACCESSES, params],
    queryFn: () => getTeamAccesses(params),
    ...queryConfig,
  });
}
