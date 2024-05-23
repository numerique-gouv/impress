import { useMutation, useQueryClient } from '@tanstack/react-query';

import { APIError, errorCauses, fetchAPI } from '@/api';
import { KEY_LIST_PAD, Pad } from '@/features/pads';

type CreatePadParam = Pick<Pad, 'title' | 'is_public'>;

export const createPad = async ({
  title,
  is_public,
}: CreatePadParam): Promise<Pad> => {
  const response = await fetchAPI(`documents/`, {
    method: 'POST',
    body: JSON.stringify({
      title,
      is_public,
    }),
  });

  if (!response.ok) {
    throw new APIError('Failed to create the pad', await errorCauses(response));
  }

  return response.json() as Promise<Pad>;
};

interface CreatePadProps {
  onSuccess: (data: Pad) => void;
}

export function useCreatePad({ onSuccess }: CreatePadProps) {
  const queryClient = useQueryClient();
  return useMutation<Pad, APIError, CreatePadParam>({
    mutationFn: createPad,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: [KEY_LIST_PAD],
      });
      onSuccess(data);
    },
  });
}
