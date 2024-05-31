import { useMutation } from '@tanstack/react-query';

import { APIError, errorCauses, fetchAPI } from '@/api';
import { User } from '@/core/auth';
import { Pad, Role } from '@/features/pads/pad-management';

import { DocInvitation, OptionType } from '../types';

interface CreateDocInvitationParams {
  email: User['email'];
  role: Role;
  docId: Pad['id'];
}

export const createDocInvitation = async ({
  email,
  role,
  docId,
}: CreateDocInvitationParams): Promise<DocInvitation> => {
  const response = await fetchAPI(`documents/${docId}/invitations/`, {
    method: 'POST',
    body: JSON.stringify({
      email,
      role,
    }),
  });

  if (!response.ok) {
    throw new APIError(
      `Failed to create the invitation for ${email}`,
      await errorCauses(response, {
        value: email,
        type: OptionType.INVITATION,
      }),
    );
  }

  return response.json() as Promise<DocInvitation>;
};

export function useCreateInvitation() {
  return useMutation<DocInvitation, APIError, CreateDocInvitationParams>({
    mutationFn: createDocInvitation,
  });
}
