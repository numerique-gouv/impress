import { useMutation } from '@tanstack/react-query';

import { APIError, errorCauses, fetchAPI } from '@/api';

import { Template } from '../types';

type UpdateTemplateProps = Pick<Template, 'code_editor' | 'id'>;

export const updateTemplateCodeEditor = async ({
  code_editor,
  id,
}: UpdateTemplateProps): Promise<Template> => {
  const response = await fetchAPI(`templates/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify({
      code_editor,
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

export function useUpdateTemplateCodeEditor(
  onSuccess?: (data: Template) => void,
) {
  return useMutation<Template, APIError, UpdateTemplateProps>({
    mutationFn: updateTemplateCodeEditor,
    onSuccess: (data) => {
      onSuccess?.(data);
    },
  });
}
