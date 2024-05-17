import { useMutation, useQueryClient } from '@tanstack/react-query';

import { APIError, errorCauses, fetchAPI } from '@/api';
import { Pad } from '@/features/pads';

export type PadParams = Pick<Pad, 'id'> &
  Partial<Pick<Pad, 'content' | 'title' | 'is_public'>>;

export const updatePad = async ({ id, ...params }: PadParams): Promise<Pad> => {
  const response = await fetchAPI(`documents/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify({
      ...params,
    }),
  });

  if (!response.ok) {
    throw new APIError('Failed to update the pad', await errorCauses(response));
  }

  return response.json() as Promise<Pad>;
};

interface UpdatePadProps {
  onSuccess?: (data: Pad) => void;
  listInvalideQueries?: string[];
}

export function useUpdatePad({
  onSuccess,
  listInvalideQueries,
}: UpdatePadProps = {}) {
  const queryClient = useQueryClient();
  return useMutation<Pad, APIError, PadParams>({
    mutationFn: updatePad,
    onSuccess: (data) => {
      listInvalideQueries?.forEach((queryKey) => {
        void queryClient.invalidateQueries({
          queryKey: [queryKey],
        });
      });
      onSuccess?.(data);
    },
  });
}
