import {
  UseMutationOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { APIError, errorCauses, fetchAPI } from '@/api';
import { KEY_TEAM, Role } from '@/features/teams/';

import { Access } from '../types';

import { KEY_LIST_TEAM_ACCESSES } from './useTeamsAccesses';

interface UpdateTeamAccessProps {
  teamId: string;
  accessId: string;
  role: Role;
}

export const updateTeamAccess = async ({
  teamId,
  accessId,
  role,
}: UpdateTeamAccessProps): Promise<Access> => {
  const response = await fetchAPI(`teams/${teamId}/accesses/${accessId}/`, {
    method: 'PATCH',
    body: JSON.stringify({
      role,
    }),
  });

  if (!response.ok) {
    throw new APIError('Failed to update role', await errorCauses(response));
  }

  return response.json() as Promise<Access>;
};

type UseUpdateTeamAccess = Partial<Access>;

type UseUpdateTeamAccessOptions = UseMutationOptions<
  Access,
  APIError,
  UseUpdateTeamAccess
>;

export const useUpdateTeamAccess = (options?: UseUpdateTeamAccessOptions) => {
  const queryClient = useQueryClient();
  return useMutation<Access, APIError, UpdateTeamAccessProps>({
    mutationFn: updateTeamAccess,
    ...options,
    onSuccess: (data, variables, context) => {
      void queryClient.invalidateQueries({
        queryKey: [KEY_LIST_TEAM_ACCESSES],
      });
      void queryClient.invalidateQueries({
        queryKey: [KEY_TEAM],
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
