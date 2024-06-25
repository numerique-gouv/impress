import { useMutation, useQueryClient } from '@tanstack/react-query';

import { APIError, errorCauses, fetchAPI } from '@/api';
import { Doc, KEY_LIST_DOC } from '@/features/docs';

type CreateDocParam = Pick<Doc, 'title' | 'is_public'>;

export const createDoc = async ({
  title,
  is_public,
}: CreateDocParam): Promise<Doc> => {
  const response = await fetchAPI(`documents/`, {
    method: 'POST',
    body: JSON.stringify({
      title,
      is_public,
    }),
  });

  if (!response.ok) {
    throw new APIError('Failed to create the doc', await errorCauses(response));
  }

  return response.json() as Promise<Doc>;
};

interface CreateDocProps {
  onSuccess: (data: Doc) => void;
}

export function useCreateDoc({ onSuccess }: CreateDocProps) {
  const queryClient = useQueryClient();
  return useMutation<Doc, APIError, CreateDocParam>({
    mutationFn: createDoc,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: [KEY_LIST_DOC],
      });
      onSuccess(data);
    },
  });
}
