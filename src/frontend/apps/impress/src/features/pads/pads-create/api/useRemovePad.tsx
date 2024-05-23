import {
  UseMutationOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { APIError, errorCauses, fetchAPI } from '@/api';

import { KEY_LIST_PAD } from '../../pads-panel';

interface RemovePadProps {
  padId: string;
}

export const removePad = async ({ padId }: RemovePadProps): Promise<void> => {
  const response = await fetchAPI(`documents/${padId}/`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new APIError('Failed to delete the pad', await errorCauses(response));
  }
};

type UseRemovePadOptions = UseMutationOptions<void, APIError, RemovePadProps>;

export const useRemovePad = (options?: UseRemovePadOptions) => {
  const queryClient = useQueryClient();
  return useMutation<void, APIError, RemovePadProps>({
    mutationFn: removePad,
    ...options,
    onSuccess: (data, variables, context) => {
      void queryClient.invalidateQueries({
        queryKey: [KEY_LIST_PAD],
      });
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      if (options?.onError) {
        options.onError(error, variables, context);
      }
    },
  });
};
