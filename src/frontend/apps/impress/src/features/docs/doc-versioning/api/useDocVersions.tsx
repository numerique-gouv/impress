import { useQuery } from '@tanstack/react-query';

import {
  APIError,
  APIList,
  DefinedInitialDataInfiniteOptionsAPI,
  UseQueryOptionsAPI,
  errorCauses,
  fetchAPI,
  useAPIInfiniteQuery,
} from '@/api';

import { Versions } from '../types';

export type DocVersionsParam = {
  docId: string;
};

export type DocVersionsAPIParams = DocVersionsParam & {
  page: number;
};

type VersionsResponse = APIList<Versions>;

const getDocVersions = async ({
  page,
  docId,
}: DocVersionsAPIParams): Promise<VersionsResponse> => {
  const url = `documents/${docId}/versions/?page=${page}`;

  const response = await fetchAPI(url);

  if (!response.ok) {
    throw new APIError(
      'Failed to get the doc versions',
      await errorCauses(response),
    );
  }

  return response.json() as Promise<VersionsResponse>;
};

export const KEY_LIST_DOC_VERSIONS = 'doc-versions';

export function useDocVersions(
  params: DocVersionsAPIParams,
  queryConfig?: UseQueryOptionsAPI<VersionsResponse>,
) {
  return useQuery<VersionsResponse, APIError, VersionsResponse>({
    queryKey: [KEY_LIST_DOC_VERSIONS, params],
    queryFn: () => getDocVersions(params),
    ...queryConfig,
  });
}

export function useDocVersionsInfiniteQuery(
  param: DocVersionsParam,
  queryConfig?: DefinedInitialDataInfiniteOptionsAPI<VersionsResponse>,
) {
  return useAPIInfiniteQuery<DocVersionsParam, VersionsResponse>(
    KEY_LIST_DOC_VERSIONS,
    getDocVersions,
    param,
    queryConfig,
  );
}
