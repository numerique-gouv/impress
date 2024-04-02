import { useMutation, useQueryClient } from '@tanstack/react-query';

import { APIError, errorCauses, fetchAPI } from '@/api';

import { KEY_LIST_TEAM } from './useTeams';

type CreateTeamResponse = {
  id: string;
  name: string;
};

export const createTeam = async (name: string): Promise<CreateTeamResponse> => {
  const response = await fetchAPI(`teams/`, {
    method: 'POST',
    body: JSON.stringify({
      name,
    }),
  });

  if (!response.ok) {
    throw new APIError(
      'Failed to create the team',
      await errorCauses(response),
    );
  }

  return response.json() as Promise<CreateTeamResponse>;
};

interface CreateTeamProps {
  onSuccess: (data: CreateTeamResponse) => void;
}

export function useCreateTeam({ onSuccess }: CreateTeamProps) {
  const queryClient = useQueryClient();
  return useMutation<CreateTeamResponse, APIError, string>({
    mutationFn: createTeam,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: [KEY_LIST_TEAM],
      });
      onSuccess(data);
    },
  });
}
