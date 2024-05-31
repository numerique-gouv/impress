import { UseQueryOptions, useQuery } from '@tanstack/react-query';

import { APIError, APIList, errorCauses, fetchAPI } from '@/api';
import { Access } from '@/features/pads/pad-management';

export type DocAccessesAPIParams = {
  page: number;
  docId: string;
  ordering?: string;
};

type AccessesResponse = APIList<Access>;

export const getDocAccesses = async ({
  page,
  docId,
  ordering,
}: DocAccessesAPIParams): Promise<AccessesResponse> => {
  let url = `documents/${docId}/accesses/?page=${page}`;

  if (ordering) {
    url += '&ordering=' + ordering;
  }

  const response = await fetchAPI(url);

  if (!response.ok) {
    throw new APIError(
      'Failed to get the doc accesses',
      await errorCauses(response),
    );
  }

  return response.json() as Promise<AccessesResponse>;
};

export const KEY_LIST_DOC_ACCESSES = 'docs-accesses';

export function useDocAccesses(
  params: DocAccessesAPIParams,
  queryConfig?: UseQueryOptions<AccessesResponse, APIError, AccessesResponse>,
) {
  return useQuery<AccessesResponse, APIError, AccessesResponse>({
    queryKey: [KEY_LIST_DOC_ACCESSES, params],
    queryFn: () => getDocAccesses(params),
    ...queryConfig,
  });
}
