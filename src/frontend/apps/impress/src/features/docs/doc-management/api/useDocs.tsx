import {
  DefinedInitialDataInfiniteOptions,
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query';

import { APIError, APIList, errorCauses, fetchAPI } from '@/api';
import { Doc } from '@/features/docs/doc-management';

export enum DocsOrdering {
  BY_CREATED_ON = 'created_at',
  BY_CREATED_ON_DESC = '-created_at',
}

export type DocsParams = {
  ordering: DocsOrdering;
};
type DocsAPIParams = DocsParams & {
  page: number;
};

type DocsResponse = APIList<Doc>;

export const getDocs = async ({
  ordering,
  page,
}: DocsAPIParams): Promise<DocsResponse> => {
  const orderingQuery = ordering ? `&ordering=${ordering}` : '';
  const response = await fetchAPI(`documents/?page=${page}${orderingQuery}`);

  if (!response.ok) {
    throw new APIError('Failed to get the docs', await errorCauses(response));
  }

  return response.json() as Promise<DocsResponse>;
};

export const KEY_LIST_DOC = 'docs';

export function useDocs(
  param: DocsParams,
  queryConfig?: DefinedInitialDataInfiniteOptions<
    DocsResponse,
    APIError,
    InfiniteData<DocsResponse>,
    QueryKey,
    number
  >,
) {
  return useInfiniteQuery<
    DocsResponse,
    APIError,
    InfiniteData<DocsResponse>,
    QueryKey,
    number
  >({
    initialPageParam: 1,
    queryKey: [KEY_LIST_DOC, param],
    queryFn: ({ pageParam }) =>
      getDocs({
        ...param,
        page: pageParam,
      }),
    getNextPageParam(lastPage, allPages) {
      return lastPage.next ? allPages.length + 1 : undefined;
    },
    ...queryConfig,
  });
}
