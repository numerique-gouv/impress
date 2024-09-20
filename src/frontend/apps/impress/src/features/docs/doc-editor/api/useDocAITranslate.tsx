import { useMutation } from '@tanstack/react-query';

import { APIError, errorCauses, fetchAPI } from '@/api';

export type DocAITranslate = {
  docId: string;
  text: string;
  language: string;
};

export type DocAITranslateResponse = {
  answer: string;
};

export const docAITranslate = async ({
  docId,
  ...params
}: DocAITranslate): Promise<DocAITranslateResponse> => {
  const response = await fetchAPI(`documents/${docId}/ai-translate/`, {
    method: 'POST',
    body: JSON.stringify({
      ...params,
    }),
  });

  if (!response.ok) {
    throw new APIError(
      'Failed to request ai translate',
      await errorCauses(response),
    );
  }

  return response.json() as Promise<DocAITranslateResponse>;
};

export function useDocAITranslate() {
  return useMutation<DocAITranslateResponse, APIError, DocAITranslate>({
    mutationFn: docAITranslate,
  });
}
