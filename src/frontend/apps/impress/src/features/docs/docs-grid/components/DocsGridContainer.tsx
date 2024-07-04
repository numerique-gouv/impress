import { Button } from '@openfun/cunningham-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Card, StyledLink } from '@/components';

import { DocsGrid } from './DocsGrid';

export const DocsGridContainer = () => {
  const { t } = useTranslation();
  return (
    <Box $overflow="auto">
      <Card $margin="big" $padding="tiny">
        <Box $align="flex-end" $justify="center">
          <StyledLink href="/docs/create">
            <Button>{t('Create a new document')}</Button>
          </StyledLink>
        </Box>
      </Card>
      <DocsGrid />
    </Box>
  );
};
