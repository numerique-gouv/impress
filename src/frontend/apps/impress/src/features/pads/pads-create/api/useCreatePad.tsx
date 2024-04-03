import { useMutation, useQueryClient } from '@tanstack/react-query';

import { APIError, errorCauses, fetchAPI } from '@/api';
import { KEY_LIST_PAD } from '@/features/pads';

type CreatePadResponse = {
  id: string;
  name: string;
};

export const createPad = async (name: string): Promise<CreatePadResponse> => {
  const response = await fetchAPI(`pads/`, {
    method: 'POST',
    body: JSON.stringify({
      name,
    }),
  });

  if (!response.ok) {
    throw new APIError('Failed to create the pad', await errorCauses(response));
  }

  return response.json() as Promise<CreatePadResponse>;
};

interface CreatePadProps {
  onSuccess: (data: CreatePadResponse) => void;
}

export function useCreatePad({ onSuccess }: CreatePadProps) {
  const queryClient = useQueryClient();
  return useMutation<CreatePadResponse, APIError, string>({
    mutationFn: createPad,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: [KEY_LIST_PAD],
      });
      onSuccess(data);
    },
  });
}
