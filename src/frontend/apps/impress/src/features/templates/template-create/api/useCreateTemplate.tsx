import { useMutation, useQueryClient } from '@tanstack/react-query';

import { APIError, errorCauses, fetchAPI } from '@/api';
import { KEY_LIST_TEMPLATE, Template } from '@/features/templates';

type CreateTemplateParam = Partial<Template>;

export const createTemplate = async (
  props: CreateTemplateParam,
): Promise<Template> => {
  const response = await fetchAPI(`templates/`, {
    method: 'POST',
    body: JSON.stringify(props),
  });

  if (!response.ok) {
    throw new APIError(
      'Failed to create the template',
      await errorCauses(response),
    );
  }

  return response.json() as Promise<Template>;
};

interface CreateTemplateProps {
  onSuccess: (data: Template) => void;
}

export function useCreateTemplate({ onSuccess }: CreateTemplateProps) {
  const queryClient = useQueryClient();
  return useMutation<Template, APIError, CreateTemplateParam>({
    mutationFn: createTemplate,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: [KEY_LIST_TEMPLATE],
      });
      onSuccess(data);
    },
  });
}
