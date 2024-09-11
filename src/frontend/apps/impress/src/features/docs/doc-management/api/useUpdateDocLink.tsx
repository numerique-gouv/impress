import { useMutation, useQueryClient } from '@tanstack/react-query';

import { APIError, errorCauses, fetchAPI } from '@/api';
import { Doc } from '@/features/docs';

export type UpdateDocLinkParams = Pick<Doc, 'id'> &
  Partial<Pick<Doc, 'link_role' | 'link_reach'>>;

export const updateDocLink = async ({
  id,
  ...params
}: UpdateDocLinkParams): Promise<Doc> => {
  const response = await fetchAPI(`documents/${id}/link-configuration/`, {
    method: 'PUT',
    body: JSON.stringify({
      ...params,
    }),
  });

  if (!response.ok) {
    throw new APIError(
      'Failed to update the doc link',
      await errorCauses(response),
    );
  }

  return response.json() as Promise<Doc>;
};

interface UpdateDocLinkProps {
  onSuccess?: (data: Doc) => void;
  listInvalideQueries?: string[];
}

export function useUpdateDocLink({
  onSuccess,
  listInvalideQueries,
}: UpdateDocLinkProps = {}) {
  const queryClient = useQueryClient();
  return useMutation<Doc, APIError, UpdateDocLinkParams>({
    mutationFn: updateDocLink,
    onSuccess: (data) => {
      listInvalideQueries?.forEach((queryKey) => {
        void queryClient.resetQueries({
          queryKey: [queryKey],
        });
      });
      onSuccess?.(data);
    },
  });
}
