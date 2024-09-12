import { useMutation, useQueryClient } from '@tanstack/react-query';
import { e2esdkClient } from '@/core/auth/useAuthStore';

import { APIError, errorCauses, fetchAPI } from '@/api';

import { Doc } from '../types';

import { KEY_LIST_DOC } from './useDocs';

export type CreateDocParam = Pick<Doc, 'title'>;

export const createDoc = async ({ title }: CreateDocParam): Promise<Doc> => {
  const response = await fetchAPI(`documents/`, {
    method: 'POST',
    body: JSON.stringify({
      title,
      is_e2ee: true
    }),
  });

  if (!response.ok) {
    throw new APIError('Failed to create the doc', await errorCauses(response));
  }

  const resp = await (response.json() as Promise<Doc>);

  const { keychainFingerprint } = await e2esdkClient.createNewKeychain(
    `docs:${resp.id}`,
    'secretBox'
  );

  console.log('new e2ee keychain registered', keychainFingerprint);

  return resp;
};

interface CreateDocProps {
  onSuccess: (data: Doc) => void;
}

export function useCreateDoc({ onSuccess }: CreateDocProps) {
  const queryClient = useQueryClient();
  return useMutation<Doc, APIError, CreateDocParam>({
    mutationFn: createDoc,
    onSuccess: (data) => {
      void queryClient.resetQueries({
        queryKey: [KEY_LIST_DOC],
      });
      onSuccess(data);
    },
  });
}
