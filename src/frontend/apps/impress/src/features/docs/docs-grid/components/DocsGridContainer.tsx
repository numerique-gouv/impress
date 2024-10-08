import { Button } from '@openfun/cunningham-react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@/components';
import { useCreateDoc, useTrans } from '@/features/docs/doc-management/';
import { useResponsiveStore } from '@/stores';

import { DocsGrid } from './DocsGrid';

export const DocsGridContainer = () => {
  const { t } = useTranslation();
  const { untitledDocument } = useTrans();
  const router = useRouter();
  const { isMobile } = useResponsiveStore();

  const { mutate: createDoc } = useCreateDoc({
    onSuccess: (doc) => {
      router.push(`/docs/${doc.id}`);
    },
  });

  const handleCreateDoc = () => {
    createDoc({ title: untitledDocument });
  };

  return (
    <Box $overflow="auto">
      <Box
        $align="flex-end"
        $justify="center"
        $margin={isMobile ? 'small' : 'big'}
      >
        <Button onClick={handleCreateDoc}>{t('Create a new document')}</Button>
      </Box>
      <DocsGrid />
    </Box>
  );
};
