import {
  DefinedInitialDataInfiniteOptions,
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query';

import { APIError, APIList, errorCauses, fetchAPI } from '@/api';
import { Pad, Role } from '@/features/pads/pad';

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
  /**
   * TODO: Remove this block when the API endpoint is ready
   */
  return await new Promise((resolve) => {
    const pads: PadsResponse = {
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: '1',
          name: 'My mocked pad',
          created_at: '2021-10-01T00:00:00Z',
          updated_at: '2021-10-01T00:00:00Z',
          accesses: [
            {
              id: '1',
              role: Role.MEMBER,
              user: {
                id: '1',
                name: 'user1',
                email: 'john@doe.com',
              },
              abilities: {
                delete: true,
                get: true,
                patch: true,
                put: true,
                set_role_to: [Role.MEMBER, Role.ADMIN],
              },
            },
          ],
          abilities: {
            delete: true,
            get: true,
            manage_accesses: true,
            patch: true,
            put: true,
          },
        },
        {
          id: '2',
          name: 'My mocked pad number 2',
          created_at: '2021-10-01T00:00:00Z',
          updated_at: '2021-10-01T00:00:00Z',
          accesses: [
            {
              id: '1',
              role: Role.MEMBER,
              user: {
                id: '1',
                name: 'user1',
                email: 'john@doe.com',
              },
              abilities: {
                delete: true,
                get: true,
                patch: true,
                put: true,
                set_role_to: [Role.MEMBER, Role.ADMIN],
              },
            },
          ],
          abilities: {
            delete: true,
            get: true,
            manage_accesses: true,
            patch: true,
            put: true,
          },
        },
      ],
    };

    setTimeout(() => {
      resolve(pads);
    }, 500);
  });

  const orderingQuery = ordering ? `&ordering=${ordering}` : '';
  const response = await fetchAPI(`pads/?page=${page}${orderingQuery}`);

  if (!response.ok) {
    throw new APIError('Failed to get the teams', await errorCauses(response));
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
