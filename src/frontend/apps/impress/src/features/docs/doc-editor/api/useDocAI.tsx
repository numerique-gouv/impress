import { UseQueryOptions, useQuery } from '@tanstack/react-query';

import { APIError, errorCauses, fetchAPI } from '@/api';

export type DocParams = {
  id: string;
  text: string;
  action: 'rephrase' | 'summarize';
};

export type DocAIResponse = {
  textAI: string;
};

export const getDocAI = async ({ id }: DocParams): Promise<DocAIResponse> => {
  const response = await fetchAPI(`documents/${id}/ai/`);

  if (!response.ok) {
    throw new APIError('Failed to get the doc ai', await errorCauses(response));
  }

  return response.json() as Promise<DocAIResponse>;
};

export const KEY_DOC = 'doc';
export const KEY_DOC_VISIBILITY = 'doc-visibility';

export function useDocAI(
  param: DocParams,
  queryConfig?: UseQueryOptions<DocAIResponse, APIError, DocAIResponse>,
) {
  return useQuery<DocAIResponse, APIError, DocAIResponse>({
    queryKey: [KEY_DOC, param],
    queryFn: () => getDocAI(param),
    ...queryConfig,
  });
}
