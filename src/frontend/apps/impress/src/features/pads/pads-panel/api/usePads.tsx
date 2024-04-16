import {
  DefinedInitialDataInfiniteOptions,
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query';

import { APIError, APIList, errorCauses, fetchAPI } from '@/api';
import { Pad } from '@/features/pads/pad';

export enum PadsOrdering {
  BY_CREATED_ON = 'created_at',
  BY_CREATED_ON_DESC = '-created_at',
}

export type PadsParams = {
  ordering: PadsOrdering;
};
type PadsAPIParams = PadsParams & {
  page: number;
};

type PadsResponse = APIList<Pad>;

export const getPads = async ({
  ordering,
  page,
}: PadsAPIParams): Promise<PadsResponse> => {
  const orderingQuery = ordering ? `&ordering=${ordering}` : '';
  const response = await fetchAPI(`documents/?page=${page}${orderingQuery}`);

  if (!response.ok) {
    throw new APIError('Failed to get the pads', await errorCauses(response));
  }

  return response.json() as Promise<PadsResponse>;
};

export const KEY_LIST_PAD = 'pads';

export function usePads(
  param: PadsParams,
  queryConfig?: DefinedInitialDataInfiniteOptions<
    PadsResponse,
    APIError,
    InfiniteData<PadsResponse>,
    QueryKey,
    number
  >,
) {
  return useInfiniteQuery<
    PadsResponse,
    APIError,
    InfiniteData<PadsResponse>,
    QueryKey,
    number
  >({
    initialPageParam: 1,
    queryKey: [KEY_LIST_PAD, param],
    queryFn: ({ pageParam }) =>
      getPads({
        ...param,
        page: pageParam,
      }),
    getNextPageParam(lastPage, allPages) {
      return lastPage.next ? allPages.length + 1 : undefined;
    },
    ...queryConfig,
  });
}
