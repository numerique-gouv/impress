import { useMutation, useQueryClient } from '@tanstack/react-query';

import { APIError, errorCauses, fetchAPI } from '@/api';
import { KEY_LIST_TEMPLATE } from '@/features/templates';

type CreateTemplateResponse = {
  id: string;
  title: string;
};

export const createTemplate = async (
  title: string,
): Promise<CreateTemplateResponse> => {
  const response = await fetchAPI(`templates/`, {
    method: 'POST',
    body: JSON.stringify({
      title,
    }),
  });

  if (!response.ok) {
    throw new APIError(
      'Failed to create the template',
      await errorCauses(response),
    );
  }

  return response.json() as Promise<CreateTemplateResponse>;
};

interface CreateTemplateProps {
  onSuccess: (data: CreateTemplateResponse) => void;
}

export function useCreateTemplate({ onSuccess }: CreateTemplateProps) {
  const queryClient = useQueryClient();
  return useMutation<CreateTemplateResponse, APIError, string>({
    mutationFn: createTemplate,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: [KEY_LIST_TEMPLATE],
      });
      onSuccess(data);
    },
  });
}
