import { UseQueryOptions, useQuery } from '@tanstack/react-query';

import { APIError, errorCauses, fetchAPI } from '@/api';

import { Pad } from '../types';

export type PadParams = {
  id: string;
};

export const getPad = async ({ id }: PadParams): Promise<Pad> => {
  const response = await fetchAPI(`documents/${id}`);

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
