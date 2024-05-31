import { useMutation, useQueryClient } from '@tanstack/react-query';

import { APIError, errorCauses, fetchAPI } from '@/api';
import { User } from '@/core/auth';
import {
  Access,
  KEY_LIST_PAD,
  Pad,
  Role,
} from '@/features/pads/pad-management';

import { OptionType } from '../types';

import { KEY_LIST_USER } from './useUsers';

interface CreateDocAccessParams {
  role: Role;
  docId: Pad['id'];
  memberId: User['id'];
}

export const createDocAccess = async ({
  memberId,
  role,
  docId,
}: CreateDocAccessParams): Promise<Access> => {
  const response = await fetchAPI(`documents/${docId}/accesses/`, {
    method: 'POST',
    body: JSON.stringify({
      user: memberId,
      role,
    }),
  });

  if (!response.ok) {
    throw new APIError(
      `Failed to add the member in the doc.`,
      await errorCauses(response, {
        type: OptionType.NEW_MEMBER,
      }),
    );
  }

  return response.json() as Promise<Access>;
};

export function useCreateDocAccess() {
  const queryClient = useQueryClient();
  return useMutation<Access, APIError, CreateDocAccessParams>({
    mutationFn: createDocAccess,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [KEY_LIST_PAD],
      });
      void queryClient.resetQueries({
        queryKey: [KEY_LIST_USER],
      });
    },
  });
}
