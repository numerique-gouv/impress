import {
  UseMutationOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { APIError, errorCauses, fetchAPI } from '@/api';
import { KEY_LIST_PAD, KEY_PAD } from '@/features/pads/pad-management';

import { KEY_LIST_DOC_ACCESSES } from './useDocAccesses';

interface DeleteDocAccessProps {
  docId: string;
  accessId: string;
}

export const deleteDocAccess = async ({
  docId,
  accessId,
}: DeleteDocAccessProps): Promise<void> => {
  const response = await fetchAPI(`documents/${docId}/accesses/${accessId}/`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new APIError(
      'Failed to delete the member',
      await errorCauses(response),
    );
  }
};

type UseDeleteDocAccessOptions = UseMutationOptions<
  void,
  APIError,
  DeleteDocAccessProps
>;

export const useDeleteDocAccess = (options?: UseDeleteDocAccessOptions) => {
  const queryClient = useQueryClient();
  return useMutation<void, APIError, DeleteDocAccessProps>({
    mutationFn: deleteDocAccess,
    ...options,
    onSuccess: (data, variables, context) => {
      void queryClient.invalidateQueries({
        queryKey: [KEY_LIST_DOC_ACCESSES],
      });
      void queryClient.invalidateQueries({
        queryKey: [KEY_PAD],
      });
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
