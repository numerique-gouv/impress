import { useCallback } from 'react';

import { useMediaUrl } from '@/core/config';

import { useCreateDocAttachment } from '../api';

export const useUploadFile = (docId: string) => {
  const mediaUrl = useMediaUrl();
  const {
    mutateAsync: createDocAttachment,
    isError: isErrorAttachment,
    error: errorAttachment,
  } = useCreateDocAttachment();

  const uploadFile = useCallback(
    async (file: File) => {
      const body = new FormData();
      body.append('file', file);

      const ret = await createDocAttachment({
        docId,
        body,
      });

      return `${mediaUrl}${ret.file}`;
    },
    [createDocAttachment, docId, mediaUrl],
  );

  return {
    uploadFile,
    isErrorAttachment,
    errorAttachment,
  };
};
