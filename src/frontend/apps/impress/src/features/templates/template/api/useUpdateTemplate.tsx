import { useMutation, useQueryClient } from '@tanstack/react-query';

import { APIError, errorCauses, fetchAPI } from '@/api';

import { KEY_LIST_TEMPLATE } from '../../template-panel';
import { Template } from '../types';

import { KEY_TEMPLATE } from './useTemplate';

type UpdateTemplateProps = {
  id: Template['id'];
  css?: string;
  html?: string;
  title?: Template['title'];
};

export const updateTemplate = async ({
  id,
  title,
  css,
  html,
}: UpdateTemplateProps): Promise<Template> => {
  const response = await fetchAPI(`templates/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify({
      title,
      css,
      code: html,
    }),
  });

  if (!response.ok) {
    throw new APIError(
      'Failed to update the template',
      await errorCauses(response),
    );
  }

  return response.json() as Promise<Template>;
};

interface UseUpdateTemplateProps {
  onSuccess: (data: Template) => void;
}

export function useUpdateTemplate({ onSuccess }: UseUpdateTemplateProps) {
  const queryClient = useQueryClient();
  return useMutation<Template, APIError, UpdateTemplateProps>({
    mutationFn: updateTemplate,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: [KEY_LIST_TEMPLATE],
      });
      void queryClient.invalidateQueries({
        queryKey: [KEY_TEMPLATE],
      });
      onSuccess(data);
    },
  });
}
