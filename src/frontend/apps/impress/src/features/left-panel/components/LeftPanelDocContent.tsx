import { Loader } from '@openfun/cunningham-react';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { Box, Text } from '@/components';
import { useDoc } from '@/features/docs';
import { SimpleDocItem } from '@/features/docs/docs-grid/components/SimpleDocItem';

export const LeftPanelDocContent = () => {
  const { t } = useTranslation();
  const params = useParams<{ id: string }>();
  const { id } = params;
  const { data, isFetching, isError } = useDoc({ id });

  if (isFetching) {
    return <Loader />;
  }

  if (isError || !data) {
    return (
      <Box $padding={{ horizontal: 'base' }}>
        <Text>{t('An error occurred while loading the file structure.')}</Text>
      </Box>
    );
  }

  return (
    <Box $padding={{ horizontal: 'sm' }}>
      <SimpleDocItem doc={data} showAccesses={true} />
    </Box>
  );
};
