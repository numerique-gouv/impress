import { ReactElement } from 'react';

import { Box } from '@/components';
import { MainLayout } from '@/core';
import { NextPageWithLayout } from '@/types/next';

const Page: NextPageWithLayout = () => {
  return <Box>Groups</Box>;
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default Page;
