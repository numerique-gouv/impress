import { useMutation } from '@tanstack/react-query';

import { APIError, errorCauses, fetchAPI } from '@/api';

interface CreatePdfParams {
  templateId: string;
  body: string;
  body_type: 'html' | 'markdown';
}

export const createPdf = async ({
  templateId,
  body,
  body_type,
}: CreatePdfParams): Promise<Blob> => {
  const response = await fetchAPI(
    `templates/${templateId}/generate-document/`,
    {
      method: 'POST',
      body: JSON.stringify({
        body,
        body_type,
      }),
    },
  );

  if (!response.ok) {
    throw new APIError('Failed to create the pdf', await errorCauses(response));
  }

  return await response.blob();
};

export function useCreatePdf() {
  return useMutation<Blob, APIError, CreatePdfParams>({
    mutationFn: createPdf,
  });
}
