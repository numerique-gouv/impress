import { useMutation } from '@tanstack/react-query';

import { APIError, errorCauses, fetchAPI } from '@/api';

export type AIActions = 'rephrase' | 'summarize' | 'translate' | 'correct';

export type DocAIParams = {
  docId: string;
  text: string;
  action: AIActions;
};

export type DocAIResponse = string;

export const DocAI = async ({
  docId,
  ...params
}: DocAIParams): Promise<DocAIResponse> => {
  console.log('DocAI', docId, params);
  const response = await fetchAPI(`documents/${docId}/ai/`, {
    method: 'POST',
    body: JSON.stringify({
      ...params,
    }),
  });

  if (!response.ok) {
    throw new APIError('Failed to get AI', await errorCauses(response));
  }

  return response.json() as Promise<DocAIResponse>;
};

export function useAIRewrite() {
  return useMutation<DocAIResponse, APIError, DocAIParams>({
    mutationFn: DocAI,
  });
}
