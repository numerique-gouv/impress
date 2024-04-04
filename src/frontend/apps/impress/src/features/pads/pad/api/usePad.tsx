import { UseQueryOptions, useQuery } from '@tanstack/react-query';

import { APIError, errorCauses, fetchAPI } from '@/api';

import { Pad, Role } from '../types';

export type PadParams = {
  id: string;
};

export const getPad = async ({ id }: PadParams): Promise<Pad> => {
  /**
   * TODO: Remove this block when the API endpoint is ready
   */
  return await new Promise((resolve) => {
    const pad: Pad = {
      id: '1',
      name: 'My mocked pad',
      created_at: '2021-10-01T00:00:00Z',
      updated_at: '2021-10-01T00:00:00Z',
      accesses: [
        {
          id: '1',
          role: Role.MEMBER,
          user: {
            id: '1',
            name: 'user1',
            email: 'john@doe.com',
          },
          abilities: {
            delete: true,
            get: true,
            patch: true,
            put: true,
            set_role_to: [Role.MEMBER, Role.ADMIN],
          },
        },
      ],
      abilities: {
        delete: true,
        get: true,
        manage_accesses: true,
        patch: true,
        put: true,
      },
    };

    setTimeout(() => {
      resolve(pad);
    }, 500);
  });

  const response = await fetchAPI(`pads/${id}`);

  if (!response.ok) {
    throw new APIError('Failed to get the pad', await errorCauses(response));
  }

  return response.json() as Promise<Pad>;
};

export const KEY_PAD = 'pad';

export function usePad(
  param: PadParams,
  queryConfig?: UseQueryOptions<Pad, APIError, Pad>,
) {
  return useQuery<Pad, APIError, Pad>({
    queryKey: [KEY_PAD, param],
    queryFn: () => getPad(param),
    ...queryConfig,
  });
}
