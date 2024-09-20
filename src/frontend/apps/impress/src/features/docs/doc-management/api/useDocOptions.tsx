import { UseQueryOptions, useQuery } from '@tanstack/react-query';

import { APIError, errorCauses, fetchAPI } from '@/api';

type DocOptionsResponse = {
  actions: {
    POST: {
      language: {
        choices: {
          value: string;
          display_name: string;
        }[];
      };
    };
  };
};

export const docOptions = async (): Promise<DocOptionsResponse> => {
  const response = await fetchAPI(`documents/`, {
    method: 'OPTIONS',
  });

  if (!response.ok) {
    throw new APIError(
      'Failed to get the doc options',
      await errorCauses(response),
    );
  }

  return response.json() as Promise<DocOptionsResponse>;
};

export const KEY_DOC_OPTIONS = 'doc-options';

export function useDocOptions(
  queryConfig?: UseQueryOptions<
    DocOptionsResponse,
    APIError,
    DocOptionsResponse
  >,
) {
  return useQuery<DocOptionsResponse, APIError, DocOptionsResponse>({
    queryKey: [KEY_DOC_OPTIONS],
    queryFn: docOptions,
    ...queryConfig,
  });
}
