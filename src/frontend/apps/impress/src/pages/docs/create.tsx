import { ReactElement } from 'react';

import { Box } from '@/components';
import { CardCreateDoc } from '@/features/docs/doc-management';
import { MainLayout } from '@/layouts';
import { NextPageWithLayout } from '@/types/next';

const Page: NextPageWithLayout = () => {
  return (
    <Box $padding="large" $justify="center" $align="start" $height="inherit">
      <CardCreateDoc />
    </Box>
  );
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default Page;
