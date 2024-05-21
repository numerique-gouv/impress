import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import Icon404 from '@/assets/icons/icon-404.svg';
import { Box, Text } from '@/components';
import { NextPageWithLayout } from '@/types/next';

const Page: NextPageWithLayout = () => {
  const { t } = useTranslation();

  return (
    <Box $margin="auto">
      <Box $align="center" $gap="3rem">
        <Icon404 aria-label="Image 404" role="img" />
        <Box $direction="row" $align="flex-end" $gap="1rem">
          <Text
            as="h1"
            $margin="auto"
            $direction="row"
            $align="center"
            $gap="1rem"
          >
            {t('Coming soon ...')}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <Box $minHeight="100vh">{page}</Box>;
};

export default Page;
