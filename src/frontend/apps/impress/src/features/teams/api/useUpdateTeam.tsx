import { useMutation, useQueryClient } from '@tanstack/react-query';

import { APIError, errorCauses, fetchAPI } from '@/api';

import { Team } from '../types';

import { KEY_TEAM } from './useTeam';
import { KEY_LIST_TEAM } from './useTeams';

type UpdateTeamProps = Pick<Team, 'name' | 'id'>;

export const updateTeam = async ({
  name,
  id,
}: UpdateTeamProps): Promise<Team> => {
  const response = await fetchAPI(`teams/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify({
      name,
    }),
  });

  if (!response.ok) {
    throw new APIError(
      'Failed to update the team',
      await errorCauses(response),
    );
  }

  return response.json() as Promise<Team>;
};

interface UseUpdateTeamProps {
  onSuccess: (data: Team) => void;
}

export function useUpdateTeam({ onSuccess }: UseUpdateTeamProps) {
  const queryClient = useQueryClient();
  return useMutation<Team, APIError, UpdateTeamProps>({
    mutationFn: updateTeam,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: [KEY_LIST_TEAM],
      });
      void queryClient.invalidateQueries({
        queryKey: [KEY_TEAM],
      });
      onSuccess(data);
    },
  });
}
