import { useMutation } from '@tanstack/react-query';

import { APIError, errorCauses, fetchAPI } from '@/api';
import { User } from '@/core/auth';
import { Doc, Role } from '@/features/docs/doc-management';
import { ContentLanguage } from '@/i18n/types';

import { DocInvitation, OptionType } from '../types';

interface CreateDocInvitationParams {
  email: User['email'];
  role: Role;
  docId: Doc['id'];
  contentLanguage: ContentLanguage;
}

export const createDocInvitation = async ({
  email,
  role,
  docId,
  contentLanguage,
}: CreateDocInvitationParams): Promise<DocInvitation> => {
  const response = await fetchAPI(`documents/${docId}/invitations/`, {
    method: 'POST',
    headers: {
      'Content-Language': contentLanguage,
    },
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
