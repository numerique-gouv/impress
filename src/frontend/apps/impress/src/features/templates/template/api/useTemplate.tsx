import { UseQueryOptions, useQuery } from '@tanstack/react-query';

import { APIError, errorCauses, fetchAPI } from '@/api';

import { Template } from '../types';

export type TemplateParams = {
  id: string;
};

export const getTemplate = async ({
  id,
}: TemplateParams): Promise<Template> => {
  const response = await fetchAPI(`templates/${id}`);

  if (!response.ok) {
    throw new APIError(
      'Failed to get the template',
      await errorCauses(response),
    );
  }

  return response.json() as Promise<Template>;
};

export const KEY_TEMPLATE = 'template';

export function useTemplate(
  param: TemplateParams,
  queryConfig?: UseQueryOptions<Template, APIError, Template>,
) {
  return useQuery<Template, APIError, Template>({
    queryKey: [KEY_TEMPLATE, param],
    queryFn: () => getTemplate(param),
    ...queryConfig,
  });
}
