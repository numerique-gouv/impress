import { useMutation } from '@tanstack/react-query';

import { APIError, errorCauses, fetchAPI } from '@/api';

interface CreatePdfFromMarkdownParams {
  templateId: string;
  markdown: string;
}

export const createPdfFromMarkdown = async ({
  templateId,
  markdown,
}: CreatePdfFromMarkdownParams): Promise<Blob> => {
  const response = await fetchAPI(
    `templates/${templateId}/generate-document/`,
    {
      method: 'POST',
      body: JSON.stringify({
        body: markdown,
      }),
    },
  );

  if (!response.ok) {
    throw new APIError('Failed to create the pdf', await errorCauses(response));
  }

  return await response.blob();
};

export function useCreatePdfFromMarkdown() {
  return useMutation<Blob, APIError, CreatePdfFromMarkdownParams>({
    mutationFn: createPdfFromMarkdown,
  });
}
