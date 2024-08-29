import { useMutation } from '@tanstack/react-query';

import { APIError, errorCauses, fetchAPI } from '@/api';

import { DocAttachment } from '../types';

interface CreateDocAttachment {
  docId: string;
  body: FormData;
}

export const createDocAttachment = async ({
  docId,
  body,
}: CreateDocAttachment): Promise<DocAttachment> => {
  const response = await fetchAPI(`documents/${docId}/attachment-upload/`, {
    method: 'POST',
    body,
    withoutContentType: true,
  });

  if (!response.ok) {
    throw new APIError(
      'Failed to upload on the doc',
      await errorCauses(response),
    );
  }

  return response.json() as Promise<DocAttachment>;
};

export function useCreateDocAttachment() {
  return useMutation<DocAttachment, APIError, CreateDocAttachment>({
    mutationFn: createDocAttachment,
  });
}
